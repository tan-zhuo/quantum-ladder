import { useMemo, useRef, useState } from 'react'
import SimShell from './SimShell'
import { Button, Readout, Segmented, Slider, Toggle } from './controls'
import { useCanvasFrame } from './useCanvas'
import { drawAxes, drawCurve, drawLegend, makeScale } from '@/lib/plot'
import { harmonicEigenstate, lnFactorial } from '@/lib/numerics'

/**
 * 一维谐振子：ψₙ 的波形、能级阶梯、与经典概率分布的对照，以及相干态。
 *
 * 教学目标（对应 2.9）：
 *  - 能级等间距 Eₙ = (n+½)ħω，且基态能不为零（零点能）
 *  - 波函数能渗进经典禁区（|x| > 转折点），n 越小渗得越明显
 *  - n 增大后 |ψₙ|² 的包络趋近经典概率分布 —— 对应原理
 *  - 相干态：唯一一种像经典粒子那样来回振荡且不弥散的量子态
 */

const N_POINTS = 700
const MAX_N = 20
const COHERENT_TERMS = 40

type Mode = 'levels' | 'single' | 'coherent'

export default function HarmonicOscillator() {
  const [mode, setMode] = useState<Mode>('levels')
  const [n, setN] = useState(0)
  const [omega, setOmega] = useState(1)
  const [alpha, setAlpha] = useState(2)
  const [showClassical, setShowClassical] = useState(true)
  const [useProb, setUseProb] = useState(false)
  const [playing, setPlaying] = useState(true)
  const timeRef = useRef(0)

  const reset = () => {
    setMode('levels')
    setN(0)
    setOmega(1)
    setAlpha(2)
    setShowClassical(true)
    setUseProb(false)
    timeRef.current = 0
  }

  const energy = (k: number) => (k + 0.5) * omega
  /** 经典转折点：½ω²x² = E ⇒ x = √(2E)/ω */
  const turningPoint = (E: number) => Math.sqrt(2 * E) / omega

  // 画多少个能级：铺满纵轴即可
  const levelsShown = Math.min(MAX_N + 1, 9)
  const eTop = mode === 'coherent' ? energy(alpha * alpha + 4) : energy(levelsShown)
  const xMax = turningPoint(eTop) * 1.28

  const xs = useMemo(() => {
    const a = new Float64Array(N_POINTS)
    for (let i = 0; i < N_POINTS; i++) a[i] = -xMax + (2 * xMax * i) / (N_POINTS - 1)
    return a
  }, [xMax])

  /** 相干态系数 cₙ = e^{−α²/2} αⁿ/√(n!)，用对数算避免 αⁿ 溢出 */
  const coherentCoeffs = useMemo(() => {
    const c = new Float64Array(COHERENT_TERMS)
    for (let k = 0; k < COHERENT_TERMS; k++) {
      c[k] = Math.exp(-(alpha * alpha) / 2 + k * Math.log(alpha || 1e-12) - 0.5 * lnFactorial(k))
    }
    return c
  }, [alpha])

  const bufRe = useRef(new Float64Array(N_POINTS))
  const bufIm = useRef(new Float64Array(N_POINTS))
  const bufProb = useRef(new Float64Array(N_POINTS))
  const [stats, setStats] = useState({ xMean: 0, xSpread: 0.7 })
  const lastPushRef = useRef(0)

  const animate = mode === 'coherent' && playing

  const { canvasRef } = useCanvasFrame(
    (f, dt) => {
      if (animate) timeRef.current += dt * 1.2
      const t = mode === 'coherent' ? timeRef.current : 0
      const pad = f.padding

      const sx = makeScale([-xMax, xMax], [pad.left, f.width - pad.right])
      const sy = makeScale([0, eTop * 1.08], [f.height - pad.bottom, pad.top])

      f.ctx.clearRect(0, 0, f.width, f.height)
      drawAxes(f, sx, sy, {
        xLabel: 'x  （√(ħ/mω) 为单位）',
        yLabel: 'E',
        grid: false,
        zeroLine: false,
      })

      // 抛物线势 V(x) = ½ω²x²
      const V = new Float64Array(N_POINTS)
      for (let i = 0; i < N_POINTS; i++) V[i] = 0.5 * omega * omega * xs[i]! * xs[i]!
      drawCurve(f, sx, sy, V, xs, { color: f.colors.potential, width: 2 })

      if (mode === 'levels') {
        // 教科书式画法：每条 ψₙ 以自己的能级为基线画出来
        for (let k = 0; k <= Math.min(n, levelsShown); k++) {
          const E = energy(k)
          const active = k === n
          const xt = turningPoint(E)

          // 能级线只画到经典转折点之间，让「经典允许区」一目了然
          f.ctx.save()
          f.ctx.strokeStyle = active ? f.colors.energy : f.colors.line
          f.ctx.lineWidth = active ? 1.6 : 1
          f.ctx.setLineDash(active ? [] : [3, 3])
          f.ctx.beginPath()
          f.ctx.moveTo(sx.toPx(-xt), sy.toPx(E))
          f.ctx.lineTo(sx.toPx(xt), sy.toPx(E))
          f.ctx.stroke()
          f.ctx.restore()

          const scale = (0.62 * omega) / Math.max(1, Math.sqrt(omega))
          const curve = new Float64Array(N_POINTS)
          for (let i = 0; i < N_POINTS; i++) {
            const psi = harmonicEigenstate(k, xs[i]!, omega)
            curve[i] = E + scale * (useProb ? psi * psi * 1.4 : psi)
          }
          drawCurve(f, sx, sy, curve, xs, {
            color: f.colors.wave,
            width: active ? 2 : 1,
            alpha: active ? 1 : 0.28,
          })

          if (active) {
            f.ctx.save()
            f.ctx.fillStyle = f.colors.energy
            f.ctx.font = '11px var(--font-sans, sans-serif)'
            f.ctx.textAlign = 'right'
            f.ctx.textBaseline = 'bottom'
            f.ctx.fillText(`n=${k}   E=${E.toFixed(2)}`, sx.toPx(xt) - 3, sy.toPx(E) - 3)
            f.ctx.restore()
          }
        }
      } else {
        // single / coherent：单条曲线铺满整个画布高度，方便看细节
        const re = bufRe.current
        const im = bufIm.current
        const prob = bufProb.current

        if (mode === 'single') {
          for (let i = 0; i < N_POINTS; i++) {
            const psi = harmonicEigenstate(n, xs[i]!, omega)
            re[i] = psi
            im[i] = 0
            prob[i] = psi * psi
          }
        } else {
          for (let i = 0; i < N_POINTS; i++) {
            let sr = 0
            let si = 0
            for (let k = 0; k < COHERENT_TERMS; k++) {
              const c = coherentCoeffs[k]!
              if (c < 1e-10) continue
              const psi = c * harmonicEigenstate(k, xs[i]!, omega)
              const phase = -energy(k) * t
              sr += psi * Math.cos(phase)
              si += psi * Math.sin(phase)
            }
            re[i] = sr
            im[i] = si
            prob[i] = sr * sr + si * si
          }
        }

        const dx = xs[1]! - xs[0]!
        let s0 = 0
        let s1 = 0
        let s2 = 0
        for (let i = 0; i < N_POINTS; i++) {
          s0 += prob[i]!
          s1 += prob[i]! * xs[i]!
          s2 += prob[i]! * xs[i]! * xs[i]!
        }
        const xMean = s0 > 0 ? s1 / s0 : 0
        const xSpread = Math.sqrt(Math.max(0, (s0 > 0 ? s2 / s0 : 0) - xMean * xMean))
        const now = performance.now()
        if (now - lastPushRef.current > 120) {
          lastPushRef.current = now
          setStats({ xMean, xSpread })
        }

        // 单态视图换一套纵轴：0 在中间，量纲是 ψ 而不是能量
        let peak = 0
        for (let i = 0; i < N_POINTS; i++) {
          peak = Math.max(peak, useProb ? prob[i]! : Math.abs(re[i]!), Math.abs(im[i]!))
        }
        peak = peak || 1
        const syPsi = makeScale([-1.35 * peak, 1.35 * peak], [f.height - pad.bottom, pad.top])

        if (useProb) {
          drawCurve(f, sx, syPsi, prob, xs, {
            color: f.colors.prob,
            width: 2,
            fill: f.colors.prob + '22',
          })
          if (showClassical) {
            // 经典概率密度 P(x) = 1/(π√(A²−x²))，A 为转折点。
            // 端点发散，这里在离转折点半格处截断。
            const E = mode === 'single' ? energy(n) : energy(alpha * alpha)
            const A = turningPoint(E)
            const pc = new Float64Array(N_POINTS)
            const ceiling = 1.3 * peak
            for (let i = 0; i < N_POINTS; i++) {
              const x = xs[i]!
              // 转折点处发散：截断到画布上沿，否则曲线会画到坐标轴外面去
              pc[i] =
                Math.abs(x) < A - dx
                  ? Math.min(ceiling, 1 / (Math.PI * Math.sqrt(A * A - x * x)))
                  : NaN
            }
            drawCurve(f, sx, syPsi, pc, xs, {
              color: f.colors.warn,
              width: 1.6,
              dash: [5, 4],
            })
          }
        } else {
          drawCurve(f, sx, syPsi, re, xs, { color: f.colors.wave, width: 2 })
          if (mode === 'coherent') {
            drawCurve(f, sx, syPsi, im, xs, { color: f.colors.waveIm, width: 1.4, dash: [4, 3] })
          }
        }

        // 经典转折点竖线
        const E = mode === 'single' ? energy(n) : energy(alpha * alpha)
        const A = turningPoint(E)
        f.ctx.save()
        f.ctx.strokeStyle = f.colors.faint
        f.ctx.setLineDash([2, 4])
        f.ctx.lineWidth = 1
        for (const xt of [-A, A]) {
          f.ctx.beginPath()
          f.ctx.moveTo(sx.toPx(xt), pad.top)
          f.ctx.lineTo(sx.toPx(xt), f.height - pad.bottom)
          f.ctx.stroke()
        }
        f.ctx.fillStyle = f.colors.faint
        f.ctx.font = '10.5px var(--font-sans, sans-serif)'
        f.ctx.textAlign = 'left'
        f.ctx.textBaseline = 'top'
        f.ctx.fillText('经典禁区 →', sx.toPx(A) + 3, pad.top + 2)
        f.ctx.restore()

        const legend: { color: string; label: string; dash?: number[] }[] = useProb
          ? [{ color: f.colors.prob, label: '|ψ|²' }]
          : [{ color: f.colors.wave, label: mode === 'coherent' ? 'Re ψ' : 'ψ(x)' }]
        if (useProb && showClassical)
          legend.push({ color: f.colors.warn, label: '经典 P(x)', dash: [5, 4] })
        if (!useProb && mode === 'coherent')
          legend.push({ color: f.colors.waveIm, label: 'Im ψ', dash: [4, 3] })
        drawLegend(f, legend)

        if (mode === 'coherent') {
          f.ctx.save()
          f.ctx.fillStyle = f.colors.faint
          f.ctx.font = '11px var(--font-mono, monospace)'
          f.ctx.textAlign = 'left'
          f.ctx.textBaseline = 'bottom'
          f.ctx.fillText(
            `t = ${t.toFixed(1)}   经典周期 T = ${((2 * Math.PI) / omega).toFixed(2)}`,
            pad.left + 6,
            f.height - pad.bottom - 4,
          )
          f.ctx.restore()
        }
      }
    },
    [mode, n, omega, alpha, useProb, showClassical, xs, coherentCoeffs, eTop, xMax],
    { animate, padding: { left: 46, bottom: 34 } },
  )

  const currentE = mode === 'coherent' ? energy(alpha * alpha) : energy(n)

  return (
    <SimShell
      id="harmonic-oscillator"
      title="一维谐振子"
      subtitle={
        <>
          等间距能级、零点能、渗进经典禁区的尾巴，以及唯一一种「像经典粒子」的量子态。
          单位取 ħ = m = 1。
        </>
      }
      onReset={reset}
      readout={
        <Readout
          items={[
            {
              label: mode === 'coherent' ? `⟨E⟩ (|α|²=${(alpha * alpha).toFixed(1)})` : `Eₙ = (n+½)ħω`,
              value: currentE.toFixed(3),
              color: 'var(--c-energy)',
            },
            { label: '能级间距 ħω', value: omega.toFixed(2) },
            { label: '经典转折点 ±A', value: `±${turningPoint(currentE).toFixed(2)}` },
            {
              label: mode === 'levels' ? '零点能 E₀' : 'Δx',
              value:
                mode === 'levels' ? (0.5 * omega).toFixed(3) : stats.xSpread.toFixed(3),
            },
          ]}
        />
      }
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider
              label={
                <>
                  角频率 <span className="font-mono">ω</span>
                </>
              }
              value={omega}
              min={0.4}
              max={2.5}
              step={0.05}
              onChange={setOmega}
              hint="势阱变陡 → 能级间距 ħω 变大，波函数被压窄"
            />
            {mode === 'coherent' ? (
              <Slider
                label={
                  <>
                    相干态振幅 <span className="font-mono">α</span>
                  </>
                }
                value={alpha}
                min={0}
                max={4}
                step={0.1}
                onChange={setAlpha}
                hint={`平均光子数 |α|² = ${(alpha * alpha).toFixed(2)}；α → 0 就是基态`}
              />
            ) : (
              <Slider
                label={
                  <>
                    量子数 <span className="font-mono">n</span>
                  </>
                }
                value={n}
                min={0}
                max={MAX_N}
                step={1}
                onChange={(v) => setN(Math.round(v))}
                hint={`节点数 = n = ${n}`}
              />
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <Segmented
              label="视图"
              value={mode}
              onChange={(v) => {
                setMode(v)
                timeRef.current = 0
                if (v === 'coherent') setUseProb(true)
              }}
              options={[
                { value: 'levels', label: '能级阶梯', title: '教科书式：每条 ψₙ 画在自己的能级上' },
                { value: 'single', label: '单个本征态', title: '放大看一个 ψₙ 的细节' },
                { value: 'coherent', label: '相干态', title: '不弥散的振荡波包' },
              ]}
            />
            <div className="flex flex-wrap items-center gap-4">
              <Toggle
                label={useProb ? '显示 |ψ|²' : '显示 ψ'}
                checked={useProb}
                onChange={setUseProb}
              />
              {useProb ? (
                <Toggle label="对照经典分布" checked={showClassical} onChange={setShowClassical} />
              ) : null}
              {mode === 'coherent' ? (
                <>
                  <Button onClick={() => setPlaying((p) => !p)} variant="primary">
                    {playing ? '暂停' : '播放'}
                  </Button>
                  <Button onClick={() => (timeRef.current = 0)}>t = 0</Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      }
      prompts={[
        <>
          在「能级阶梯」下把 <code>n</code> 拉到 8：能级之间永远等距 <code>ħω</code>。
          这是谐振子独有的——回头看无限深势阱，那里的间距是越往上越大的。
        </>,
        <>
          把 <code>ω</code> 调小到 0.4，注意基态能 <code>E₀ = ħω/2</code> 变小但绝不为零。
          想让 E₀ = 0 就得让粒子精确停在 x = 0 且 p = 0，<code>ΔxΔp ≥ ħ/2</code> 不允许。
        </>,
        <>
          切到「单个本征态」+ 显示 ψ，看 n = 0 的曲线在两条虚线（经典转折点）之外并没有归零——
          粒子有确定的概率出现在经典能量禁止的区域。这就是隧道效应的同一个根源。
        </>,
        <>
          显示 |ψ|² 并打开「对照经典分布」，把 n 从 0 加到 20：
          量子概率密度的振荡包络越来越贴合经典曲线（两端概率大，因为经典粒子在转折点最慢）。
        </>,
        <>
          切到「相干态」播放：波包整体来回振荡、形状不变、周期恰好是经典周期 <code>T = 2π/ω</code>。
          这是薛定谔 1926 年就找出来的「最像经典粒子」的量子态，也是激光的理论描述。
        </>,
      ]}
    >
      <canvas
        ref={canvasRef}
        className="h-[320px] w-full sm:h-[400px]"
        role="img"
        aria-label={`谐振子，视图 ${mode}，量子数 ${n}，角频率 ${omega.toFixed(2)}`}
      />
    </SimShell>
  )
}
