import { getCollection, type CollectionEntry } from 'astro:content'
import { DEFAULT_LANG, type Lang } from '@/i18n'

/**
 * 3D 模块（实验室）的目录与导航。
 *
 * 与 src/lib/toc.ts 的关系：toc 管教材章节树，这里管 3D 模块序列。
 * 两者通过 lab 模块 frontmatter 里的 related（教材小节 id）互相指路。
 *
 * 文件放在 src/lab/<lang>/<slug>.mdx，所以集合 id 形如 `zh/05-spin`。
 * slug 在两种语言下保持一致，切换语言时才能停在同一个模块上。
 */

export type LabEntry = CollectionEntry<'lab'>

export interface LabModule {
  /** 语言无关的模块 slug，如 `05-spin` */
  slug: string
  /** 集合 id，形如 `zh/05-spin` */
  id: string
  lang: Lang
  num: string
  title: string
  goal: string
  youWillSee: string[]
  prereqs: string[]
  scenes: string[]
  related: string[]
  phase: number
  status: 'done' | 'draft' | 'stub'
  /** 不含语言前缀的站内路径，如 `lab/05-spin/` */
  path: string
  /** 目录里显示的完整标题 */
  label: string
}

function toModule(entry: LabEntry): LabModule {
  const [langPart, ...rest] = entry.id.split('/')
  const lang: Lang = langPart === 'en' ? 'en' : 'zh'
  const slug = rest.join('/')
  const d = entry.data
  return {
    slug,
    id: entry.id,
    lang,
    num: d.num,
    title: d.title,
    goal: d.goal,
    youWillSee: d.youWillSee,
    prereqs: d.prereqs,
    scenes: d.scenes,
    related: d.related,
    phase: d.phase,
    status: d.status,
    path: `lab/${slug}/`,
    label: `${d.num}. ${d.title}`,
  }
}

const cache = new Map<Lang, LabModule[]>()

/**
 * 某个语言下的全部模块，按模块号排序。
 *
 * 英文缺某个模块时回退到中文那一份的元数据——这样导航不会突然少一项，
 * 而页面上会照常显示中文正文（缺翻译比缺整页要好）。
 */
export async function getLabModules(lang: Lang = DEFAULT_LANG): Promise<LabModule[]> {
  const hit = cache.get(lang)
  if (hit) return hit
  const entries = await getCollection('lab')
  const all = entries.map(toModule)
  const wanted = all.filter((m) => m.lang === lang)
  const fallback = all.filter((m) => m.lang === DEFAULT_LANG)
  const bySlug = new Map(wanted.map((m) => [m.slug, m]))
  for (const m of fallback) if (!bySlug.has(m.slug)) bySlug.set(m.slug, m)
  const list = [...bySlug.values()].sort((a, b) => a.num.localeCompare(b.num, 'en'))
  cache.set(lang, list)
  return list
}

/** 某个语言下真正存在的模块（不含回退），用于生成路由 */
export async function getLabEntries(lang: Lang): Promise<LabModule[]> {
  const entries = await getCollection('lab')
  return entries
    .map(toModule)
    .filter((m) => m.lang === lang)
    .sort((a, b) => a.num.localeCompare(b.num, 'en'))
}

export async function getLabNeighbours(slug: string, lang: Lang = DEFAULT_LANG) {
  const mods = await getLabModules(lang)
  const i = mods.findIndex((m) => m.slug === slug)
  return {
    prev: i > 0 ? mods[i - 1]! : null,
    next: i >= 0 && i < mods.length - 1 ? mods[i + 1]! : null,
    index: i + 1,
    total: mods.length,
  }
}

/** 全站一共有多少个 3D 场景（首页统计用） */
export async function countScenes(): Promise<number> {
  const mods = await getLabModules(DEFAULT_LANG)
  const set = new Set<string>()
  for (const m of mods) for (const s of m.scenes) set.add(s)
  return set.size
}
