import { useMemo, useRef, useState } from 'react'
import SimShell from './SimShell'
import { Button, Readout, Segmented, Slider, Toggle } from './controls'
import { useCanvasFrame } from './useCanvas'
import {
  drawAxes,
  drawBand,
  drawCurve,
  drawHLine,
  drawLegend,
  formatTick,
  makeScale,
  niceTicks,
} from '@/lib/plot'
import { infiniteWellEigenstate, infiniteWellEnergy } from '@/lib/numerics'

/**
 * 一维无限深势阱：改变宽度 L 与量子数 n，实时看波函数、概率密度与能级。
 *
 * 教学目标（对应 2.7 与 2.5）：
 *  - L 变小 → 全部能级抬高（E ∝ 1/L²），这是不确定性原理最直观的一次露面
 *  - 定态的 |ψ|² 不随时间变；叠加态的 |ψ|² 会晃 —— 「定态」这个词的字面含义
 *  - 节点数 = n − 1，能量越高波函数弯得越厉害
 */

const N_POINTS = 600
const MAX_N = 12
const LEVELS_SHOWN = 8

type Mode = 'single' | 'superposition'

export default function InfiniteWell() {
  const [L, setL] = useState(1)
  const [n, setN] = useState(1)
  const [mode, setMode] = useState<Mode>('single')
  const [showPsi, setShowPsi] = useState(true)
  const [showProb, setShowProb] = useState(true)
  const [playing, setPlaying] = useState(true)
  // 叠加态权重（未归一化），对应 c₁…c₄
  const [weights, setWeights] = useState<number[]>([1, 1, 0, 0])

  const timeRef = useRef(0)

  const reset = () => {
    setL(1)
    setN(1)
    setMode('single')
    setShowPsi(true)
    setShowProb(true)
    setWeights([1, 1, 0, 0])
    timeRef.current = 0
    setPlaying(true)
  }

  // 归一化后的叠加系数
  const coeffs = useMemo(() => {
    const norm = Math.hypot(...weights)
    if (norm === 0) return weights.map(() => 0)
    return weights.map((w) => w / norm)
  }, [weights])

  const energies = useMemo(
    () => Array.from({ length: MAX_N }, (_, i) => infiniteWellEnergy(i + 1, L)),
    [L],
  )

  // 叠加态的平均能量 ⟨E⟩ = Σ|cₙ|²Eₙ —— 与「测能量只会得到某个 Eₙ」形成对照
  const meanEnergy = useMemo(() => {
    if (mode === 'single') return energies[n - 1]!
    return coeffs.reduce((s, c, i) => s + c * c * energies[i]!, 0)
  }, [mode, coeffs, energies, n])

  const xs = useMemo(() => {
    const a = new Float64Array(N_POINTS)
    for (let i = 0; i < N_POINTS; i++) a[i] = (i / (N_POINTS - 1)) * L
    return a
  }, [L])

  const bufRe = useRef(new Float64Array(N_POINTS))
  const bufIm = useRef(new Float64Array(N_POINTS))
  const bufProb = useRef(new Float64Array(N_POINTS))
  const yMaxRef = useRef(2)
  // ⟨x⟩、Δx 在绘制循环里算出来，但只以 ~8Hz 推给 React：
  // 每帧 setState 会让读数抖到看不清，也白白多跑一轮渲染
  const [stats, setStats] = useState({ xMean: 0.5, xSpread: 0.18 })
  const lastPushRef = useRef(0)

  const animate = mode === 'superposition' && playing

  const { canvasRef } = useCanvasFrame(
    (f, dt) => {
      if (animate) timeRef.current += dt * 0.9
      const t = mode === 'superposition' ? timeRef.current : 0

      const re = bufRe.current
      const im = bufIm.current
      const prob = bufProb.current

      // ψ(x,t) = Σ cₙ ψₙ(x) e^{−iEₙt/ħ}
      for (let i = 0; i < N_POINTS; i++) {
        let sr = 0
        let si = 0
        if (mode === 'single') {
          sr = infiniteWellEigenstate(n, xs[i]!, L)
        } else {
          for (let k = 0; k < coeffs.length; k++) {
            const c = coeffs[k]!
            if (c === 0) continue
            const psi = c * infiniteWellEigenstate(k + 1, xs[i]!, L)
            const phase = -energies[k]! * t
            sr += psi * Math.cos(phase)
            si += psi * Math.sin(phase)
          }
        }
        re[i] = sr
        im[i] = si
        prob[i] = sr * sr + si * si
      }

      // ⟨x⟩ 与 Δx
      const dx = L / (N_POINTS - 1)
      let s0 = 0
      let s1 = 0
      let s2 = 0
      for (let i = 0; i < N_POINTS; i++) {
        s0 += prob[i]!
        s1 += prob[i]! * xs[i]!
        s2 += prob[i]! * xs[i]! * xs[i]!
      }
      s0 *= dx
      s1 *= dx
      s2 *= dx
      const xMean = s0 > 0 ? s1 / s0 : L / 2
      const xSpread = Math.sqrt(Math.max(0, (s0 > 0 ? s2 / s0 : 0) - xMean * xMean))
      const now = performance.now()
      if (now - lastPushRef.current > 120) {
        lastPushRef.current = now
        setStats({ xMean: xMean / L, xSpread: xSpread / L })
      }

      // y 轴范围：跟随 √(2/L) 而不是每帧自适应，
      // 否则拖 L 的时候曲线原地不动、只有坐标轴数字在变，看不出「能量变了」
      const amp = Math.sqrt(2 / L)
      const target = Math.max(showProb ? amp * amp : 0, showPsi ? amp : 0) * 1.25
      yMaxRef.current += (target - yMaxRef.current) * 0.25

      const pad = f.padding
      const sx = makeScale([-0.12 * L, 1.12 * L], [pad.left, f.width - pad.right])
      const sy = makeScale([-yMaxRef.current, yMaxRef.current], [f.height - pad.bottom, pad.top])

      f.ctx.clearRect(0, 0, f.width, f.height)

      // 阱外区域：ψ ≡ 0 的地方涂灰，强调「无限高墙」是边界条件而不是画布边缘
      drawBand(f, sx, -0.12 * L, 0, f.colors.subtle)
      drawBand(f, sx, L, 1.12 * L, f.colors.subtle)

      drawAxes(f, sx, sy, {
        xLabel: 'x  （势阱宽度 L 为单位长度）',
        grid: true,
        zeroLine: true,
      })

      // 阱壁
      f.ctx.save()
      f.ctx.strokeStyle = f.colors.potential
      f.ctx.lineWidth = 2
      f.ctx.beginPath()
      for (const wall of [0, L]) {
        f.ctx.moveTo(sx.toPx(wall), pad.top)
        f.ctx.lineTo(sx.toPx(wall), f.height - pad.bottom)
      }
      f.ctx.stroke()
      f.ctx.restore()

      if (showProb) {
        drawCurve(f, sx, sy, prob, xs, {
          color: f.colors.prob,
          width: 2,
          fill: f.colors.prob + '22',
        })
      }
      if (showPsi) {
        drawCurve(f, sx, sy, re, xs, { color: f.colors.wave, width: 2 })
        if (mode === 'superposition') {
          drawCurve(f, sx, sy, im, xs, { color: f.colors.waveIm, width: 1.5, dash: [4, 3] })
        }
      }

      const legend: { color: string; label: string; dash?: number[] }[] = []
      if (showPsi) {
        legend.push({ color: f.colors.wave, label: mode === 'single' ? 'ψ(x)' : 'Re ψ(x,t)' })
        if (mode === 'superposition')
          legend.push({ color: f.colors.waveIm, label: 'Im ψ(x,t)', dash: [4, 3] })
      }
      if (showProb) legend.push({ color: f.colors.prob, label: '|ψ|²' })
      if (legend.length) drawLegend(f, legend)

      // 时间戳画在画布上而不是 DOM 里：rAF 循环不触发 React 重渲染，
      // 用 state 存时间会让每帧都 setState，白白拖慢一倍
      if (mode === 'superposition') {
        f.ctx.save()
        f.ctx.fillStyle = f.colors.faint
        f.ctx.font = '11px var(--font-mono, monospace)'
        f.ctx.textAlign = 'left'
        f.ctx.textBaseline = 'bottom'
        f.ctx.fillText(`t = ${t.toFixed(1)}`, pad.left + 6, f.height - pad.bottom - 4)
        f.ctx.restore()
      }
    },
    [L, n, mode, showPsi, showProb, coeffs, xs, energies],
    { animate, padding: { left: 52, bottom: 34 } },
  )

  // 能级图：把 E ∝ n²/L² 画出来
  const ladderRef = useCanvasFrame(
    (f) => {
      const pad = { top: 22, right: 12, bottom: 26, left: 46 }

      // 纵轴按 √E 均匀，不是按 E 均匀。
      //
      // 两个理由：Eₙ ∝ n² 在线性纵轴上会把 n=1,2,3 挤成贴着底边的一团
      // （n=8 时 E₁ 只占全高的 1.5%，根本分不开）；而 √Eₙ ∝ n/L 是等距的，
      // 八条能级铺满整个高度，同时「L 变小 → 整体上移」也依然直接可见。
      // 刻度标注的仍是真实能量值，读数不受影响。
      const eMax = infiniteWellEnergy(LEVELS_SHOWN, L) * 1.1
      const sMax = Math.sqrt(eMax)
      const sx = makeScale([0, 1], [pad.left, f.width - pad.right])
      const sy = makeScale([0, sMax], [f.height - pad.bottom, pad.top])
      const atE = (E: number) => Math.sqrt(Math.max(0, E))

      f.ctx.clearRect(0, 0, f.width, f.height)
      drawAxes(f, sx, sy, {
        grid: false,
        zeroLine: false,
        yLabel: 'E',
        xTicks: [],
        yTicks: niceTicks(0, sMax, 5),
        formatY: (s) => (s === 0 ? '0' : formatTick(Number((s * s).toPrecision(2)))),
      })

      f.ctx.save()
      f.ctx.fillStyle = f.colors.faint
      f.ctx.font = '9.5px var(--font-sans, sans-serif)'
      f.ctx.textAlign = 'left'
      f.ctx.textBaseline = 'top'
      f.ctx.fillText('纵轴按 √E 均匀', pad.left, 5)
      f.ctx.restore()

      // 固定在 E₁(L=1) 的参考线：坐标轴随 L 缩放，能级相对它的位置才是
      // 「能量真的变了」的可靠信号
      const eRef = infiniteWellEnergy(1, 1)
      if (eRef < eMax) {
        drawHLine(f, sx, sy, atE(eRef), { color: f.colors.faint, dash: [2, 3], width: 1 })
        f.ctx.save()
        f.ctx.fillStyle = f.colors.faint
        f.ctx.font = '10px var(--font-sans, sans-serif)'
        f.ctx.textAlign = 'right'
        f.ctx.textBaseline = 'top'
        f.ctx.fillText('E₁(L=1)', f.width - pad.right - 2, sy.toPx(atE(eRef)) + 2)
        f.ctx.restore()
      }

      for (let k = 1; k <= LEVELS_SHOWN; k++) {
        const E = infiniteWellEnergy(k, L)
        if (E > eMax) continue
        const active = mode === 'single' ? k === n : (coeffs[k - 1] ?? 0) !== 0
        drawHLine(f, sx, sy, atE(E), {
          color: active ? f.colors.energy : f.colors.line,
          width: active ? 2.5 : 1,
          label: active ? `n=${k}` : undefined,
          labelColor: f.colors.energy,
        })
      }

      if (mode === 'superposition') {
        drawHLine(f, sx, sy, atE(meanEnergy), {
          color: f.colors.accent,
          dash: [5, 4],
          width: 1.5,
          label: '⟨E⟩',
        })
      }
    },
    [L, n, mode, coeffs, meanEnergy],
    { animate: false },
  )

  const E1 = infiniteWellEnergy(1, 1)

  return (
    <SimShell
      id="infinite-well"
      title="一维无限深势阱"
      subtitle={
        <>
          拖动宽度 <code>L</code> 与量子数 <code>n</code>，看能量、波形与概率分布怎么一起变。
          单位取 ħ = m = 1。
        </>
      }
      onReset={reset}
      readout={
        <Readout
          items={[
            {
              label: mode === 'single' ? `能量 Eₙ (n=${n})` : '平均能量 ⟨E⟩',
              value: meanEnergy.toFixed(3),
              color: 'var(--c-energy)',
            },
            { label: '相对 E₁(L=1)', value: `${(meanEnergy / E1).toFixed(2)} ×` },
            { label: '⟨x⟩ / L', value: stats.xMean.toFixed(3) },
            { label: 'Δx / L', value: stats.xSpread.toFixed(3) },
          ]}
        />
      }
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider
              label={
                <>
                  阱宽 <span className="font-mono">L</span>
                </>
              }
              value={L}
              min={0.6}
              max={2.5}
              step={0.05}
              onChange={setL}
              hint="缩小盒子，所有能级一起被顶上去：E ∝ 1/L²"
            />
            {mode === 'single' ? (
              <Slider
                label={
                  <>
                    量子数 <span className="font-mono">n</span>
                  </>
                }
                value={n}
                min={1}
                max={MAX_N}
                step={1}
                onChange={(v) => setN(Math.round(v))}
                hint={`节点数 = n − 1 = ${n - 1}（不含两端）`}
              />
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-[var(--text-muted)]">
                  叠加系数 c₁…c₄（自动归一化）
                </span>
                <div className="mt-1 grid grid-cols-4 gap-2">
                  {weights.map((w, i) => (
                    <label key={i} className="flex flex-col items-center gap-1">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={w}
                        onChange={(e) => {
                          const next = [...weights]
                          next[i] = Number(e.target.value)
                          setWeights(next)
                        }}
                        className="ql-range"
                        aria-label={`c${i + 1}`}
                      />
                      <span className="font-mono text-[11px] text-[var(--text-faint)]">
                        c{i + 1}={coeffs[i]!.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <Segmented
              label="状态"
              value={mode}
              onChange={(v) => {
                setMode(v)
                timeRef.current = 0
              }}
              options={[
                { value: 'single', label: '定态 ψₙ', title: '单个能量本征态' },
                { value: 'superposition', label: '叠加态', title: '多个本征态的线性组合，随时间演化' },
              ]}
            />
            <div className="flex flex-wrap items-center gap-4">
              <Toggle label="显示 ψ" checked={showPsi} onChange={setShowPsi} />
              <Toggle label="显示 |ψ|²" checked={showProb} onChange={setShowProb} />
              {mode === 'superposition' ? (
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
          把 <code>L</code> 从 2.5 拖到 0.6，盯住能级图上那条虚线（固定在 E₁(L=1) 的参考能量）：
          它会一路沉到图的底部，也就是说所有能级都远远升到了它上面。读数区的「相对 E₁(L=1)」
          会从 0.16 涨到 2.78 —— 「把粒子关得越紧，它的动能越大」，
          这就是 <code>ΔxΔp ≥ ħ/2</code> 的一个直接后果。
        </>,
        <>
          在定态下改变 <code>n</code>，注意 <code>|ψ|²</code> 始终不随时间变化（曲线是静止的）；
          切到叠加态并播放，<code>|ψ|²</code> 立刻开始左右晃。「定态」定的就是这件事。
        </>,
        <>
          叠加态里只留 c₁（其余拖到 0），播放——概率密度又不动了。
          单个本征态无论怎么演化都只是整体乘一个相位 <code>e^{'{−iEₙt/ħ}'}</code>，观测量看不见它。
        </>,
        <>
          让 n 取 10 以上再看 <code>|ψ|²</code>：条纹密到接近均匀分布，
          正是经典粒子在盒子里「哪儿都可能」的图像——对应原理在这里现身。
        </>,
      ]}
    >
      <div className="grid gap-0 md:grid-cols-[1fr_200px]">
        <canvas
          ref={canvasRef}
          className="h-[300px] w-full sm:h-[340px]"
          role="img"
          aria-label={`无限深势阱波函数，阱宽 ${L.toFixed(2)}，量子数 ${n}`}
        />
        {/* md:h-full 而不是 h-auto：canvas 的 h-auto 会退回内部 width/height 属性
            决定的固有比例，在网格里被压成一条窄带 */}
        <canvas
          ref={ladderRef.canvasRef}
          className="h-[170px] w-full border-t border-[var(--border)] md:h-full md:border-l md:border-t-0"
          role="img"
          aria-label="能级图"
        />
      </div>
    </SimShell>
  )
}
