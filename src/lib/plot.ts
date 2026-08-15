/**
 * Canvas 2D 绘图小工具 —— 所有模拟共用的坐标变换、坐标轴与曲线绘制。
 *
 * 三个设计取舍：
 * 1. 颜色一律从 CSS 变量读（--c-wave 等），主题切换时模拟自动跟着变，
 *    不需要每个组件各自维护深浅两套配色。
 * 2. 处理 devicePixelRatio，避免在高分屏上糊成一片。
 * 3. 不引任何图表库：曲线是几百到几千个点、每帧重画，
 *    通用图表库的对象分配开销会直接吃掉帧率。
 */

export interface Scale {
  /** 数据坐标 → 画布像素 */
  toPx: (v: number) => number
  /** 画布像素 → 数据坐标（供拖拽交互用） */
  fromPx: (px: number) => number
  domain: [number, number]
  range: [number, number]
}

export function makeScale(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  return {
    domain,
    range,
    toPx: (v) => r0 + ((v - d0) / span) * (r1 - r0),
    fromPx: (px) => d0 + ((px - r0) / (r1 - r0 || 1)) * span,
  }
}

export interface Frame {
  ctx: CanvasRenderingContext2D
  /** CSS 像素尺寸（已除掉 DPR） */
  width: number
  height: number
  padding: { top: number; right: number; bottom: number; left: number }
  colors: PlotColors
}

export interface PlotColors {
  ink: string
  muted: string
  faint: string
  grid: string
  line: string
  wave: string
  waveIm: string
  prob: string
  potential: string
  energy: string
  accent: string
  warn: string
  danger: string
  bg: string
  elevated: string
  subtle: string
}

const CSS_VARS: Record<keyof PlotColors, string> = {
  ink: '--text',
  muted: '--text-muted',
  faint: '--text-faint',
  grid: '--c-grid',
  line: '--border',
  wave: '--c-wave',
  waveIm: '--c-wave-im',
  prob: '--c-prob',
  potential: '--c-potential',
  energy: '--c-energy',
  accent: '--accent',
  warn: '--c-warn',
  danger: '--c-danger',
  bg: '--bg',
  elevated: '--bg-elevated',
  subtle: '--bg-subtle',
}

/** 从当前主题读出全部绘图色。主题切换后重新调用即可。 */
export function readColors(el: Element | null): PlotColors {
  const style = getComputedStyle(el ?? document.documentElement)
  const out = {} as PlotColors
  for (const [key, varName] of Object.entries(CSS_VARS)) {
    out[key as keyof PlotColors] = style.getPropertyValue(varName).trim() || '#888'
  }
  return out
}

/**
 * 按 devicePixelRatio 同步后备缓冲区，返回 CSS 像素尺寸。
 *
 * 注意 canvas 的默认缓冲区是 300×150，与 CSS 尺寸无关。忘了同步的话画面不会出错，
 * 只会被拉伸放大——看着「有点糊」，很容易漏掉，所以这里每帧对账一次。
 * 只有尺寸真的变了才写 canvas.width（写入会清空画布并重置变换）。
 */
export function resizeCanvas(canvas: HTMLCanvasElement): { width: number; height: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  const bw = Math.round(width * dpr)
  const bh = Math.round(height * dpr)
  const ctx = canvas.getContext('2d')!
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw
    canvas.height = bh
  }
  // 变换每次都要设：写 canvas.width 会把它重置成单位矩阵
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { width, height }
}

export function clear(f: Frame) {
  f.ctx.clearRect(0, 0, f.width, f.height)
}

/** 生成「好看」的刻度值（1 / 2 / 5 × 10ⁿ） */
export function niceTicks(min: number, max: number, target = 6): number[] {
  const span = max - min
  if (span <= 0 || !Number.isFinite(span)) return [min]
  const raw = span / target
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
  const start = Math.ceil(min / step) * step
  const out: number[] = []
  for (let v = start; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v)
  return out
}

export function formatTick(v: number): string {
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a >= 1e4 || a < 1e-3) return v.toExponential(1).replace('e+', 'e')
  if (Number.isInteger(v)) return String(v)
  return String(Number(v.toPrecision(3)))
}

export interface AxesOptions {
  xLabel?: string
  yLabel?: string
  xTicks?: number[]
  yTicks?: number[]
  /** 画横向网格线 */
  grid?: boolean
  /** 在 y = 0 处画一条基线 */
  zeroLine?: boolean
  formatX?: (v: number) => string
  formatY?: (v: number) => string
}

export function drawAxes(f: Frame, sx: Scale, sy: Scale, opts: AxesOptions = {}) {
  const { ctx, colors, padding, width, height } = f
  const {
    grid = true,
    zeroLine = true,
    formatX = formatTick,
    formatY = formatTick,
    xTicks = niceTicks(sx.domain[0], sx.domain[1]),
    yTicks = niceTicks(sy.domain[0], sy.domain[1], 5),
  } = opts

  ctx.save()
  ctx.font = '11px var(--font-sans, sans-serif)'
  ctx.lineWidth = 1

  if (grid) {
    ctx.strokeStyle = colors.grid
    ctx.beginPath()
    for (const t of yTicks) {
      const y = Math.round(sy.toPx(t)) + 0.5
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
    }
    ctx.stroke()
  }

  // 坐标轴边框只画左、下两边，视觉更轻
  ctx.strokeStyle = colors.line
  ctx.beginPath()
  ctx.moveTo(padding.left + 0.5, padding.top)
  ctx.lineTo(padding.left + 0.5, height - padding.bottom + 0.5)
  ctx.lineTo(width - padding.right, height - padding.bottom + 0.5)
  ctx.stroke()

  ctx.fillStyle = colors.faint
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (const t of xTicks) {
    const x = sx.toPx(t)
    if (x < padding.left - 1 || x > width - padding.right + 1) continue
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, height - padding.bottom)
    ctx.lineTo(Math.round(x) + 0.5, height - padding.bottom + 4)
    ctx.strokeStyle = colors.line
    ctx.stroke()
    ctx.fillText(formatX(t), x, height - padding.bottom + 7)
  }

  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const t of yTicks) {
    const y = sy.toPx(t)
    if (y < padding.top - 1 || y > height - padding.bottom + 1) continue
    ctx.fillText(formatY(t), padding.left - 6, y)
  }

  if (zeroLine && sy.domain[0] < 0 && sy.domain[1] > 0) {
    ctx.strokeStyle = colors.line
    ctx.beginPath()
    const y = Math.round(sy.toPx(0)) + 0.5
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
  }

  if (opts.xLabel) {
    ctx.fillStyle = colors.muted
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(opts.xLabel, (padding.left + width - padding.right) / 2, height - 2)
  }
  if (opts.yLabel) {
    ctx.save()
    ctx.translate(11, (padding.top + height - padding.bottom) / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = colors.muted
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(opts.yLabel, 0, 0)
    ctx.restore()
  }

  ctx.restore()
}

export interface CurveOptions {
  color: string
  width?: number
  dash?: number[]
  /** 曲线与 baseline 之间填充（画概率密度用） */
  fill?: string
  baseline?: number
  alpha?: number
}

/** 画一条 y = data[i]，x = xs[i] 的曲线。xs 省略时按索引均匀分布。 */
export function drawCurve(
  f: Frame,
  sx: Scale,
  sy: Scale,
  data: ArrayLike<number>,
  xs: ArrayLike<number> | null,
  opts: CurveOptions,
) {
  const { ctx } = f
  const n = data.length
  if (n === 0) return
  const xAt = (i: number) => (xs ? xs[i]! : sx.domain[0] + ((sx.domain[1] - sx.domain[0]) * i) / (n - 1))

  ctx.save()
  ctx.globalAlpha = opts.alpha ?? 1
  ctx.beginPath()
  // 数据点通常远多于像素，每像素只取一个点会丢峰值，所以全画；
  // n ≤ 4096 时这在 60fps 下完全够用。
  for (let i = 0; i < n; i++) {
    const px = sx.toPx(xAt(i))
    const py = sy.toPx(data[i]!)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }

  if (opts.fill) {
    ctx.save()
    const base = sy.toPx(opts.baseline ?? 0)
    ctx.lineTo(sx.toPx(xAt(n - 1)), base)
    ctx.lineTo(sx.toPx(xAt(0)), base)
    ctx.closePath()
    ctx.fillStyle = opts.fill
    ctx.fill()
    ctx.restore()
    // 填充后重建路径，避免闭合线段被当成曲线的一部分描出来
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const px = sx.toPx(xAt(i))
      const py = sy.toPx(data[i]!)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
  }

  ctx.strokeStyle = opts.color
  ctx.lineWidth = opts.width ?? 1.75
  ctx.lineJoin = 'round'
  if (opts.dash) ctx.setLineDash(opts.dash)
  ctx.stroke()
  ctx.restore()
}

/** 水平线（能级） */
export function drawHLine(
  f: Frame,
  sx: Scale,
  sy: Scale,
  y: number,
  opts: { color: string; dash?: number[]; width?: number; label?: string; labelColor?: string },
) {
  const { ctx, padding, width } = f
  const py = sy.toPx(y)
  ctx.save()
  ctx.strokeStyle = opts.color
  ctx.lineWidth = opts.width ?? 1
  if (opts.dash) ctx.setLineDash(opts.dash)
  ctx.beginPath()
  ctx.moveTo(padding.left, py)
  ctx.lineTo(width - padding.right, py)
  ctx.stroke()
  if (opts.label) {
    ctx.setLineDash([])
    ctx.fillStyle = opts.labelColor ?? opts.color
    ctx.font = '11px var(--font-sans, sans-serif)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(opts.label, padding.left + 4, py - 2)
  }
  ctx.restore()
}

/** 竖直阴影带（势垒 / 势阱壁） */
export function drawBand(f: Frame, sx: Scale, x0: number, x1: number, fill: string) {
  const { ctx, padding, height } = f
  ctx.save()
  ctx.fillStyle = fill
  const a = sx.toPx(x0)
  const b = sx.toPx(x1)
  ctx.fillRect(Math.min(a, b), padding.top, Math.abs(b - a), height - padding.top - padding.bottom)
  ctx.restore()
}

/** 右上角图例 */
export function drawLegend(
  f: Frame,
  items: { color: string; label: string; dash?: number[] }[],
  anchor: 'top-right' | 'top-left' = 'top-right',
) {
  const { ctx, padding, width } = f
  ctx.save()
  ctx.font = '11.5px var(--font-sans, sans-serif)'
  ctx.textBaseline = 'middle'
  const lineW = 16
  const gap = 6
  const rowH = 16
  const widths = items.map((it) => lineW + gap + ctx.measureText(it.label).width)
  const boxW = Math.max(...widths) + 16
  const boxH = items.length * rowH + 10
  const x = anchor === 'top-right' ? width - padding.right - boxW : padding.left + 6
  const y = padding.top + 4

  ctx.globalAlpha = 0.92
  ctx.fillStyle = f.colors.elevated
  ctx.strokeStyle = f.colors.line
  ctx.lineWidth = 1
  roundRect(ctx, x, y, boxW, boxH, 6)
  ctx.fill()
  ctx.stroke()
  ctx.globalAlpha = 1

  items.forEach((it, i) => {
    const cy = y + 5 + rowH * i + rowH / 2
    ctx.strokeStyle = it.color
    ctx.lineWidth = 2
    ctx.setLineDash(it.dash ?? [])
    ctx.beginPath()
    ctx.moveTo(x + 8, cy)
    ctx.lineTo(x + 8 + lineW, cy)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = f.colors.muted
    ctx.textAlign = 'left'
    ctx.fillText(it.label, x + 8 + lineW + gap, cy + 0.5)
  })
  ctx.restore()
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}
