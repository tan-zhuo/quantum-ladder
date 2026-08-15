import { useCallback, useEffect, useRef, useState } from 'react'
import { readColors, resizeCanvas, type Frame, type PlotColors } from '@/lib/plot'

/**
 * 跟随主题的绘图配色。监听 <html data-theme> 变化后重新读取 CSS 变量，
 * 这样深浅色切换时画布不用重挂载，也不会残留上一套颜色。
 */
export function useThemeColors(): PlotColors | null {
  const [colors, setColors] = useState<PlotColors | null>(null)

  useEffect(() => {
    const update = () => setColors(readColors(document.documentElement))
    update()
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])

  return colors
}

export interface CanvasFrameOptions {
  padding?: Partial<Frame['padding']>
  /**
   * false 时只在依赖变化 / 尺寸变化时画一帧（静态图，省电）；
   * true 时进入 requestAnimationFrame 循环（动画）。
   */
  animate?: boolean
  /** 元素滚出视口时暂停 rAF —— 一页放三四个模拟时这能救回不少电量 */
  pauseOffscreen?: boolean
}

const DEFAULT_PADDING = { top: 12, right: 14, bottom: 30, left: 46 }

/**
 * 把 canvas 的尺寸管理、DPR、主题色、rAF 循环收在一个 hook 里。
 * draw(frame, dt, elapsed) 每帧调用；把返回的 canvasRef 挂到 <canvas> 上。
 *
 * canvasRef 是**回调 ref** 而不是 useRef：模拟里画布常常是条件渲染的
 * （比如「实时演化 / 透射率曲线」切换），用 useRef 的话 ResizeObserver
 * 会挂在已经卸载的节点上，切回来时画布尺寸为 0、一片空白。
 */
export function useCanvasFrame(
  draw: (frame: Frame, dt: number, elapsed: number) => void,
  deps: unknown[],
  options: CanvasFrameOptions = {},
) {
  const { animate = false, pauseOffscreen = true } = options

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const canvasRef = useCallback((el: HTMLCanvasElement | null) => setCanvas(el), [])

  const drawRef = useRef(draw)
  drawRef.current = draw
  const paddingRef = useRef({ ...DEFAULT_PADDING, ...options.padding })
  paddingRef.current = { ...DEFAULT_PADDING, ...options.padding }

  const colors = useThemeColors()
  const [visible, setVisible] = useState(true)
  const sizeRef = useRef({ width: 0, height: 0 })

  /**
   * 每次绘制前对账一次尺寸，只在真的变了时才重建缓冲区。
   *
   * 不把尺寸只交给 ResizeObserver 单点更新：client:visible 的岛挂载、
   * 主题色就绪、RO 首次触发这三件事的先后顺序并不保证，
   * 缓存一旦在布局未定的时刻被填上就再也不会更新，
   * 表现是画面被从 300×150 拉伸放大——不报错，只是糊，很容易漏掉。
   * 每帧一次 getBoundingClientRect 的代价远低于这种静默降质的风险。
   */
  const ensureSize = useCallback((c: HTMLCanvasElement) => {
    const rect = c.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))
    if (w !== sizeRef.current.width || h !== sizeRef.current.height) {
      sizeRef.current = resizeCanvas(c)
    }
    return sizeRef.current
  }, [])

  const renderOnce = useCallback(() => {
    if (!canvas || !colors) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = ensureSize(canvas)
    drawRef.current(
      { ctx, width: size.width, height: size.height, padding: paddingRef.current, colors },
      0,
      0,
    )
  }, [canvas, colors, ensureSize])

  useEffect(() => {
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      if (!animate) renderOnce()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [canvas, animate, renderOnce])

  useEffect(() => {
    if (!pauseOffscreen || !canvas) return
    const io = new IntersectionObserver((entries) => setVisible(entries[0]?.isIntersecting ?? true), {
      rootMargin: '120px',
    })
    io.observe(canvas)
    return () => io.disconnect()
  }, [canvas, pauseOffscreen])

  // 静态图：依赖变化时补画一帧
  useEffect(() => {
    if (animate) return
    renderOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, renderOnce, ...deps])

  // 动画：rAF 循环
  useEffect(() => {
    if (!animate || !colors || !canvas) return
    if (pauseOffscreen && !visible) return

    let raf = 0
    let last = performance.now()
    const start = last

    const loop = (now: number) => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const size = ensureSize(canvas)
        // 标签页切回来时 dt 可能是好几秒，钳住避免物理量一步跳飞
        const dt = Math.min((now - last) / 1000, 0.05)
        drawRef.current(
          { ctx, width: size.width, height: size.height, padding: paddingRef.current, colors },
          dt,
          (now - start) / 1000,
        )
      }
      last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [animate, colors, canvas, visible, pauseOffscreen, ensureSize])

  return { canvasRef, colors, visible }
}
