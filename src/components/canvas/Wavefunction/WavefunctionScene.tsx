import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { ControlGroup, Legend, CanvasStat, TimeBar } from '../core/widgets'
import { Slider, Toggle, Button } from '@/components/sim/controls'
import { createTube, createCurtain, createPolyline, GridPlane } from '../core/primitives'
import Tex from '@/components/math/Tex'
import { SplitOperator, expectationX, spreadX, probabilityDensity } from '@/lib/numerics'
import { momentumStats } from '@/lib/quantum3d'

/**
 * 模块 02 主场景：波函数本身。
 *
 * 这里要把三件事同时摆在一个空间里，而这正是二维图做不到的：
 *   ψ 在复平面里的完整形状（管）、它在两面墙上的实部与虚部影子、以及 |ψ|²。
 * 「实部和虚部只是同一条曲线的两个投影」这句话，看一眼就懂了。
 */

const N = 512
const X_MIN = -40
const X_MAX = 40
const DT = 0.005
const SEG = 320
const X_SPAN = 14
const WALL_Z = -2.4
const WALL_Y = -2.0
const PROB_Z = 2.4
/** 每秒推进多少物理时间。太快的话波包十几秒就撞上吸收层，来不及看清展开 */
const TIME_RATE = 1.5

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [8, 5.5, 11], title: '同时看到管子与两面墙上的影子' },
  { id: 'real', label: '看实部', position: [0, 0.6, 13], title: '正对实部墙：这就是教科书上画的那条曲线' },
  { id: 'imag', label: '看虚部', position: [0, 12, 0.01], title: '俯视：看虚部的影子' },
  { id: 'phase', label: '沿 x 看', position: [14, 0.6, 0.01], title: '正对复平面：ψ 在每一点上是一个复数' },
]

interface Stats {
  norm: number
  mean: number
  sigma: number
  sigmaP: number
  t: number
}

export default function WavefunctionScene() {
  const p = useScenePalette()
  const apiRef = useRef<SceneApi | null>(null)

  const [sigma0, setSigma0] = useState(3.2)
  const [k0, setK0] = useState(0.7)
  const [x0, setX0] = useState(-8)
  const [second, setSecond] = useState(false)
  const [amplitude, setAmplitude] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [showRe, setShowRe] = useState(true)
  const [showIm, setShowIm] = useState(true)
  const [showProb, setShowProb] = useState(true)
  const [resolution, setResolution] = useState(1.2)
  const [stats, setStats] = useState<Stats>({ norm: 1, mean: 0, sigma: 1, sigmaP: 1, t: 0 })
  const [lastMeasure, setLastMeasure] = useState<number | null>(null)

  const op = useMemo(
    () =>
      new SplitOperator({
        n: N,
        xMin: X_MIN,
        xMax: X_MAX,
        dt: DT,
        potential: new Float64Array(N), // 自由粒子：V ≡ 0
        absorbFraction: 0.06,
      }),
    [],
  )

  const resetToken = useRef(0)

  /**
   * 制备初态。第二个波包用来演示「两团概率相遇时会干涉」——
   * 注意干涉出现在 |ψ|² 里，而不是把两团概率简单相加。
   */
  const prepare = useCallback(() => {
    op.setGaussian(x0, k0, sigma0)
    if (second) {
      // 反向的第二个波包，叠加后归一化
      const re2 = new Float64Array(N)
      const im2 = new Float64Array(N)
      const norm = Math.pow(2 * Math.PI * sigma0 * sigma0, -0.25)
      for (let i = 0; i < N; i++) {
        const d = op.x[i]! - -x0
        const env = norm * Math.exp(-(d * d) / (4 * sigma0 * sigma0))
        re2[i] = env * Math.cos(-k0 * op.x[i]!)
        im2[i] = env * Math.sin(-k0 * op.x[i]!)
      }
      let s = 0
      for (let i = 0; i < N; i++) {
        op.re[i] = op.re[i]! + re2[i]!
        op.im[i] = op.im[i]! + im2[i]!
        s += op.re[i]! * op.re[i]! + op.im[i]! * op.im[i]!
      }
      const f = 1 / Math.sqrt(s * op.dx)
      for (let i = 0; i < N; i++) {
        op.re[i] = op.re[i]! * f
        op.im[i] = op.im[i]! * f
      }
    }
    // 故意乘上一个不等于 1 的整体因子：用来演示归一化到底在做什么
    if (amplitude !== 1) {
      for (let i = 0; i < N; i++) {
        op.re[i] = op.re[i]! * amplitude
        op.im[i] = op.im[i]! * amplitude
      }
    }
    resetToken.current += 1
    setLastMeasure(null)
  }, [op, x0, k0, sigma0, second, amplitude])

  useEffect(() => {
    prepare()
  }, [prepare])

  /** 归一化：把 ∫|ψ|² 拉回 1，形状一点不变 */
  const normalize = useCallback(() => {
    let s = 0
    for (let i = 0; i < N; i++) s += op.re[i]! ** 2 + op.im[i]! ** 2
    const f = 1 / Math.sqrt(s * op.dx)
    for (let i = 0; i < N; i++) {
      op.re[i] = op.re[i]! * f
      op.im[i] = op.im[i]! * f
    }
    setAmplitude(1)
    resetToken.current += 1
  }, [op])

  /**
   * 位置测量：按 |ψ|² 抽一个位置，然后把波函数换成以该点为中心、
   * 宽度等于仪器分辨率的高斯。
   *
   * 刻意**不**用 δ 函数：真实仪器分辨率有限，测量后的波包宽度就是分辨率，
   * 而 δ 函数会让动量不确定度发散——那是数学理想化，不是实验室里发生的事。
   */
  const measure = useCallback(() => {
    const prob = new Float64Array(N)
    probabilityDensity(op.re, op.im, prob)
    let total = 0
    for (let i = 0; i < N; i++) total += prob[i]!
    let u = Math.random() * total
    let idx = 0
    for (let i = 0; i < N; i++) {
      u -= prob[i]!
      if (u <= 0) {
        idx = i
        break
      }
    }
    const xm = op.x[idx]!
    op.setGaussian(xm, k0, Math.max(0.35, resolution))
    setLastMeasure(xm)
    resetToken.current += 1
  }, [op, k0, resolution])

  return (
    <SceneShell
      id="wavefunction"
      title="波函数：一条在复平面里扭动的曲线"
      subtitle="中间那根管子是 ψ 本身。两面墙上的曲线是它的实部与虚部影子，右侧的幕布是 |ψ|²——唯一能直接对应实验的量。"
      apiRef={apiRef}
      height={560}
      controls={
        <>
          <ControlGroup title="制备波包">
            <Slider label="中心位置 x₀" value={x0} min={-20} max={0} step={0.5} onChange={setX0} />
            <Slider label="宽度 σ" value={sigma0} min={0.8} max={7} step={0.1} onChange={setSigma0} />
            <Slider label="平均动量 k₀" value={k0} min={-3} max={3} step={0.05} onChange={setK0} />
            <Toggle label="加一个反向波包（看干涉）" checked={second} onChange={setSecond} />
          </ControlGroup>

          <ControlGroup
            title="归一化"
            hint="拖动整体幅度，形状完全不变，只有高度在缩放。点「归一化」把 ∫|ψ|²dx 拉回 1——这就是「粒子总在某处」。"
          >
            <Slider
              label="整体幅度"
              value={amplitude}
              min={0.3}
              max={2.5}
              step={0.05}
              onChange={setAmplitude}
              display={`×${amplitude.toFixed(2)}`}
            />
            <div className="flex gap-1.5">
              <Button variant="primary" onClick={normalize}>
                归一化
              </Button>
              <Button onClick={prepare}>重新制备</Button>
            </div>
            <div
              className={
                'rounded-lg border px-2.5 py-1.5 font-mono text-[12.5px] tabular-nums ' +
                (Math.abs(stats.norm - 1) < 0.01
                  ? 'border-[var(--border)] text-[var(--text-muted)]'
                  : 'border-[var(--c-warn)]/40 text-[var(--c-warn)]')
              }
            >
              ∫|ψ|²dx = {stats.norm.toFixed(4)}
            </div>
          </ControlGroup>

          <ControlGroup title="测量位置">
            <Slider
              label="仪器分辨率 δ"
              value={resolution}
              min={0.35}
              max={4}
              step={0.05}
              onChange={setResolution}
            />
            <Button variant="primary" onClick={measure}>
              测量一次位置
            </Button>
            <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">
              测量后波包被压到宽度 δ，然后立刻开始迅速展开——δ 越小，展开越快。
              这不是仪器的毛病，是 Δx·Δp ≥ ħ/2。
            </p>
          </ControlGroup>

          <ControlGroup title="演化与显示">
            <TimeBar
              playing={playing}
              onPlay={setPlaying}
              onReset={prepare}
              speed={speed}
              onSpeed={setSpeed}
              timeLabel={`t = ${stats.t.toFixed(1)}`}
            />
            <Toggle label="实部影子 Re ψ" checked={showRe} onChange={setShowRe} />
            <Toggle label="虚部影子 Im ψ" checked={showIm} onChange={setShowIm} />
            <Toggle label="概率密度 |ψ|²" checked={showProb} onChange={setShowProb} />
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="overflow-x-auto text-[15px]">
            <Tex>{'\\psi(x) = |\\psi(x)|\\,\\ee^{\\ii\\theta(x)},\\qquad P(x)\\,\\dd x = |\\psi(x)|^2\\,\\dd x'}</Tex>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>⟨x⟩ = {stats.mean.toFixed(3)}</span>
            <span>Δx = {stats.sigma.toFixed(3)}</span>
            <span>Δp ≈ {stats.sigmaP.toFixed(3)}</span>
            <span>ΔxΔp ≈ {(stats.sigma * stats.sigmaP).toFixed(3)}（下限 0.5）</span>
            {lastMeasure !== null ? <span>上次测得 x = {lastMeasure.toFixed(2)}</span> : null}
          </div>
          <Legend
            items={[
              { color: p.real, label: 'ψ（复数管）与实部影子' },
              { color: p.imag, label: '虚部影子' },
              { color: p.prob, label: '|ψ|²' },
            ]}
          />
        </div>
      }
      guide={[
        '先切到「沿 x 看」视角：你正对复平面，每个 x 上的 ψ 就是一个复数（一个箭头）。管子的扭转就是相位沿 x 的变化。',
        '再切到「看实部」：得到的正是教科书上那条上下振荡的曲线。它只是三维曲线的一个影子——虚部的信息在这个视角下完全丢失了。',
        '把 k₀ 拖到 0：管子不再扭转（相位处处相同），实部还在、虚部变成零。此时波包不再整体移动，只是原地展开。',
        '拖动「整体幅度」：形状不变，∫|ψ|² 偏离 1 并变红。点「归一化」，高度被拉回来——这就是归一化的全部内容。',
        '按几次「测量一次位置」：落点每次不同，但集中在 |ψ|² 大的地方；测完波包被压窄，然后迅速展开。把分辨率 δ 调到最小再测，展开会快得多。',
      ]}
      pitfalls={[
        {
          title: '“实部是波函数，虚部是数学技巧”',
          body: '两者地位完全对等。只看实部会丢掉相位信息，而相位决定概率流与一切干涉。场景里把视角切到「看实部」时，虚部影子的存在就是提醒。',
        },
        {
          title: '“|ψ(x)|² 是粒子在 x 处的概率”',
          body: '是概率**密度**。单点概率为零，只有在区间上积分才是概率。量纲上 |ψ|² 是 1/长度。',
        },
        {
          title: '“测量把波函数变成一个点”',
          body: '真实测量的分辨率有限，波包被压到分辨率宽度而不是 δ 函数。压得越窄，动量越不确定，展开越快。',
        },
      ]}
      reflect={[
        '把 k₀ 设为正、σ 设得很小，观察 Δp 的读数。为什么波包越窄、动量越不确定？（提示：窄高斯的傅里叶变换是宽高斯。）',
        '打开「加一个反向波包」：两团概率相遇时中间出现条纹。这些条纹会不会出现在「两个经典粒子概率分布之和」里？',
        '自由粒子的 |ψ|² 一直在展开，永不收缩。这与「时间反演对称」矛盾吗？（提示：把时间倒过来放，看到的是什么？）',
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={3}
        maxDistance={30}
        overlay={
          <CanvasStat>
            t = {stats.t.toFixed(1)}　Δx = {stats.sigma.toFixed(2)}　∫|ψ|² = {stats.norm.toFixed(3)}
          </CanvasStat>
        }
      >
        <GridPlane size={8} divisions={16} y={WALL_Y - 0.02} opacity={0.22} />

        {/* x 轴 */}
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
        <SceneLabel position={[-X_SPAN / 2 - 0.6, 0, WALL_Z]} tone="custom" size="xs">
          <span style={{ color: p.real }}>Re ψ</span>
        </SceneLabel>
        <SceneLabel position={[-X_SPAN / 2 - 0.6, WALL_Y, 0]} tone="custom" size="xs">
          <span style={{ color: p.imag }}>Im ψ</span>
        </SceneLabel>
        <SceneLabel position={[-X_SPAN / 2 - 0.6, 0, PROB_Z]} tone="custom" size="xs">
          <span style={{ color: p.prob }}>|ψ|²</span>
        </SceneLabel>

        <Field
          op={op}
          playing={playing}
          speed={speed}
          showRe={showRe}
          showIm={showIm}
          showProb={showProb}
          onStats={setStats}
          resetToken={resetToken}
        />
      </SceneCanvas>
    </SceneShell>
  )
}

function Field({
  op,
  playing,
  speed,
  showRe,
  showIm,
  showProb,
  onStats,
  resetToken,
}: {
  op: SplitOperator
  playing: boolean
  speed: number
  showRe: boolean
  showIm: boolean
  showProb: boolean
  onStats: (s: Stats) => void
  resetToken: React.MutableRefObject<number>
}) {
  const p = useScenePalette()
  const tube = useMemo(() => createTube(SEG, 7), [])
  const prob = useMemo(() => createCurtain(SEG), [])
  const reLine = useMemo(() => createPolyline(SEG), [])
  const imLine = useMemo(() => createPolyline(SEG), [])
  const bufA = useMemo(() => new Float32Array(SEG * 3), [])
  const bufB = useMemo(() => new Float32Array(SEG * 3), [])
  const bufC = useMemo(() => new Float32Array(SEG * 3), [])
  const bufD = useMemo(() => new Float32Array(SEG * 3), [])
  const probArr = useMemo(() => new Float64Array(N), [])
  const time = useRef(0)
  const report = useRef(0)
  const scale = useRef({ amp: 1, prob: 1, token: -1 })

  useEffect(
    () => () => {
      tube.geometry.dispose()
      prob.geometry.dispose()
      reLine.geometry.dispose()
      imLine.geometry.dispose()
    },
    [tube, prob, reLine, imLine],
  )

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    if (playing) {
      const steps = Math.max(1, Math.min(400, Math.round((TIME_RATE * speed * dt) / DT)))
      op.steps(steps)
      time.current += steps * DT
    }

    // 重新制备后重设纵向尺度：不同 σ 的波包峰高差很多，固定尺度会一会儿撑破一会儿看不见
    if (scale.current.token !== resetToken.current) {
      scale.current.token = resetToken.current
      time.current = 0
      let m = 1e-9
      for (let i = 0; i < N; i++) {
        const a = Math.hypot(op.re[i]!, op.im[i]!)
        if (a > m) m = a
      }
      scale.current.amp = 1.5 / m
      scale.current.prob = 1.8 / (m * m)
    }

    const X = (x: number) => (x / (X_MAX - X_MIN)) * X_SPAN
    const stride = (N - 1) / (SEG - 1)
    const a = scale.current.amp
    const q = scale.current.prob

    for (let i = 0; i < SEG; i++) {
      const j = Math.round(i * stride)
      const wx = X(op.x[j]!)
      const re = op.re[j]!
      const im = op.im[j]!
      bufA[i * 3] = wx
      bufA[i * 3 + 1] = re * a
      bufA[i * 3 + 2] = im * a
      // 实部影子：投到 z = WALL_Z 的墙上
      bufB[i * 3] = wx
      bufB[i * 3 + 1] = re * a
      bufB[i * 3 + 2] = WALL_Z
      // 虚部影子：投到 y = WALL_Y 的地板上
      bufC[i * 3] = wx
      bufC[i * 3 + 1] = WALL_Y
      bufC[i * 3 + 2] = im * a
      // 概率密度
      bufD[i * 3] = wx
      bufD[i * 3 + 1] = (re * re + im * im) * q
      bufD[i * 3 + 2] = PROB_Z
    }
    tube.update(bufA, 0.05)
    reLine.update(bufB)
    imLine.update(bufC)
    prob.update(bufD, 0)

    report.current += dt
    if (report.current > 0.12) {
      report.current = 0
      probabilityDensity(op.re, op.im, probArr)
      const norm = op.norm()
      const mean = expectationX(probArr, op.x, op.dx) / (norm || 1)
      const sigma = spreadX(probArr, op.x, op.dx)
      const { sigma: sigmaP } = momentumStats(op.re, op.im, op.dx)
      onStats({ norm, mean, sigma, sigmaP, t: time.current })
    }
  })

  return (
    <group>
      <mesh geometry={tube.geometry}>
        <meshStandardMaterial color={p.real} roughness={0.32} metalness={0.1} />
      </mesh>
      {showProb ? (
        <mesh geometry={prob.geometry}>
          <meshStandardMaterial
            color={p.prob}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
      ) : null}
      {showRe ? (
        <line geometry={reLine.geometry}>
          <lineBasicMaterial color={p.real} transparent opacity={0.85} />
        </line>
      ) : null}
      {showIm ? (
        <line geometry={imLine.geometry}>
          <lineBasicMaterial color={p.imag} transparent opacity={0.85} />
        </line>
      ) : null}
    </group>
  )
}
