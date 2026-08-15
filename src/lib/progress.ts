/**
 * 本地学习进度 —— 纯 localStorage，无后端。
 *
 * 同时被 Astro 里的原生脚本（侧栏勾选、章节头）和 React 岛（自测题、自评）读写，
 * 所以做成框架无关的小 store：写入后广播 `ql:progress` 事件，各处自行重渲染。
 */

export const STORAGE_KEY = 'ql:progress:v1'
export const PROGRESS_EVENT = 'ql:progress'

/** 掌握程度自评：对应规格里的「未学 / 了解 / 掌握 / 精通」 */
export type Mastery = 0 | 1 | 2 | 3

export const MASTERY_LABEL: Record<Mastery, string> = {
  0: '未学',
  1: '了解',
  2: '掌握',
  3: '精通',
}

export interface SectionProgress {
  /** 是否标记为已读 */
  read?: boolean
  mastery?: Mastery
  /** 自测题最好成绩 */
  quiz?: { score: number; total: number; at: number }
  /** 已完整跑过的模拟 id */
  sims?: string[]
  /** 最后一次访问时间戳，用于「继续上次阅读」 */
  visitedAt?: number
}

export type ProgressState = Record<string, SectionProgress>

const isBrowser = typeof window !== 'undefined'

let memo: ProgressState | null = null

export function loadProgress(): ProgressState {
  if (!isBrowser) return {}
  if (memo) return memo
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    memo = raw ? (JSON.parse(raw) as ProgressState) : {}
  } catch {
    // 隐私模式 / 配额满 / 数据损坏：退化成内存态，不影响阅读
    memo = {}
  }
  return memo!
}

function persist(state: ProgressState) {
  memo = state
  if (!isBrowser) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* 忽略写入失败 */
  }
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: state }))
}

export function getSection(id: string): SectionProgress {
  return loadProgress()[id] ?? {}
}

export function updateSection(id: string, patch: Partial<SectionProgress>): SectionProgress {
  const state = { ...loadProgress() }
  const next = { ...(state[id] ?? {}), ...patch }
  state[id] = next
  persist(state)
  return next
}

export function markRead(id: string, read = true) {
  return updateSection(id, { read })
}

export function markVisited(id: string) {
  return updateSection(id, { visitedAt: Date.now() })
}

export function setMastery(id: string, mastery: Mastery) {
  return updateSection(id, { mastery })
}

export function recordQuiz(id: string, score: number, total: number) {
  const prev = getSection(id).quiz
  // 只保留最好成绩，重做不会把记录刷低
  if (prev && prev.score >= score) return prev
  updateSection(id, { quiz: { score, total, at: Date.now() } })
  return getSection(id).quiz!
}

export function markSimCompleted(id: string, simId: string) {
  const prev = getSection(id).sims ?? []
  if (prev.includes(simId)) return prev
  const next = [...prev, simId]
  updateSection(id, { sims: next })
  return next
}

export function resetProgress() {
  persist({})
}

/** 最近访问且未读完的一节，首页「继续学习」用。 */
export function lastVisited(): { id: string; at: number } | null {
  const state = loadProgress()
  let best: { id: string; at: number } | null = null
  for (const [id, p] of Object.entries(state)) {
    if (!p.visitedAt) continue
    if (!best || p.visitedAt > best.at) best = { id, at: p.visitedAt }
  }
  return best
}

export function summarise(allIds: string[]) {
  const state = loadProgress()
  let read = 0
  let mastered = 0
  for (const id of allIds) {
    const p = state[id]
    if (!p) continue
    if (p.read) read += 1
    if ((p.mastery ?? 0) >= 2) mastered += 1
  }
  return { read, mastered, total: allIds.length }
}

export function onProgressChange(fn: (state: ProgressState) => void): () => void {
  if (!isBrowser) return () => {}
  const handler = (e: Event) => fn((e as CustomEvent<ProgressState>).detail)
  // 跨标签页同步
  const storageHandler = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    memo = null
    fn(loadProgress())
  }
  window.addEventListener(PROGRESS_EVENT, handler)
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener(PROGRESS_EVENT, handler)
    window.removeEventListener('storage', storageHandler)
  }
}
