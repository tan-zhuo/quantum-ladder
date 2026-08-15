import { useEffect, useRef, useState, type ReactNode } from 'react'
import { markSimCompleted, getSection } from '@/lib/progress'

/**
 * 所有交互模拟的统一外壳：标题、说明、画布区、控件区、探究提示、全屏。
 *
 * 为什么统一：规格要求「至少一个高价值交互模拟」且移动端可操作。
 * 把全屏、重置、完成标记、打印隐藏这些横切逻辑集中在这里，
 * 每个模拟组件只需要关心自己的物理与绘图。
 */
export interface SimShellProps {
  /** 模拟 id，用于本地进度记录 */
  id: string
  /** 所属小节 id（进度按小节归档）；由 MDX 包装组件注入 */
  sectionId?: string
  title: string
  /** 一句话说明这个模拟要让你看见什么 */
  subtitle?: ReactNode
  /** 画布 / 可视化区域 */
  children: ReactNode
  /** 控件区 */
  controls?: ReactNode
  /** 读数区（画布下方） */
  readout?: ReactNode
  /** 「试试看」引导问题——模拟的教学价值主要来自这里 */
  prompts?: ReactNode[]
  onReset?: () => void
  /** 画布区高宽比，移动端用 */
  aspect?: string
}

export default function SimShell(props: SimShellProps) {
  const { id, title, subtitle, children, controls, readout, prompts, onReset } = props
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [done, setDone] = useState(false)
  // 所属小节默认从页面根元素读（ChapterLayout 写在 body 上），
  // 这样 MDX 里嵌入模拟只要 <InfiniteWell client:visible />，不必每次重复传 id
  const [sectionId, setSectionId] = useState<string | undefined>(props.sectionId)

  useEffect(() => {
    const resolved = props.sectionId ?? document.body.dataset.sectionId
    setSectionId(resolved)
    if (!resolved) return
    setDone((getSection(resolved).sims ?? []).includes(id))
  }, [props.sectionId, id])

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  async function toggleFullscreen() {
    const el = rootRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch {
      // iOS Safari 上 <div> 不支持全屏；退化成不做事，模拟本身仍可用
    }
  }

  function markDone() {
    if (!sectionId) return
    markSimCompleted(sectionId, id)
    setDone(true)
  }

  return (
    <figure
      ref={rootRef}
      id={`sim-${id}`}
      className={
        'not-prose my-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] print-break-avoid ' +
        (fullscreen ? 'flex h-screen flex-col' : '')
      }
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--text)]">
            <span aria-hidden className="text-[var(--accent)]">
              ◈
            </span>
            {title}
          </h4>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="no-print flex shrink-0 items-center gap-1">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              title="重置参数"
              className="rounded-md p-1.5 text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={fullscreen ? '退出全屏' : '全屏'}
            className="rounded-md p-1.5 text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {fullscreen ? (
                <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
              ) : (
                <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <div className={'relative bg-[var(--bg)] ' + (fullscreen ? 'min-h-0 flex-1' : '')}>{children}</div>

      {readout ? (
        <div className="border-t border-[var(--border)] px-4 py-3">{readout}</div>
      ) : null}

      {controls ? (
        <div className="sim-controls no-print border-t border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-4">
          {controls}
        </div>
      ) : null}

      {prompts?.length ? (
        <figcaption className="border-t border-[var(--border)] px-4 py-3">
          <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-[var(--text-faint)] uppercase">
            试试看
          </p>
          <ul className="space-y-1.5">
            {prompts.map((p, i) => (
              <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                <span aria-hidden className="mt-[3px] shrink-0 text-[var(--accent)]">
                  →
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          {sectionId ? (
            <button
              type="button"
              onClick={markDone}
              disabled={done}
              className={
                'no-print mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition-colors ' +
                (done
                  ? 'border-transparent bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]')
              }
            >
              {done ? '✓ 已完成探究' : '标记为已探究'}
            </button>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  )
}
