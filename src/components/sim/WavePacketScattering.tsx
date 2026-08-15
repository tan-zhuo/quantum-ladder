import { useEffect, useMemo, useRef, useState } from 'react'
import SimShell from './SimShell'
import { Button, Readout, Segmented, Slider, Toggle } from './controls'
import { useCanvasFrame } from './useCanvas'
import { drawAxes, drawCurve, drawLegend, makeScale, niceTicks } from '@/lib/plot'
import { SplitOperator, barrierTransmission, rectBarrierOnGrid } from '@/lib/numerics'

/**
 * 波包演化与散射：高斯波包撞上矩形势垒 / 势阱。
 *
 * 教学目标（对应 2.10 / 2.11）：
 *  - 自由波包会弥散：Δx 随时间增大，这不是「测不准」而是色散
 *  - E < V₀ 时透射概率仍不为零 —— 隧道效应
 *  - E > V₀ 时反射概率仍不为零 —— 经典完全没有的「越过势垒还被弹回来」
 *  - 势阱也会散射，且在特定能量透射率回到 1 —— 共振透射（Ramsauer–Townsend）
 *
 * 数值方法：分步算符法（split-operator），严格幺正，细节见附录 C。
 */

const N_GRID = 1024
const X_MIN = -60
const X_MAX = 60
const DT = 0.005
const X0 = -26

export default function WavePacketScattering() {
  const [k0, setK0] = useState(2)
  const [V0, setV0] = useState(2.5)
  const [width, setWidth] = useState(1.5)
  const [sigma, setSigma] = useState(3)
  const [speed, setSpeed] = useState(8)
  const [playing, setPlaying] = useState(false)
  const [showRe, setShowRe] = useState(false)
  const [view, setView] = useState<'space' | 'transmission'>('space')

  const energy = (k0 * k0) / 2

  const soRef = useRef<SplitOperator | null>(null)
  const barrierRef = useRef({ width: 1.5, iStart: 0, iEnd: 0 })
  const timeRef = useRef(0)
  const latchedRef = useRef<{ R: number; T: number } | null>(null)
  /** 波包是否已经真正进入过势垒区——锁定 R/T 的前置条件 */
  const interactedRef = useRef(false)

  const [live, setLive] = useState({ t: 0, R: 0, T: 0, inside: 0, norm: 1, xMean: X0, dx: 3 })
  const [latched, setLatched] = useState<{ R: number; T: number } | null>(null)
  const lastPushRef = useRef(0)

  /** 建（或重建）求解器并装入初始波包 */
  function init() {
    const so = new SplitOperator({
      n: N_GRID,
      xMin: X_MIN,
      xMax: X_MAX,
      dt: DT,
      potential: () => 0,
      absorbFraction: 0.06,
    })
    applyBarrier(so)
    so.setGaussian(X0, k0, sigma)
    soRef.current = so
    timeRef.current = 0
    latchedRef.current = null
    interactedRef.current = false
    setLatched(null)
  }

  function applyBarrier(so: SplitOperator) {
    // 势垒必须对齐网格，否则 T 会随滑块阶梯式抖动、且和解析曲线差到 15%
    const b = rectBarrierOnGrid(so.x, { center: 0, width, height: V0 })
    so.setPotential(b.V)
    barrierRef.current = { width: b.width, iStart: b.iStart, iEnd: b.iEnd }
  }

  // 初值参数（k₀、σ）改变 → 重新装弹；势垒参数改变 → 只换势能，波包留在原地
  useEffect(() => {
    init()
    setPlaying(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k0, sigma])

  useEffect(() => {
    const so = soRef.current
    if (!so) return
    applyBarrier(so)
    latchedRef.current = null
    // 势垒参数变了，之前那次「已进过势垒」的记录作废，重新等这一轮的散射
    interactedRef.current = false
    setLatched(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [V0, width])

  const reset = () => {
    setK0(2)
    setV0(2.5)
    setWidth(1.5)
    setSigma(3)
    setSpeed(8)
    setShowRe(false)
    setView('space')
    init()
    setPlaying(false)
  }

  const probBuf = useRef(new Float64Array(N_GRID))

  const { canvasRef } = useCanvasFrame(
    (f) => {
      const so = soRef.current
      if (!so) return
      const pad = f.padding

      if (playing) {
        so.steps(speed)
        timeRef.current += DT * speed
      }

      const prob = probBuf.current
      for (let i = 0; i < N_GRID; i++) {
        prob[i] = so.re[i]! * so.re[i]! + so.im[i]! * so.im[i]!
      }

      const b = barrierRef.current
      const dx = so.dx
      const xL = -b.width / 2
      const xR = b.width / 2
      let R = 0
      let inside = 0
      let T = 0
      let m1 = 0
      let m2 = 0
      let tot = 0
      for (let i = 0; i < N_GRID; i++) {
        const p = prob[i]!
        const x = so.x[i]!
        if (x < xL) R += p
        else if (x > xR) T += p
        else inside += p
        tot += p
        m1 += p * x
        m2 += p * x * x
      }
      // 四个累加量都还是「格点求和」，统一乘 dx 变成积分。
      // 漏掉 m1/m2 的话 ⟨x⟩ 会被放大 1/dx 倍，Δx² 变成大负数再被钳成 0。
      R *= dx
      T *= dx
      inside *= dx
      tot *= dx
      m1 *= dx
      m2 *= dx
      const xMean = tot > 0 ? m1 / tot : 0
      const spread = Math.sqrt(Math.max(0, (tot > 0 ? m2 / tot : 0) - xMean * xMean))

      // 波包进过势垒区、又完全离开之后，才锁定 R / T。
      // 「进过」这个前提不能省：出发时波包离势垒还很远，inside 本来就是 0，
      // 只看 inside < ε 会在 t 刚过阈值时立刻锁定，给出 R = 1、T = 0 的假结果。
      if (inside > 1e-4) interactedRef.current = true
      if (!latchedRef.current && interactedRef.current && inside < 1e-6 && tot > 0.98) {
        latchedRef.current = { R: R / tot, T: T / tot }
        setLatched(latchedRef.current)
        setPlaying(false)
      }

      const now = performance.now()
      if (now - lastPushRef.current > 100) {
        lastPushRef.current = now
        setLive({ t: timeRef.current, R, T, inside, norm: tot, xMean, dx: spread })
      }

      // ── 绘制 ──
      f.ctx.clearRect(0, 0, f.width, f.height)

      const sx = makeScale([X_MIN, X_MAX], [pad.left, f.width - pad.right])
      // 纵轴统一用能量：势能曲线和「波包能量」画在同一把尺子上，
      // 学生一眼能判断这是 E < V₀ 还是 E > V₀
      const eTop = Math.max(energy * 1.9, Math.abs(V0) * 1.5, 1.5)
      const eBot = Math.min(-0.15 * eTop, V0 < 0 ? V0 * 1.25 : 0)
      const sy = makeScale([eBot, eTop], [f.height - pad.bottom, pad.top])

      drawAxes(f, sx, sy, {
        xLabel: 'x',
        yLabel: 'E, V',
        grid: true,
        zeroLine: true,
        yTicks: niceTicks(eBot, eTop, 5),
      })

      // 势垒 / 势阱
      const bx0 = sx.toPx(xL)
      const bx1 = sx.toPx(xR)
      f.ctx.save()
      f.ctx.fillStyle = V0 >= 0 ? f.colors.potential + '2e' : f.colors.energy + '2e'
      f.ctx.fillRect(bx0, sy.toPx(Math.max(V0, 0)), bx1 - bx0, Math.abs(sy.toPx(V0) - sy.toPx(0)))
      f.ctx.strokeStyle = f.colors.potential
      f.ctx.lineWidth = 2
      f.ctx.beginPath()
      f.ctx.moveTo(pad.left, sy.toPx(0))
      f.ctx.lineTo(bx0, sy.toPx(0))
      f.ctx.lineTo(bx0, sy.toPx(V0))
      f.ctx.lineTo(bx1, sy.toPx(V0))
      f.ctx.lineTo(bx1, sy.toPx(0))
      f.ctx.lineTo(f.width - pad.right, sy.toPx(0))
      f.ctx.stroke()
      f.ctx.restore()

      // 波包平均能量
      f.ctx.save()
      f.ctx.strokeStyle = f.colors.energy
      f.ctx.setLineDash([6, 4])
      f.ctx.lineWidth = 1.4
      f.ctx.beginPath()
      f.ctx.moveTo(pad.left, sy.toPx(energy))
      f.ctx.lineTo(f.width - pad.right, sy.toPx(energy))
      f.ctx.stroke()
      f.ctx.fillStyle = f.colors.energy
      f.ctx.font = '11px var(--font-sans, sans-serif)'
      f.ctx.textAlign = 'right'
      f.ctx.textBaseline = 'bottom'
      f.ctx.fillText(`E = ${energy.toFixed(2)}`, f.width - pad.right - 4, sy.toPx(energy) - 3)
      f.ctx.restore()

      // 波包画在能量线上方。纵向比例锚定在**初始**峰高（高斯的 1/(σ√2π)），
      // 不用每帧的 pMax 归一：否则无论波包怎么弥散、怎么被势垒劈成两半，
      // 画出来永远一样高，「散开」和「分成反射波+透射波」这两件事就全看不见了。
      const peak0 = 1 / (sigma * Math.sqrt(2 * Math.PI))
      const scale = (0.42 * (eTop - eBot)) / peak0
      const psiCurve = new Float64Array(N_GRID)
      for (let i = 0; i < N_GRID; i++) psiCurve[i] = energy + prob[i]! * scale
      drawCurve(f, sx, sy, psiCurve, so.x, {
        color: f.colors.prob,
        width: 1.8,
        fill: f.colors.prob + '26',
        baseline: energy,
      })

      if (showRe) {
        const reCurve = new Float64Array(N_GRID)
        // Re ψ 的量纲是 √|ψ|²，所以比例尺要开一次方才能和 |ψ|² 画在同一张图上
        const reScale = scale * Math.sqrt(peak0) * 0.75
        for (let i = 0; i < N_GRID; i++) reCurve[i] = energy + so.re[i]! * reScale
        drawCurve(f, sx, sy, reCurve, so.x, { color: f.colors.wave, width: 1, alpha: 0.75 })
      }

      const legend = [{ color: f.colors.prob, label: '|ψ(x,t)|²' }]
      if (showRe) legend.push({ color: f.colors.wave, label: 'Re ψ' })
      legend.push({ color: f.colors.potential, label: V0 >= 0 ? '势垒 V(x)' : '势阱 V(x)' })
      drawLegend(f, legend, 'top-left')

      f.ctx.save()
      f.ctx.fillStyle = f.colors.faint
      f.ctx.font = '11px var(--font-mono, monospace)'
      f.ctx.textAlign = 'right'
      f.ctx.textBaseline = 'top'
      f.ctx.fillText(`t = ${timeRef.current.toFixed(2)}`, f.width - pad.right - 4, pad.top + 2)
      f.ctx.restore()
    },
    [showRe, energy, V0, width, speed, playing, view],
    { animate: view === 'space', padding: { left: 46, bottom: 34 } },
  )

  // 透射率曲线 T(E)：解析结果 + 当前工作点
  const { canvasRef: tCanvasRef } = useCanvasFrame(
    (f) => {
      const pad = { top: 16, right: 16, bottom: 34, left: 48 }
      const a = barrierRef.current.width
      const eMax = Math.max(3 * Math.abs(V0), 6)
      f.ctx.clearRect(0, 0, f.width, f.height)

      const sx = makeScale([0, eMax], [pad.left, f.width - pad.right])
      const sy = makeScale([0, 1.05], [f.height - pad.bottom, pad.top])
      drawAxes({ ...f, padding: pad }, sx, sy, {
        xLabel: '入射能量 E',
        yLabel: 'T',
        grid: true,
        zeroLine: false,
      })

      const M = 400
      const curve = new Float64Array(M)
      const es = new Float64Array(M)
      for (let i = 0; i < M; i++) {
        es[i] = (eMax * (i + 0.5)) / M
        curve[i] = barrierTransmission(es[i]!, V0, a)
      }
      drawCurve({ ...f, padding: pad }, sx, sy, curve, es, { color: f.colors.accent, width: 2 })

      // V₀ 位置：势垒的「经典临界能量」
      if (V0 > 0 && V0 < eMax) {
        f.ctx.save()
        f.ctx.strokeStyle = f.colors.potential
        f.ctx.setLineDash([4, 4])
        f.ctx.beginPath()
        f.ctx.moveTo(sx.toPx(V0), pad.top)
        f.ctx.lineTo(sx.toPx(V0), f.height - pad.bottom)
        f.ctx.stroke()
        f.ctx.fillStyle = f.colors.muted
        f.ctx.font = '11px var(--font-sans, sans-serif)'
        f.ctx.textAlign = 'left'
        f.ctx.textBaseline = 'top'
        f.ctx.fillText('E = V₀', sx.toPx(V0) + 4, pad.top + 2)
        f.ctx.restore()
      }

      // 当前工作点：解析值（空心）与数值锁定值（实心）
      const tAna = barrierTransmission(energy, V0, a)
      f.ctx.save()
      f.ctx.strokeStyle = f.colors.energy
      f.ctx.lineWidth = 2
      f.ctx.beginPath()
      f.ctx.arc(sx.toPx(energy), sy.toPx(tAna), 5, 0, Math.PI * 2)
      f.ctx.stroke()
      if (latched) {
        f.ctx.fillStyle = f.colors.prob
        f.ctx.beginPath()
        f.ctx.arc(sx.toPx(energy), sy.toPx(latched.T), 4.5, 0, Math.PI * 2)
        f.ctx.fill()
      }
      f.ctx.restore()

      drawLegend(
        { ...f, padding: pad },
        [
          { color: f.colors.accent, label: '平面波解析解 T(E)' },
          { color: f.colors.energy, label: '当前 E 的解析值' },
          ...(latched ? [{ color: f.colors.prob, label: '本次模拟测得 T' }] : []),
        ],
        'top-right',
      )
    },
    [V0, width, energy, latched, view],
    { animate: false },
  )

  const classicalPrediction =
    V0 <= 0 ? '经典：完全透射' : energy < V0 ? '经典：完全反射' : '经典：完全透射'

  const readout = useMemo(() => {
    const shown = latched ?? { R: live.norm > 0 ? live.R / live.norm : 0, T: live.norm > 0 ? live.T / live.norm : 0 }
    return (
      <div className="space-y-2">
        <Readout
          items={[
            { label: 'E / V₀', value: V0 === 0 ? '—' : (energy / V0).toFixed(2) },
            { label: `反射 R${latched ? '（已锁定）' : ''}`, value: shown.R.toFixed(3), color: 'var(--c-warn)' },
            { label: `透射 T${latched ? '（已锁定）' : ''}`, value: shown.T.toFixed(3), color: 'var(--c-prob)' },
            { label: '波包宽度 Δx', value: live.dx.toFixed(2) },
          ]}
        />
        <p className="text-[12.5px] leading-relaxed text-[var(--text-muted)]">
          {latched ? (
            <>
              散射结束：<strong>R + T = {(shown.R + shown.T).toFixed(3)}</strong>。
              {classicalPrediction}，量子给出 T = {shown.T.toFixed(3)}、R = {shown.R.toFixed(3)}。
              解析平面波在 E = {energy.toFixed(2)} 处给出 T ={' '}
              {barrierTransmission(energy, V0, barrierRef.current.width).toFixed(3)}
              （波包有能量展宽，两者会有几个百分点的差别）。
            </>
          ) : (
            <>
              点「播放」让波包撞上势垒。波包完全离开势垒区后 R、T 会自动锁定。
              势垒在网格上的实际宽度 a = {barrierRef.current.width.toFixed(3)}。
            </>
          )}
        </p>
      </div>
    )
  }, [latched, live, energy, V0, classicalPrediction])

  return (
    <SimShell
      id="wave-packet-scattering"
      title="波包演化与散射"
      subtitle={
        <>
          高斯波包撞上矩形势垒。用分步算符法实时求解含时薛定谔方程，ħ = m = 1。
        </>
      }
      onReset={reset}
      readout={readout}
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Slider
              label={
                <>
                  入射动量 <span className="font-mono">k₀</span>
                </>
              }
              value={k0}
              min={0.6}
              max={4}
              step={0.05}
              onChange={setK0}
              hint={`E = k₀²/2 = ${energy.toFixed(2)}`}
            />
            <Slider
              label={
                <>
                  势垒高度 <span className="font-mono">V₀</span>
                </>
              }
              value={V0}
              min={-4}
              max={8}
              step={0.1}
              onChange={setV0}
              hint={V0 < 0 ? '负值 = 势阱' : '正值 = 势垒'}
            />
            <Slider
              label={
                <>
                  势垒宽度 <span className="font-mono">a</span>
                </>
              }
              value={width}
              min={0.3}
              max={6}
              step={0.1}
              onChange={setWidth}
              hint="T 随 a 指数衰减：T ~ e^(−2κa)"
            />
            <Slider
              label={
                <>
                  初始波包宽度 <span className="font-mono">σ</span>
                </>
              }
              value={sigma}
              min={1}
              max={8}
              step={0.25}
              onChange={setSigma}
              hint="σ 越大动量越确定，越接近平面波"
            />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <Segmented
              label="视图"
              value={view}
              onChange={setView}
              options={[
                { value: 'space', label: '实时演化' },
                { value: 'transmission', label: '透射率曲线 T(E)' },
              ]}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Toggle label="显示 Re ψ" checked={showRe} onChange={setShowRe} />
              <Slider
                label="速度"
                value={speed}
                min={1}
                max={24}
                step={1}
                onChange={(v) => setSpeed(Math.round(v))}
                display={`${speed}×`}
              />
              <Button
                onClick={() => {
                  if (latchedRef.current) init()
                  setPlaying((p) => !p)
                  setView('space')
                }}
                variant="primary"
              >
                {playing ? '暂停' : latched ? '重放' : '播放'}
              </Button>
              <Button
                onClick={() => {
                  init()
                  setPlaying(false)
                }}
              >
                回到 t = 0
              </Button>
            </div>
          </div>
        </div>
      }
      prompts={[
        <>
          默认参数下 <code>E ≈ 2.0 &lt; V₀ = 2.5</code>，经典粒子 100% 被弹回。播放看看：
          有一部分波包穿过去了。这就是<strong>隧道效应</strong>，也是扫描隧道显微镜与 α 衰变的原理。
        </>,
        <>
          把 <code>a</code> 从 1.5 加到 4，重放。透射率暴跌——<code>T ~ e^(−2κa)</code> 是指数衰减，
          势垒稍微加宽一点，隧穿概率就掉几个数量级。
        </>,
        <>
          把 <code>V₀</code> 调到 1.0（此时 E &gt; V₀，经典应当 100% 透射），重放：
          仍然有明显的反射峰跑回左边。<strong>波遇到势的突变就会部分反射</strong>，跟光在玻璃表面一样。
        </>,
        <>
          切到「透射率曲线」，把 <code>V₀</code> 设成负值（势阱）：曲线在某些能量处回到 T = 1。
          这是<strong>共振透射</strong>，历史上表现为惰性气体对慢电子近乎透明的 Ramsauer–Townsend 效应。
        </>,
        <>
          把 <code>σ</code> 调到 8 再散射，测得的 T 会更贴近解析曲线上的空心圆点——
          波包越接近平面波，「单一能量」的近似就越好。
        </>,
      ]}
    >
      {view === 'space' ? (
        <canvas
          ref={canvasRef}
          className="h-[320px] w-full sm:h-[380px]"
          role="img"
          aria-label="波包散射实时演化"
        />
      ) : (
        <canvas
          ref={tCanvasRef}
          className="h-[320px] w-full sm:h-[380px]"
          role="img"
          aria-label="矩形势垒透射率随能量的变化"
        />
      )}
    </SimShell>
  )
}
