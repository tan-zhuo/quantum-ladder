import { getCollection, type CollectionEntry } from 'astro:content'
import { CHAPTERS, CHAPTER_BY_ID, type Chapter } from '@/data/chapters'

export type SectionEntry = CollectionEntry<'sections'>

export interface TocSection {
  /** 集合 id，形如 `02-wavefunction/07-infinite-well` */
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
  href: string
  /** 目录树里显示的完整标题（含节号） */
  label: string
}

export interface TocChapter extends Chapter {
  href: string
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
    label: d.section ? `${d.section} ${d.title}` : d.title,
  }
}

let cache: TocChapter[] | null = null

/** 构建期归并 chapters.ts 与 content collection，得到完整目录树。 */
export async function getToc(): Promise<TocChapter[]> {
  if (cache) return cache

  const entries = await getCollection('sections')
  const byChapter = new Map<string, TocSection[]>()

  for (const entry of entries) {
    const s = toTocSection(entry)
    if (!CHAPTER_BY_ID.has(s.chapterId)) {
      throw new Error(
        `内容文件 src/content/${entry.id}.mdx 所属的章 "${s.chapterId}" 未在 src/data/chapters.ts 中声明。`,
      )
    }
    const list = byChapter.get(s.chapterId) ?? []
    list.push(s)
    byChapter.set(s.chapterId, list)
  }

  cache = CHAPTERS.map((chapter) => {
    const sections = (byChapter.get(chapter.id) ?? []).sort((a, b) => a.order - b.order)
    return {
      ...chapter,
      href: `/ch/${chapter.id}/`,
      sections,
      doneCount: sections.filter((s) => s.status === 'done').length,
    }
  })

  return cache
}

/** 全站线性阅读顺序：章内按 order，章间按 chapters.ts 的声明顺序。 */
export async function getFlatSections(): Promise<TocSection[]> {
  const toc = await getToc()
  return toc.flatMap((c) => c.sections)
}

export async function getNeighbours(id: string) {
  const flat = await getFlatSections()
  const i = flat.findIndex((s) => s.id === id)
  return {
    prev: i > 0 ? flat[i - 1] : undefined,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : undefined,
    index: i,
    total: flat.length,
  }
}

export async function getChapter(chapterId: string): Promise<TocChapter | undefined> {
  return (await getToc()).find((c) => c.id === chapterId)
}

/**
 * 把 prereqs 里写的小节 id / 章 id 解析成可点的链接；
 * 解析不到的当作自由文本（例如「大学物理」「线性代数基础」）。
 */
export async function resolvePrereqs(prereqs: string[]) {
  const flat = await getFlatSections()
  const toc = await getToc()
  return prereqs.map((p) => {
    const sec = flat.find((s) => s.id === p)
    if (sec) return { text: sec.label, href: sec.href }
    const ch = toc.find((c) => c.id === p)
    if (ch) return { text: `第 ${ch.num} 章 ${ch.title}`, href: ch.href }
    return { text: p, href: undefined }
  })
}
