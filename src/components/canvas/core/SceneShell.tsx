import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from 'react'
import type { SceneApi } from './SceneCanvas'
import { useSceneStore, type Quality } from './sceneStore'
import { markSimCompleted, getSection } from '@/lib/progress'
import { translator, DEFAULT_LANG, type Lang } from '@/i18n'
import { LangContext } from '@/i18n/react'

/**
 * 3D 教学场景的统一外壳。
 *
 * 对应验收标准里那几条横切要求：3 秒看懂（顶部一句话说明看什么）、
 * 有观察指南、可全屏、可重置视角、性能可见可调。场景组件只负责画面与物理，
 * 这些壳层能力一律不重复实现。
 */

export interface SceneShellProps {
  /** 场景 id，用于本地进度记录 */
  id: string
  title: string
  /** 一句话说明「你将看见什么」——3 秒理解规则靠它 */
  subtitle: ReactNode
  /** 画布（通常是 <SceneCanvas>） */
  children: ReactNode
  /** 右侧控制面板 */
  controls?: ReactNode
  /** 画布下方的实时读数 */
  readout?: ReactNode
  /** 观察指南：告诉用户该看什么、调什么 */
  guide?: ReactNode[]
  /** 常见错误直觉 */
  pitfalls?: { title: string; body: ReactNode }[]
  /** 反思问题 */
  reflect?: ReactNode[]
  /** 场景暴露的命令接口，用于截图 / 重置视角 */
  apiRef?: MutableRefObject<SceneApi | null>
  /** 桌面端画布高度 */
  height?: number
  /** 所属小节 id（进度归档用），缺省从 body[data-section-id] 读 */
  sectionId?: string
  /** 界面语言。外壳会被服务端渲染，所以必须用 props 传，不能在客户端才读 */
  lang?: Lang
}

const QUALITY_LABEL: Record<Quality, string> = { high: '高', medium: '中', low: '低' }

function IconButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void
  title: string
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        'rounded-md p-1.5 transition-colors ' +
        (active
          ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
          : 'text-[var(--text-faint)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]')
      }
    >
      {children}
    </button>
  )
}

/** 显示设置浮层：性能档位、色盲配色、高对比度、场景标注 */
function DisplaySettings({ onClose, T }: { onClose: () => void; T: (s: string, ...a: (string | number)[]) => string }) {
  const {
    quality,
    setQuality,
    qualityLocked,
    palette,
    setPalette,
    highContrast,
    setHighContrast,
    labels,
    setLabels,
    fps,
  } = useSceneStore()

  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    // 延后一帧再挂，否则打开面板的那次点击会立刻把它关掉
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 z-20 mt-1 w-[248px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-card)]"
    >
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-[var(--text-faint)] uppercase">
        {T('显示设置')}
      </p>

      <div className="mb-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[12.5px] text-[var(--text-muted)]">{T('渲染精度')}</span>
          <span className="font-mono text-[11px] text-[var(--text-faint)]">{fps} fps</span>
        </div>
        <div className="flex gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-0.5">
          {(['low', 'medium', 'high'] as Quality[]).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(q)}
              className={
                'flex-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors ' +
                (quality === q
                  ? 'bg-[var(--bg-elevated)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]')
              }
            >
              {T(QUALITY_LABEL[q])}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-[var(--text-faint)]">
          {qualityLocked ? T('已手动锁定，不再自动降级。') : T('帧率过低时会自动降一档。')}
        </p>
      </div>

      <label className="mb-2 flex cursor-pointer items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
        <input
          type="checkbox"
          className="ql-checkbox"
          checked={palette === 'colorblind'}
          onChange={(e) => setPalette(e.target.checked ? 'colorblind' : 'standard')}
        />
        {T('色盲友好配色')}
      </label>
      <label className="mb-2 flex cursor-pointer items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
        <input
          type="checkbox"
          className="ql-checkbox"
          checked={highContrast}
          onChange={(e) => setHighContrast(e.target.checked)}
        />
        {T('高对比度')}
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
        <input
          type="checkbox"
          className="ql-checkbox"
          checked={labels}
          onChange={(e) => setLabels(e.target.checked)}
        />
        {T('场景内标注')}
      </label>
    </div>
  )
}

export default function SceneShell(props: SceneShellProps) {
  const {
    id,
    title,
    subtitle,
    children,
    controls,
    readout,
    guide,
    pitfalls,
    reflect,
    apiRef,
    height = 520,
    lang = DEFAULT_LANG,
  } = props

  const T = translator(lang)

  const rootRef = useRef<HTMLElement | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [settings, setSettings] = useState(false)
  const [done, setDone] = useState(false)
  const [sectionId, setSectionId] = useState<string | undefined>(props.sectionId)

  useEffect(() => {
    const resolved = props.sectionId ?? document.body.dataset.sectionId
    setSectionId(resolved)
    if (resolved) setDone((getSection(resolved).sims ?? []).includes(id))
  }, [props.sectionId, id])

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch {
      // iOS Safari 上普通元素不支持全屏；场景本身仍可用，静默降级
    }
  }, [])

  const shoot = useCallback(() => {
    const url = apiRef?.current?.screenshot()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `quantum-ladder-${id}.png`
    a.click()
  }, [apiRef, id])

  const markDone = useCallback(() => {
    if (!sectionId) return
    markSimCompleted(sectionId, id)
    setDone(true)
  }, [sectionId, id])

  return (
    <LangContext.Provider value={lang}>
    <figure
      ref={rootRef as MutableRefObject<HTMLElement>}
      id={`scene-${id}`}
      className={
        'not-prose my-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] ' +
        (fullscreen ? 'flex h-screen flex-col' : '')
      }
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--text)]">
            <span aria-hidden className="text-[var(--accent)]">
              ◆
            </span>
            {title}
          </h4>
          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          <IconButton onClick={() => apiRef?.current?.resetView()} title={T('重置视角')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </IconButton>
          <IconButton onClick={shoot} title={T('保存当前画面为 PNG')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h3l2-2h8l2 2h3v12H3z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </IconButton>
          <IconButton onClick={() => setSettings((v) => !v)} title={T('显示设置')} active={settings}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
            </svg>
          </IconButton>
          <IconButton onClick={toggleFullscreen} title={fullscreen ? T('退出全屏') : T('全屏')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {fullscreen ? (
                <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
              ) : (
                <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
              )}
            </svg>
          </IconButton>
          {settings ? <DisplaySettings onClose={() => setSettings(false)} T={T} /> : null}
        </div>
      </header>

      <div className={'flex flex-col lg:flex-row ' + (fullscreen ? 'min-h-0 flex-1' : '')}>
        <div
          className={
            'relative min-w-0 flex-1 bg-[var(--bg)] ' + (fullscreen ? 'h-full' : 'h-[62vh] lg:h-auto')
          }
          style={fullscreen ? undefined : { minHeight: height }}
        >
          {children}
        </div>
        {controls ? (
          <div
            className={
              'sim-controls no-print shrink-0 space-y-4 border-t border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-4 lg:w-[290px] lg:border-t-0 lg:border-l ' +
              (fullscreen ? 'overflow-y-auto' : '')
            }
          >
            {controls}
          </div>
        ) : null}
      </div>

      {readout ? (
        <div className="border-t border-[var(--border)] px-4 py-3">{readout}</div>
      ) : null}

      {!fullscreen && (guide?.length || pitfalls?.length || reflect?.length) ? (
        <figcaption className="border-t border-[var(--border)]">
          {guide?.length ? (
            <div className="px-4 py-3">
              <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-[var(--text-faint)] uppercase">
                {T('观察指南')}
              </p>
              <ul className="space-y-1.5">
                {guide.map((g, i) => (
                  <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                    <span aria-hidden className="mt-[3px] shrink-0 text-[var(--accent)]">
                      →
                    </span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {pitfalls?.length ? (
            <div className="grid gap-2 border-t border-[var(--border)] px-4 py-3 sm:grid-cols-2">
              {pitfalls.map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--c-warn)]/30 bg-[color-mix(in_srgb,var(--c-warn)_8%,transparent)] px-3 py-2"
                >
                  <p className="text-[12.5px] font-semibold text-[var(--c-warn)]">✕ {p.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">{p.body}</p>
                </div>
              ))}
            </div>
          ) : null}

          {reflect?.length ? (
            <div className="border-t border-[var(--border)] px-4 py-3">
              <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-[var(--text-faint)] uppercase">
                {T('想一想')}
              </p>
              <ol className="space-y-1.5">
                {reflect.map((r, i) => (
                  <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                    <span aria-hidden className="mt-[1px] shrink-0 font-mono text-[12px] text-[var(--text-faint)]">
                      {i + 1}.
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={markDone}
                disabled={done || !sectionId}
                className={
                  'no-print mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition-colors disabled:opacity-60 ' +
                  (done
                    ? 'border-transparent bg-[var(--accent-soft)] text-[var(--accent-text)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]')
                }
              >
                {done ? T('✓ 已探究') : T('标记为已探究')}
              </button>
            </div>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
    </LangContext.Provider>
  )
}
