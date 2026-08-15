import { translator, DEFAULT_LANG, type Lang } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { useQualityProfile } from '../core/sceneStore'
import { ControlGroup, Legend, CanvasStat, TimeBar, MiniPlot } from '../core/widgets'
import { Slider, Segmented, Toggle, Button } from '@/components/sim/controls'
import { createTube, createCurtain, GridPlane } from '../core/primitives'
import Tex from '@/components/math/Tex'
import { solveWell, type WellKind } from '@/lib/quantum3d'

/**
 * 模块 09 主场景：叠加态的时间演化。
 *
 * 第三个维度在这里被用作**时间**：|ψ(x,t)|² 的历史沿深度方向堆成一张瀑布图。
 * 于是「概率密度在晃」不再是一段转瞬即逝的动画，而是一张可以停下来端详的时空曲面——
 * 本征态是一条条笔直的沟壑，叠加态是斜着荡开的波纹。
 */

const SEG = 200
const HISTORY = 72
const X_SPAN = 8
const HIST_DEPTH = 5.5
/** 当前时刻的 |ψ|² 摆在管子前面，免得两者叠在一起互相遮挡 */
const PROB_Z = 1.3
const TIME_RATE = 1.0

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [6.5, 4.6, 8.5], title: '同时看到当前波函数与它的历史' },
  { id: 'front', label: '正视', position: [0, 1.6, 10], title: '只看当前时刻' },
  { id: 'history', label: '看历史', position: [0.01, 9, 2.6], target: [0, 0, -2.4], title: '俯视瀑布图：时间从近到远' },
  { id: 'phase', label: '沿 x 看', position: [11, 1.2, 0.01], title: '正对复平面' },
]

const MAX_LEVELS = 4

export default function SuperpositionScene({ lang = DEFAULT_LANG }: { lang?: Lang }) {
  const T = translator(lang)
  const p = useScenePalette()
  const profile = useQualityProfile()
  const apiRef = useRef<SceneApi | null>(null)

  const [kind, setKind] = useState<WellKind>('infinite')
  const [coeffs, setCoeffs] = useState<number[]>([1, 1, 0, 0])
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [showHistory, setShowHistory] = useState(true)
  const [stats, setStats] = useState({ t: 0, mean: 0 })
  const [meanTrace, setMeanTrace] = useState<[number, number][]>([])

  const sol = useMemo(
    () => solveWell({ kind, width: 4, depth: 8, omega: 1 }, MAX_LEVELS),
    [kind],
  )

  // 归一化系数：|c_n|² 之和为 1
  const norm = useMemo(() => {
    const s = Math.sqrt(coeffs.reduce((a, c) => a + c * c, 0)) || 1
    return coeffs.map((c) => c / s)
  }, [coeffs])

  const resetToken = useRef(0)
  /** ⟨x⟩ 的原始时间序列。归一化后的绘图坐标另算，否则会把已经归一化的值再归一化一次 */
  const traceRef = useRef<[number, number][]>([])
  const reset = () => {
    resetToken.current += 1
    traceRef.current = []
    setMeanTrace([])
  }

  useEffect(reset, [kind, coeffs])

  const active = norm.map((c, i) => ({ c, i })).filter((x) => Math.abs(x.c) > 1e-6)
  const beat =
    active.length >= 2
      ? (2 * Math.PI) /
        Math.abs(sol.states[active[1]!.i]!.energy - sol.states[active[0]!.i]!.energy)
      : null

  const stateTex = useMemo(() => {
    const parts = norm
      .map((c, i) => (Math.abs(c) > 1e-6 ? `${c.toFixed(2)}\\,\\ket{${i}}` : null))
      .filter(Boolean)
    return `\\ket{\\Psi(t)} = ${parts.join(' + ')}` + (parts.length > 1 ? T('\\quad(\\text{各项还要乘 } \\ee^{-\\ii E_n t/\\hbar})') : '')
  }, [norm])

  return (
    <SceneShell
      lang={lang}
      id="superposition"
      title={T('叠加态：为什么本征态不动，而叠加会晃')}
      subtitle={T('第三个维度是时间。当前的 |ψ|² 在最前面，它的历史往后堆成一张时空曲面——本征态是笔直的沟壑，叠加态是荡开的波纹。')}
      apiRef={apiRef}
      height={560}
      controls={
        <>
          <ControlGroup title={T('势阱')}>
            <Segmented
              value={kind}
              onChange={(v) => setKind(v as WellKind)}
              options={[
                { value: 'infinite', label: T('无限深阱') },
                { value: 'harmonic', label: T('谐振子') },
              ]}
            />
          </ControlGroup>

          <ControlGroup
            title={T('叠加系数 cₙ')}
            hint={T('只有一个非零系数时画面完全静止；两个及以上才开始晃。')}
          >
            {coeffs.map((c, i) => (
              <Slider
                key={i}
                label={
                  <span>
                    c<sub>{i}</sub>（E = {sol.states[i]?.energy.toFixed(3)}）
                  </span>
                }
                value={c}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setCoeffs((s) => s.map((x, k) => (k === i ? v : x)))}
              />
            ))}
            <div className="flex flex-wrap gap-1.5">
              <Button onClick={() => setCoeffs([1, 0, 0, 0])}>{T('基态')}</Button>
              <Button onClick={() => setCoeffs([1, 1, 0, 0])}>0+1</Button>
              <Button onClick={() => setCoeffs([1, 0, 1, 0])}>0+2</Button>
              {kind === 'harmonic' ? (
                <Button
                  onClick={() => setCoeffs([1, 1, 0.707, 0.408])}
                  title={T('谐振子的相干态：波包形状不变，整体来回振荡')}
                >
                  {T('相干态')}
                </Button>
              ) : null}
            </div>
          </ControlGroup>

          <ControlGroup title={T('演化')}>
            <TimeBar
              playing={playing}
              onPlay={setPlaying}
              onReset={reset}
              speed={speed}
              onSpeed={setSpeed}
              timeLabel={`t = ${stats.t.toFixed(2)}`}
            />
            <Toggle label={T('显示时间历史（瀑布图）')} checked={showHistory} onChange={setShowHistory} />
          </ControlGroup>

          <ControlGroup title={T('⟨x⟩ 随时间')}>
            <MiniPlot
              series={[{ points: meanTrace, color: p.energy }]}
              height={70}
              ariaLabel={T('位置期望值随时间')}
            />
            <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">
              {T(
                '这条曲线就是「原子这根天线」的摆动。只留一个能级时它是一条死平的直线—— 本征态不辐射，所以原子稳定。',
              )}
            </p>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="overflow-x-auto text-[15px]">
            <Tex>{stateTex}</Tex>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>⟨x⟩ = {stats.mean.toFixed(3)}</span>
            <span>⟨E⟩ = {norm.reduce((a, c, i) => a + c * c * (sol.states[i]?.energy ?? 0), 0).toFixed(3)}</span>
            {beat ? (
              <span>{T('拍频周期 T = 2πħ/ΔE = {0}', beat.toFixed(2))}</span>
            ) : (
              <span>{T('单一能级：无振荡')}</span>
            )}
          </div>
          <Legend
            items={[
              { color: p.real, label: T('ψ（复数管）') },
              { color: p.prob, label: T('当前 |ψ|²') },
              { color: p.faint, label: T('|ψ|² 的历史（时间往后）') },
            ]}
          />
        </div>
      }
      guide={[
        T('先只留 c₀（点「基态」）：管子在转，但 |ψ|² 完全不动，历史曲面是一条条笔直的沟。这就是「定态」。'),
        T('点「0+1」：概率密度开始左右晃，历史曲面变成斜向的波纹。晃动周期由能级差决定——读数里的 T = 2πħ/ΔE 可以拿秒表核对。'),
        T('点「0+2」：晃动频率变了（因为 ΔE 变了），而且形状是「呼吸」而不是「左右晃」——奇偶宇称决定了它怎么动。'),
        T('切到谐振子并点「相干态」：波包形状保持不变、像经典小球一样来回振荡。这是谐振子能级等间距的特权，换成方阱就会散架。'),
        T('切到「看历史」视角俯视瀑布图：整段时间演化被压成一张静止的图，比盯着动画更容易看清周期。'),
      ]}
      pitfalls={[
        {
          title: T('“叠加态的能量是各能级的平均”'),
          body: T('能量期望值确实是加权平均，但单次测量只会得到某个 Eₙ，永远测不到那个平均值。'),
        },
        {
          title: T('“本征态不随时间变化”'),
          body: T('态矢量一直在变（相位在转），不变的是所有可观测量。区别在于整体相位不可观测。'),
        },
        {
          title: T('“晃动频率是 E/ħ”'),
          body: T('是能级**差**除以 ħ。绝对能量零点可以任意平移而不影响任何观测——这也是为什么只有能级差有物理意义。'),
        },
      ]}
      reflect={[
        T('把 c₀ 设为 0.99、c₁ 设为 0.14，晃动的频率变不变？幅度变不变？先猜再试。'),
        T('无限深阱里 E ∝ n²，所以叠加 0+1 与叠加 2+3 的晃动频率不同。哪个更快？'),
        T('如果叠加的两个态宇称相同（比如 0 和 2），⟨x⟩ 会振荡吗？看看 ⟨x⟩ 曲线，再想想矩阵元 ⟨0|x|2⟩ 的宇称。'),
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={3}
        maxDistance={26}
        overlay={
          <CanvasStat>
            t = {stats.t.toFixed(2)}　⟨x⟩ = {stats.mean.toFixed(3)}
            {beat ? `　T = ${beat.toFixed(2)}` : T('　定态')}
          </CanvasStat>
        }
      >
        <GridPlane size={5.5} divisions={11} y={-0.02} opacity={0.22} />
        <Line
          points={[
            [-X_SPAN / 2, 0, 0],
            [X_SPAN / 2, 0, 0],
          ]}
          color={p.axis}
          lineWidth={1.2}
          transparent
          opacity={0.6}
        />
        <SceneLabel position={[X_SPAN / 2 + 0.4, 0, 0]} tone="muted" size="xs">
          x
        </SceneLabel>
        <SceneLabel position={[-X_SPAN / 2 - 0.5, 0, -HIST_DEPTH]} tone="muted" size="xs">
          ← {T('时间演化')}
        </SceneLabel>

        <Evolve
          sol={sol}
          coeffs={norm}
          playing={playing}
          speed={speed}
          showHistory={showHistory}
          resetToken={resetToken}
          onStats={(s) => {
            setStats(s)
            const tr = traceRef.current
            tr.push([s.t, s.mean])
            while (tr.length > 1 && tr[0]![0] < s.t - 20) tr.shift()
            const t0 = tr[0]![0]
            const span = Math.max(1e-6, s.t - t0)
            // 按窗口内实际出现的振幅归一，而不是按阱宽：叠加系数很不均衡时
            // ⟨x⟩ 的摆幅可能只有阱宽的百分之几，按阱宽归一会画成一条直线
            let amp = 0.02
            for (const q of tr) amp = Math.max(amp, Math.abs(q[1]))
            setMeanTrace(
              tr.map((q) => [(q[0] - t0) / span, 0.5 + (q[1] / amp) * 0.42] as [number, number]),
            )
          }}
          detail={profile.rich ? 1 : 0.6}
        />
      </SceneCanvas>
    </SceneShell>
  )
}

function Evolve({
  sol,
  coeffs,
  playing,
  speed,
  showHistory,
  resetToken,
  onStats,
  detail,
}: {
  sol: ReturnType<typeof solveWell>
  coeffs: number[]
  playing: boolean
  speed: number
  showHistory: boolean
  resetToken: React.MutableRefObject<number>
  onStats: (s: { t: number; mean: number }) => void
  detail: number
}) {
  const p = useScenePalette()
  const rows = Math.max(24, Math.round(HISTORY * detail))
  const tube = useMemo(() => createTube(SEG, 7), [])
  const curtain = useMemo(() => createCurtain(SEG), [])
  const buf = useMemo(() => new Float32Array(SEG * 3), [])
  const probBuf = useMemo(() => new Float32Array(SEG * 3), [])

  // 瀑布图：rows × SEG 的网格，每帧把最新一行写进环形缓冲区
  const history = useMemo(() => new Float32Array(rows * SEG), [rows])
  const head = useRef(0)
  const histGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(rows * SEG * 3)
    const idx = new Uint32Array((rows - 1) * (SEG - 1) * 6)
    let k = 0
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < SEG - 1; i++) {
        const a = j * SEG + i
        idx[k++] = a
        idx[k++] = a + 1
        idx[k++] = a + SEG + 1
        idx[k++] = a
        idx[k++] = a + SEG + 1
        idx[k++] = a + SEG
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setIndex(new THREE.BufferAttribute(idx, 1))
    return g
  }, [rows])

  useEffect(
    () => () => {
      tube.geometry.dispose()
      curtain.geometry.dispose()
      histGeom.dispose()
    },
    [tube, curtain, histGeom],
  )

  const time = useRef(0)
  const report = useRef(0)
  const histAcc = useRef(0)
  const token = useRef(-1)

  // 预采样各本征态到固定段数，避免逐帧插值
  const sampled = useMemo(() => {
    const out: Float64Array[] = []
    const xs = new Float64Array(SEG)
    const m = sol.x.length
    for (const st of sol.states) {
      const a = new Float64Array(SEG)
      for (let i = 0; i < SEG; i++) {
        const t = (i / (SEG - 1)) * (m - 1)
        const i0 = Math.floor(t)
        const i1 = Math.min(m - 1, i0 + 1)
        a[i] = st.psi[i0]! + (st.psi[i1]! - st.psi[i0]!) * (t - i0)
      }
      out.push(a)
    }
    for (let i = 0; i < SEG; i++) {
      const t = (i / (SEG - 1)) * (m - 1)
      const i0 = Math.floor(t)
      const i1 = Math.min(m - 1, i0 + 1)
      xs[i] = sol.x[i0]! + (sol.x[i1]! - sol.x[i0]!) * (t - i0)
    }
    return { psis: out, xs }
  }, [sol])

  const scale = useMemo(() => {
    let m = 1e-9
    for (const a of sampled.psis) for (let i = 0; i < SEG; i++) m = Math.max(m, Math.abs(a[i]!))
    return { amp: 0.85 / m, prob: 1.5 / (m * m) }
  }, [sampled])

  const X = (x: number) => ((x - (sol.xMin + sol.xMax) / 2) / (sol.xMax - sol.xMin)) * X_SPAN

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    if (token.current !== resetToken.current) {
      token.current = resetToken.current
      time.current = 0
      history.fill(0)
      head.current = 0
    }
    if (playing) time.current += dt * speed * TIME_RATE

    const t = time.current
    let mean = 0
    let normSum = 0

    for (let i = 0; i < SEG; i++) {
      let re = 0
      let im = 0
      for (let n = 0; n < coeffs.length && n < sampled.psis.length; n++) {
        const c = coeffs[n]!
        if (Math.abs(c) < 1e-9) continue
        const phase = -sol.states[n]!.energy * t
        const v = c * sampled.psis[n]![i]!
        re += v * Math.cos(phase)
        im += v * Math.sin(phase)
      }
      const wx = X(sampled.xs[i]!)
      buf[i * 3] = wx
      buf[i * 3 + 1] = re * scale.amp
      buf[i * 3 + 2] = im * scale.amp
      const pr = re * re + im * im
      probBuf[i * 3] = wx
      probBuf[i * 3 + 1] = pr * scale.prob
      probBuf[i * 3 + 2] = PROB_Z
      mean += sampled.xs[i]! * pr
      normSum += pr
    }
    tube.update(buf, 0.04)
    curtain.update(probBuf, 0)


    // 历史：每 1/24 秒采一行，太密的话曲面会糊成一片
    if (showHistory && playing) {
      histAcc.current += dt
      if (histAcc.current > 1 / 24) {
        histAcc.current = 0
        head.current = (head.current + 1) % rows
        const row = head.current * SEG
        for (let i = 0; i < SEG; i++) history[row + i] = probBuf[i * 3 + 1]!
      }
    }

    if (showHistory) {
      const pos = histGeom.getAttribute('position') as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      for (let j = 0; j < rows; j++) {
        // j = 0 是最新的一行（离观众最近）
        const src = ((head.current - j + rows * 2) % rows) * SEG
        const z = -(j / (rows - 1)) * HIST_DEPTH
        for (let i = 0; i < SEG; i++) {
          const o = (j * SEG + i) * 3
          arr[o] = buf[i * 3]!
          arr[o + 1] = history[src + i]! * 0.55
          arr[o + 2] = z
        }
      }
      pos.needsUpdate = true
      histGeom.computeBoundingSphere()
    }

    report.current += dt
    if (report.current > 0.1) {
      report.current = 0
      onStats({ t, mean: normSum > 0 ? mean / normSum : 0 })
    }
  })

  return (
    <group>
      {showHistory ? (
        <mesh geometry={histGeom}>
          <meshStandardMaterial
            color={p.prob}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
            roughness={0.85}
            wireframe={false}
          />
        </mesh>
      ) : null}
      <mesh geometry={curtain.geometry}>
        <meshStandardMaterial color={p.prob} transparent opacity={0.7} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <mesh geometry={tube.geometry}>
        <meshStandardMaterial color={p.real} roughness={0.32} metalness={0.1} />
      </mesh>
    </group>
  )
}
