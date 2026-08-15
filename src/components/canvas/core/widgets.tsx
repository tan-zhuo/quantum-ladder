import type { ReactNode } from 'react'
import { useScenePalette } from './theme'
import { useUiT } from '@/i18n/react'

/**
 * 控制面板里的通用小部件。基础控件（滑块、开关、分段选择）复用
 * src/components/sim/controls.tsx —— 2D 模拟和 3D 场景应当长得一模一样，
 * 学习者不需要在同一个站点里适应两套控件语言。
 */

export function ControlGroup({
  title,
  children,
  hint,
}: {
  title?: ReactNode
  children: ReactNode
  hint?: ReactNode
}) {
  return (
    <section className="space-y-2.5">
      {title ? (
        <h5 className="text-[11px] font-semibold tracking-wide text-[var(--text-faint)] uppercase">
          {title}
        </h5>
      ) : null}
      {children}
      {hint ? <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">{hint}</p> : null}
    </section>
  )
}

/** 时间演化控制：播放/暂停、速度、进度拖动、回到起点 */
export function TimeBar({
  playing,
  onPlay,
  onReset,
  speed,
  onSpeed,
  progress,
  onSeek,
  timeLabel,
}: {
  playing: boolean
  onPlay: (v: boolean) => void
  onReset: () => void
  speed: number
  onSpeed: (v: number) => void
  /** 0~1；不传则不显示进度条（无限演化的场景） */
  progress?: number
  onSeek?: (v: number) => void
  timeLabel?: ReactNode
}) {
  const T = useUiT()
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPlay(!playing)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4l13 8-13 8z" />
            </svg>
          )}
          {playing ? T('暂停') : T('播放')}
        </button>
        <button
          type="button"
          onClick={onReset}
          title={T('回到 t = 0')}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-1.5 text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 5v14l-12-7z" />
            <path d="M5 5v14" />
          </svg>
        </button>
        {timeLabel ? (
          <span className="ml-auto font-mono text-[12px] tabular-nums text-[var(--text-muted)]">
            {timeLabel}
          </span>
        ) : null}
      </div>

      {progress !== undefined && onSeek ? (
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="ql-range"
          aria-label={T('演化进度')}
        />
      ) : null}

      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[var(--text-faint)]">{T('速度')}</span>
        <div className="flex gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-0.5">
          {[0.25, 0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeed(s)}
              className={
                'rounded-md px-1.5 py-0.5 font-mono text-[11.5px] transition-colors ' +
                (Math.abs(speed - s) < 1e-6
                  ? 'bg-[var(--bg-elevated)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]')
              }
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export interface LegendItem {
  color: string
  label: ReactNode
  /** 虚线样式 */
  dashed?: boolean
  hint?: string
}

/** 图例。每个 3D 场景都必须有——颜色不解释清楚，画面再漂亮也读不懂。 */
export function Legend({ items, dense = false }: { items: LegendItem[]; dense?: boolean }) {
  return (
    <ul className={'flex flex-wrap ' + (dense ? 'gap-x-3 gap-y-1' : 'gap-x-4 gap-y-1.5')}>
      {items.map((it, i) => (
        <li
          key={i}
          title={it.hint}
          className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"
        >
          <span
            aria-hidden
            className="inline-block h-[3px] w-4 rounded-full"
            style={
              it.dashed
                ? {
                    backgroundImage: `repeating-linear-gradient(90deg, ${it.color} 0 4px, transparent 4px 7px)`,
                  }
                : { background: it.color }
            }
          />
          {it.label}
        </li>
      ))}
    </ul>
  )
}

/** 画布内的图例（叠在角落），适合全屏时仍需要看图例的场景 */
export function CanvasLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="pointer-events-none absolute right-2 bottom-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] px-2.5 py-2 backdrop-blur-sm">
      <Legend items={items} dense />
    </div>
  )
}

/** 画布内左下角的实时数值条 */
export function CanvasStat({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_82%,transparent)] px-2.5 py-1.5 font-mono text-[12px] tabular-nums text-[var(--text-muted)] backdrop-blur-sm">
      {children}
    </div>
  )
}

/** 一条水平的概率条，用于展示 T/R、P₊/P₋ 这类互补概率 */
export function ProbabilityBar({
  segments,
  height = 8,
}: {
  segments: { value: number; color: string; label?: ReactNode }[]
  height?: number
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  return (
    <div>
      <div
        className="flex overflow-hidden rounded-full border border-[var(--border)]"
        style={{ height }}
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${(s.value * 100).toFixed(1)}%`).join('，')}
      >
        {segments.map((s, i) => (
          <div
            key={i}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            className="transition-[width] duration-150"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 极简内联 SVG 折线图。
 *
 * 3D 场景里有些量（径向概率分布、透射率随能量的变化）用二维曲线读起来更快，
 * 硬塞进三维反而是炫技。这个组件只做一件事：把归一化后的曲线画出来。
 */
export function MiniPlot({
  series,
  height = 84,
  xTicks,
  yMaxLabel,
  markers,
  ariaLabel,
}: {
  series: { points: [number, number][]; color: string; dashed?: boolean; fill?: boolean }[]
  height?: number
  /** [位置0~1, 文本] */
  xTicks?: [number, number, string][]
  yMaxLabel?: string
  /** 竖直参考线，[位置0~1, 颜色] */
  markers?: [number, string][]
  ariaLabel?: string
}) {
  const palette = useScenePalette()
  const W = 240
  const H = height
  const pad = 4

  const toPath = (pts: [number, number][], close = false) => {
    if (!pts.length) return ''
    const d = pts
      .map((p, i) => {
        const x = pad + p[0] * (W - 2 * pad)
        const y = H - pad - p[1] * (H - 2 * pad)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
    if (!close) return d
    const x0 = pad + pts[0]![0] * (W - 2 * pad)
    const xn = pad + pts[pts.length - 1]![0] * (W - 2 * pad)
    return `${d} L${xn.toFixed(2)},${(H - pad).toFixed(2)} L${x0.toFixed(2)},${(H - pad).toFixed(2)} Z`
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke={palette.grid} strokeWidth={1} />
      {markers?.map(([x, c], i) => (
        <line
          key={i}
          x1={pad + x * (W - 2 * pad)}
          y1={pad}
          x2={pad + x * (W - 2 * pad)}
          y2={H - pad}
          stroke={c}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.7}
        />
      ))}
      {series.map((s, i) => (
        <g key={i}>
          {s.fill ? <path d={toPath(s.points, true)} fill={s.color} opacity={0.14} /> : null}
          <path
            d={toPath(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={1.6}
            strokeDasharray={s.dashed ? '4 3' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
      {xTicks?.map(([x, , label], i) => (
        <text
          key={i}
          x={pad + x * (W - 2 * pad)}
          y={H - pad - 3}
          fontSize={8}
          fill={palette.faint}
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
      {yMaxLabel ? (
        <text x={pad + 2} y={pad + 8} fontSize={8} fill={palette.faint}>
          {yMaxLabel}
        </text>
      ) : null}
    </svg>
  )
}

/** 能级尺：把一列能量画成可点击的水平线，与 3D 场景里的高亮联动 */
export function EnergyLadder({
  levels,
  active,
  onPick,
  range,
  formatter = (v) => v.toFixed(3),
}: {
  levels: { energy: number; bound: boolean }[]
  active: number
  onPick: (i: number) => void
  range: [number, number]
  formatter?: (v: number) => string
}) {
  const palette = useScenePalette()
  const T = useUiT()
  const [lo, hi] = range
  const span = hi - lo || 1
  return (
    <div className="relative h-[132px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      {levels.map((l, i) => {
        const t = 1 - (l.energy - lo) / span
        if (t < -0.05 || t > 1.05) return null
        const isActive = i === active
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            title={T('n = {0}，E = {1}', i, formatter(l.energy))}
            className="group absolute right-1 left-1 -translate-y-1/2 cursor-pointer"
            style={{ top: `${Math.min(100, Math.max(0, t * 100))}%`, height: 12 }}
          >
            <span
              className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full transition-all"
              style={{
                background: isActive ? palette.energy : l.bound ? palette.muted : palette.faint,
                opacity: isActive ? 1 : l.bound ? 0.55 : 0.3,
                height: isActive ? 3 : 2,
              }}
            />
            <span
              className="absolute -top-[7px] left-0 font-mono text-[10px] transition-opacity"
              style={{ color: isActive ? palette.energy : palette.faint, opacity: isActive ? 1 : 0.7 }}
            >
              {i}
            </span>
          </button>
        )
      })}
    </div>
  )
}
