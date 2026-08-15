/**
 * 客户端全文搜索。
 *
 * 为什么自己写而不用 Fuse / MiniSearch / Pagefind：
 * 中文没有空格分词，通用库要么按空格切（整段变成一个词，只能全匹配），
 * 要么得额外拉一个分词器（体积翻倍）。而这里的语料只有几十到几百个小节，
 * 直接做「查询串 → 字/二元组」的加权子串计数就够快也够准，索引还小。
 * 公式关键词（如 "薛定谔"、"Hermite"、"CHSH"）恰好都能被这种方式命中。
 */

export interface SearchDoc {
  id: string
  href: string
  /** 章号 + 节号，如 "2.7" */
  label: string
  chapter: string
  title: string
  summary: string
  /** 小节内的二级标题，命中时可直接跳过去 */
  headings: string[]
  /** 去掉 MDX / 公式标记后的正文，已截断 */
  body: string
  status: string
}

export interface SearchHit {
  doc: SearchDoc
  score: number
  /** 命中片段（正文中含关键词的一小段），用于结果预览 */
  excerpt: string
  /** 需要高亮的子串 */
  terms: string[]
}

const FIELD_WEIGHT = { title: 12, label: 10, summary: 5, headings: 4, body: 1 } as const

/** 拆查询：ASCII 按空白切词，CJK 切成单字 + 相邻二元组 */
export function tokenize(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tokens = new Set<string>()

  for (const m of q.matchAll(/[a-z0-9_\-+']+/g)) {
    if (m[0].length >= 1) tokens.add(m[0])
  }

  // 保留 CJK 统一表意文字（含扩展 A）与假名，其余一律当分隔符
  const cjk = q.replace(/[^㐀-䶿一-鿿぀-ヿ]/g, ' ')
  for (const run of cjk.split(/\s+/)) {
    if (!run) continue
    if (run.length === 1) {
      tokens.add(run)
      continue
    }
    // 二元组比单字精确得多：「波函」「函数」远比「波」「函」「数」有区分度
    for (let i = 0; i < run.length - 1; i++) tokens.add(run.slice(i, i + 2))
    // 整串也放进去，长词完整命中时给额外加分
    if (run.length > 2) tokens.add(run)
  }

  return [...tokens]
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let i = haystack.indexOf(needle)
  while (i !== -1) {
    count += 1
    i = haystack.indexOf(needle, i + needle.length)
  }
  return count
}

function makeExcerpt(body: string, terms: string[], radius = 46): string {
  const lower = body.toLowerCase()
  let best = -1
  let bestTerm = ''
  for (const t of terms) {
    const i = lower.indexOf(t)
    if (i !== -1 && (best === -1 || t.length > bestTerm.length)) {
      best = i
      bestTerm = t
    }
  }
  if (best === -1) return body.slice(0, radius * 2) + (body.length > radius * 2 ? '…' : '')
  const start = Math.max(0, best - radius)
  const end = Math.min(body.length, best + bestTerm.length + radius)
  return (start > 0 ? '…' : '') + body.slice(start, end) + (end < body.length ? '…' : '')
}

export function search(docs: SearchDoc[], query: string, limit = 20): SearchHit[] {
  const terms = tokenize(query)
  if (!terms.length) return []

  const hits: SearchHit[] = []
  for (const doc of docs) {
    const fields = {
      title: doc.title.toLowerCase(),
      label: doc.label.toLowerCase(),
      summary: doc.summary.toLowerCase(),
      headings: doc.headings.join(' ').toLowerCase(),
      body: doc.body.toLowerCase(),
    }

    let score = 0
    let matchedTerms = 0
    for (const term of terms) {
      let termScore = 0
      for (const [field, weight] of Object.entries(FIELD_WEIGHT)) {
        const c = countOccurrences(fields[field as keyof typeof fields], term)
        if (c === 0) continue
        // 次数取对数：正文里出现 30 次不该压过标题命中一次
        termScore += weight * (1 + Math.log(c)) * Math.min(term.length, 4)
      }
      if (termScore > 0) matchedTerms += 1
      score += termScore
    }

    if (score === 0) continue
    // 命中的关键词种类越多越靠前，避免单字高频词刷榜
    score *= 1 + matchedTerms / terms.length
    hits.push({ doc, score, excerpt: makeExcerpt(doc.body, terms), terms })
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * 把 MDX 源码压成可检索的纯文本：
 * 去掉 frontmatter、import、JSX 标签、代码块、公式定界符，保留公式里的文字与命令名
 * （这样搜 "Hermite" 能命中 \mathrm{H}_n 附近的正文，搜 "psi" 也能命中 \psi）。
 */
export function mdxToPlainText(source: string, maxLength = 4000): string {
  let s = source
  s = s.replace(/^---\n[\s\S]*?\n---\n/, '')
  s = s.replace(/^import .*$/gm, '')
  s = s.replace(/```[\s\S]*?```/g, ' ')
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, m: string) => ' ' + m.replace(/\\/g, ' ') + ' ')
  s = s.replace(/\$([^$\n]+)\$/g, (_, m: string) => ' ' + m.replace(/\\/g, ' ') + ' ')
  s = s.replace(/[#*_`>|{}[\]()]/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s.length > maxLength ? s.slice(0, maxLength) : s
}

/** 从 MDX 源码里抽二级/三级标题 */
export function extractHeadings(source: string): string[] {
  const out: string[] = []
  for (const m of source.matchAll(/^#{2,3}\s+(.+)$/gm)) {
    out.push(m[1]!.replace(/[#*`]/g, '').trim())
  }
  return out
}
