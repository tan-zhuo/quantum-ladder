import type { ReactNode } from 'react'
import { useId } from 'react'

/** 模拟控件的统一样式。所有控件都带 .sim-controls，打印时整体隐藏。 */

export function Slider(props: {
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  /** 右侧读数，省略时按 step 精度显示 value */
  display?: ReactNode
  hint?: string
  disabled?: boolean
}) {
  const { label, value, min, max, step = 0.01, onChange, display, hint, disabled } = props
  const id = useId()
  const decimals = step >= 1 ? 0 : Math.min(4, Math.max(0, -Math.floor(Math.log10(step))))
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-[var(--text-muted)]">
          {label}
        </label>
        <span className="font-mono text-[13px] tabular-nums text-[var(--text)]">
          {display ?? value.toFixed(decimals)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ql-range"
      />
      {hint ? <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">{hint}</p> : null}
    </div>
  )
}

export function Segmented<T extends string | number>(props: {
  label?: ReactNode
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (v: T) => void
}) {
  const { label, value, options, onChange } = props
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <span className="text-[13px] font-medium text-[var(--text-muted)]">{label}</span> : null}
      <div
        role="radiogroup"
        className="inline-flex flex-wrap gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-0.5"
      >
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={active}
              title={o.title}
              onClick={() => onChange(o.value)}
              className={
                'rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ' +
                (active
                  ? 'bg-[var(--bg-elevated)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]')
              }
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Toggle(props: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-[var(--text-muted)]"
    >
      <input
        id={id}
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="ql-checkbox"
      />
      {props.label}
    </label>
  )
}

export function Button(props: {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'ghost'
  title?: string
  disabled?: boolean
}) {
  const { variant = 'ghost' } = props
  return (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
      className={
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40 ' +
        (variant === 'primary'
          ? 'bg-[var(--accent)] text-white hover:opacity-90'
          : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]')
      }
    >
      {props.children}
    </button>
  )
}

/** 一行只读数值，用于把「拖滑块 → 物理量怎么变」显式摆出来 */
export function Readout(props: { items: { label: ReactNode; value: ReactNode; color?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
      {props.items.map((it, i) => (
        <div key={i} className="min-w-0">
          <dt className="truncate text-[11.5px] text-[var(--text-faint)]">{it.label}</dt>
          <dd
            className="font-mono text-[15px] tabular-nums"
            style={it.color ? { color: it.color } : undefined}
          >
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
