import { getCollection, type CollectionEntry } from 'astro:content'
import { CHAPTERS, CHAPTER_BY_ID, type Chapter } from '@/data/chapters'
import { CHAPTER_EN, SECTION_TITLES_EN } from '@/i18n/sections-en'
import { DEFAULT_LANG, type Lang } from '@/i18n'

export type SectionEntry = CollectionEntry<'sections'>

export interface TocSection {
  /** 集合 id，形如 `02-wavefunction/07-infinite-well`。**两种语言共用**，
   *  因为它同时是学习进度的存储键。 */
  id: string
  chapterId: string
  title: string
  /** 节号，如 "2.7"。章导言页为 undefined */
  section?: string
  order: number
  summary: string
  status: 'done' | 'draft' | 'stub'
  sims: string[]
  prereqs: string[]
  objectives: string[]
  /** 中文路由（保持向后兼容） */
  href: string
  /** 不含语言前缀的站内路径，如 `ch/02-wavefunction/07-infinite-well/` */
  path: string
  /** 目录树里显示的完整标题（含节号） */
  label: string
  /** 这一节在当前语言下是否真的有译文（false = 正文回退到中文） */
  translated: boolean
}

export interface TocChapter extends Chapter {
  href: string
  path: string
  sections: TocSection[]
  /** 已定稿小节数 / 总小节数，用于目录树上的完成度 */
  doneCount: number
}

function toTocSection(entry: SectionEntry): TocSection {
  const chapterId = entry.id.split('/')[0]!
  const d = entry.data
  return {
    id: entry.id,
    chapterId,
    title: d.title,
    section: d.section,
    order: d.order,
    summary: d.summary,
    status: d.status,
    sims: d.sims,
    prereqs: d.prereqs,
    objectives: d.objectives,
    href: `/ch/${entry.id}/`,
    path: `ch/${entry.id}/`,
    label: d.section ? `${d.section} ${d.title}` : d.title,
    translated: true,
  }
}

const cache = new Map<Lang, TocChapter[]>()

/**
 * 构建期归并 chapters.ts 与内容集合，得到完整目录树。
 *
 * 英文版的合并顺序：**英文 mdx 的 frontmatter → sections-en.ts 的标题表 → 中文原文**。
 * 中间那一层是为了让还没译正文的小节至少有个英文标题，导航不会中英混排。
 */
export async function getToc(lang: Lang = DEFAULT_LANG): Promise<TocChapter[]> {
  const hit = cache.get(lang)
  if (hit) return hit

  const entries = await getCollection('sections')
  const enEntries = lang === 'en' ? await getCollection('sectionsEn') : []
  const enById = new Map(enEntries.map((e) => [e.id, e]))

  const byChapter = new Map<string, TocSection[]>()

  for (const entry of entries) {
    let s = toTocSection(entry)
    if (lang === 'en') {
      const en = enById.get(entry.id)
      if (en) {
        s = { ...toTocSection(en as unknown as SectionEntry), id: entry.id, chapterId: s.chapterId }
        s.href = `/ch/${entry.id}/`
        s.path = `ch/${entry.id}/`
      } else {
        const title = SECTION_TITLES_EN[entry.id] ?? s.title
        s = {
          ...s,
          title,
          label: s.section ? `${s.section} ${title}` : title,
          translated: false,
        }
      }
    }
    if (!CHAPTER_BY_ID.has(s.chapterId)) {
      throw new Error(
        `内容文件 src/content/${entry.id}.mdx 所属的章 "${s.chapterId}" 未在 src/data/chapters.ts 中声明。`,
      )
    }
    const list = byChapter.get(s.chapterId) ?? []
    list.push(s)
    byChapter.set(s.chapterId, list)
  }

  const toc = CHAPTERS.map((chapter) => {
    const sections = (byChapter.get(chapter.id) ?? []).sort((a, b) => a.order - b.order)
    const en = lang === 'en' ? CHAPTER_EN[chapter.id] : undefined
    return {
      ...chapter,
      title: en?.title ?? chapter.title,
      blurb: en?.blurb ?? chapter.blurb,
      href: `/ch/${chapter.id}/`,
      path: `ch/${chapter.id}/`,
      sections,
      doneCount: sections.filter((s) => s.status === 'done').length,
    }
  })

  cache.set(lang, toc)
  return toc
}

/** 全站线性阅读顺序：章内按 order，章间按 chapters.ts 的声明顺序。 */
export async function getFlatSections(lang: Lang = DEFAULT_LANG): Promise<TocSection[]> {
  const toc = await getToc(lang)
  return toc.flatMap((c) => c.sections)
}

export async function getNeighbours(id: string, lang: Lang = DEFAULT_LANG) {
  const flat = await getFlatSections(lang)
  const i = flat.findIndex((s) => s.id === id)
  return {
    prev: i > 0 ? flat[i - 1] : undefined,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : undefined,
    index: i,
    total: flat.length,
  }
}

export async function getChapter(
  chapterId: string,
  lang: Lang = DEFAULT_LANG,
): Promise<TocChapter | undefined> {
  return (await getToc(lang)).find((c) => c.id === chapterId)
}

/**
 * 把 prereqs 里写的小节 id / 章 id 解析成可点的链接；
 * 解析不到的当作自由文本（例如「大学物理」「线性代数基础」）。
 */
export async function resolvePrereqs(prereqs: string[], lang: Lang = DEFAULT_LANG) {
  const flat = await getFlatSections(lang)
  const toc = await getToc(lang)
  return prereqs.map((p) => {
    const sec = flat.find((s) => s.id === p)
    if (sec) return { text: sec.label, path: sec.path }
    const ch = toc.find((c) => c.id === p)
    if (ch)
      return {
        text: lang === 'en' ? `Chapter ${ch.num} · ${ch.title}` : `第 ${ch.num} 章 ${ch.title}`,
        path: ch.path,
      }
    return { text: p, path: undefined }
  })
}
