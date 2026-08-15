import { getCollection, type CollectionEntry } from 'astro:content'

/**
 * 3D 模块（实验室）的目录与导航。
 *
 * 与 src/lib/toc.ts 的关系：toc 管教材章节树，这里管 3D 模块序列。
 * 两者通过 lab 模块 frontmatter 里的 related（教材小节 id）互相指路。
 */

export type LabEntry = CollectionEntry<'lab'>

export interface LabModule {
  id: string
  num: string
  title: string
  goal: string
  youWillSee: string[]
  prereqs: string[]
  scenes: string[]
  related: string[]
  phase: number
  status: 'done' | 'draft' | 'stub'
  href: string
  /** 目录里显示的完整标题 */
  label: string
}

function toModule(entry: LabEntry): LabModule {
  const d = entry.data
  return {
    id: entry.id,
    num: d.num,
    title: d.title,
    goal: d.goal,
    youWillSee: d.youWillSee,
    prereqs: d.prereqs,
    scenes: d.scenes,
    related: d.related,
    phase: d.phase,
    status: d.status,
    href: `/lab/${entry.id}/`,
    label: `${d.num}. ${d.title}`,
  }
}

let cache: LabModule[] | null = null

export async function getLabModules(): Promise<LabModule[]> {
  if (cache) return cache
  const entries = await getCollection('lab')
  cache = entries.map(toModule).sort((a, b) => a.num.localeCompare(b.num, 'en'))
  return cache
}

export async function getLabNeighbours(id: string) {
  const mods = await getLabModules()
  const i = mods.findIndex((m) => m.id === id)
  return {
    prev: i > 0 ? mods[i - 1]! : null,
    next: i >= 0 && i < mods.length - 1 ? mods[i + 1]! : null,
    index: i + 1,
    total: mods.length,
  }
}

/** 全站一共有多少个 3D 场景（首页统计用） */
export async function countScenes(): Promise<number> {
  const mods = await getLabModules()
  const set = new Set<string>()
  for (const m of mods) for (const s of m.scenes) set.add(s)
  return set.size
}
