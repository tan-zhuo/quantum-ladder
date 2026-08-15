import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { ControlGroup, Legend, CanvasStat, TimeBar, ProbabilityBar, MiniPlot } from '../core/widgets'
import { Slider, Toggle } from '@/components/sim/controls'
import { createTube, createCurtain, GridPlane } from '../core/primitives'
import Tex from '@/components/math/Tex'
import { SplitOperator, rectBarrierOnGrid, barrierTransmission } from '@/lib/numerics'

/**
 * 模块 04 主场景：波包撞势垒。
 *
 * 这是全站唯一一个「真的在解含时薛定谔方程」的场景（split-operator，严格幺正）。
 * 三维在这里干两件二维图干不了的事：
 *
 *   - ψ 的**相位**看得见。波包穿过势垒后，透射部分的波长变了、相位跳了一下，
 *     这些都写在管子的扭转里；二维只画 |ψ|² 的话，这些信息全被扔掉了。
 *   - 经典小球与量子波包放在同一个空间里对照。小球撞墙弹回，波包却有一部分
 *     出现在墙的另一侧——两者并排出现的那一刻，经典直觉才真的被打破。
 */

const N = 1024
const X_MIN = -70
const X_MAX = 70
const DT = 0.004
const SEGMENTS = 340
/** 物理 x ∈ [−70, 70] 映射到世界 ±7.5 */
const X_SPAN = 15
const PROB_Z = -1.6
/** 每秒推进多少个物理时间单位。波包从 x=−34 跑到势垒约需 4 秒。 */
const TIME_RATE = 4.5

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [8, 5, 12], title: '同时看到相位与概率密度' },
  { id: 'front', label: '正视', position: [0, 1.6, 15], title: '教科书视角' },
  { id: 'phase', label: '沿 x 看', position: [15, 0.9, 0.01], title: '正对复平面：看 ψ 的相位怎么转' },
  { id: 'barrier', label: '看势垒', position: [2.6, 1.8, 3.8], target: [0, 0, 0], title: '拉近看势垒内部的指数衰减' },
]

interface Sim {
  op: SplitOperator
  barrier: { iStart: number; iEnd: number; width: number }
  xBarrierLeft: number
  xBarrierRight: number
}

export default function TunnelingScene() {
  const p = useScenePalette()
  const apiRef = useRef<SceneApi | null>(null)

  const [v0, setV0] = useState(2.4)
  const [barrierWidth, setBarrierWidth] = useState(1.6)
  const [energy, setEnergy] = useState(1.6)
  const [sigma, setSigma] = useState(4.5)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [showClassical, setShowClassical] = useState(true)
  const [showPsi, setShowPsi] = useState(true)
  const [gain, setGain] = useState(1)
  const [stats, setStats] = useState({ t: 0, R: 0, T: 0, norm: 1, done: false })

  const k0 = Math.sqrt(2 * energy)

  /**
   * 势垒与传播子。改高度或宽度只需要重建传播子，波包本身保留——
   * 这样拖滑块时不会每次都把动画打回起点，可以在演化中途「加高墙」看会怎样。
   */
  const sim = useMemo<Sim>(() => {
    const op = new SplitOperator({
      n: N,
      xMin: X_MIN,
      xMax: X_MAX,
      dt: DT,
      potential: new Float64Array(N),
      absorbFraction: 0.1,
    })
    const b = rectBarrierOnGrid(op.x, { center: 0, width: barrierWidth, height: v0 })
    op.setPotential(b.V)
    return {
      op,
      barrier: b,
      xBarrierLeft: op.x[b.iStart]!,
      xBarrierRight: op.x[b.iEnd - 1]!,
    }
    // 只在首次创建；后续改参数走下面的 effect，避免丢掉演化状态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetToken = useRef(0)
  const timeRef = useRef(0)

  const reset = useCallback(() => {
    // 起点放在势垒左侧足够远处，且离吸收层还有距离
    sim.op.setGaussian(-34, k0, sigma)
    timeRef.current = 0
    resetToken.current += 1
    setStats({ t: 0, R: 0, T: 0, norm: 1, done: false })
  }, [sim, k0, sigma])

  // 势垒参数变化：只换势能，不动波包
  useEffect(() => {
    const b = rectBarrierOnGrid(sim.op.x, { center: 0, width: barrierWidth, height: v0 })
    sim.op.setPotential(b.V)
    sim.barrier = b
    sim.xBarrierLeft = sim.op.x[b.iStart]!
    sim.xBarrierRight = sim.op.x[b.iEnd - 1]!
  }, [sim, barrierWidth, v0])

  // 能量或宽度变化：波包本身变了，重新制备
  useEffect(() => {
    reset()
  }, [reset])

  const X = useCallback((x: number) => (x / (X_MAX - X_MIN)) * X_SPAN, [])

  // 势能曲线（含势垒）
  const potentialPts = useMemo(() => {
    const yTop = v0 * 0.55
    return [
      [X(X_MIN), 0, 0],
      [X(sim.xBarrierLeft), 0, 0],
      [X(sim.xBarrierLeft), yTop, 0],
      [X(sim.xBarrierRight), yTop, 0],
      [X(sim.xBarrierRight), 0, 0],
      [X(X_MAX), 0, 0],
    ] as [number, number, number][]
  }, [v0, sim.xBarrierLeft, sim.xBarrierRight, X])

  const analyticT = barrierTransmission(energy, v0, barrierWidth)

  // 透射率随能量的曲线：把当前工作点标在上面
  const tCurve = useMemo(() => {
    const pts: [number, number][] = []
    const eMax = Math.max(4, v0 * 2)
    for (let i = 0; i <= 120; i++) {
      const e = (eMax * i) / 120
      pts.push([e / eMax, barrierTransmission(e, v0, barrierWidth)])
    }
    return { pts, eMax }
  }, [v0, barrierWidth])

  return (
    <SceneShell
      id="tunneling"
      title="隧道效应：波包撞上一堵它「翻不过」的墙"
      subtitle="经典小球在 E < V₀ 时必然弹回。看着波包撞上势垒——一部分反射，一部分渗进墙里指数衰减，还有一部分真的出现在了另一侧。"
      apiRef={apiRef}
      height={560}
      controls={
        <>
          <ControlGroup title="势垒">
            <Slider label="高度 V₀" value={v0} min={0.2} max={6} step={0.05} onChange={setV0} />
            <Slider label="宽度 a" value={barrierWidth} min={0.2} max={6} step={0.05} onChange={setBarrierWidth} />
          </ControlGroup>

          <ControlGroup
            title="入射波包"
            hint={energy < v0 ? `E < V₀：经典上完全禁止穿透` : `E > V₀：经典上必定穿过，但量子仍有反射`}
          >
            <Slider label="平均能量 E" value={energy} min={0.2} max={6} step={0.05} onChange={setEnergy} />
            <Slider
              label="波包宽度 σ"
              value={sigma}
              min={2}
              max={9}
              step={0.1}
              onChange={setSigma}
              hint="σ 越大动量越确定，透射率越接近平面波的解析值"
            />
          </ControlGroup>

          <ControlGroup title="演化">
            <TimeBar
              playing={playing}
              onPlay={setPlaying}
              onReset={reset}
              speed={speed}
              onSpeed={setSpeed}
              timeLabel={`t = ${stats.t.toFixed(1)}`}
            />
            <Toggle label="经典粒子对照" checked={showClassical} onChange={setShowClassical} />
            <Toggle label="显示 ψ（复数管）" checked={showPsi} onChange={setShowPsi} />
            <Slider
              label="纵向放大"
              value={gain}
              min={1}
              max={25}
              step={0.5}
              onChange={setGain}
              display={`×${gain.toFixed(1)}`}
              hint="纵向尺度固定在初始波包上，所以透射出来的那一小团是真的小。放大只是为了看清它的形状。"
            />
          </ControlGroup>

          <ControlGroup title="透射率 T(E)">
            <MiniPlot
              series={[{ points: tCurve.pts, color: p.energy, fill: true }]}
              markers={[
                [Math.min(1, energy / tCurve.eMax), p.real],
                [Math.min(1, v0 / tCurve.eMax), p.potential],
              ]}
              xTicks={[
                [0, 0, '0'],
                [1, 0, `E = ${tCurve.eMax.toFixed(1)}`],
              ]}
              height={80}
              ariaLabel="透射率随能量变化"
            />
            <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">
              蓝线是当前能量，灰线是势垒高度。注意 E &gt; V₀ 之后 T 并不等于 1，而是振荡着逼近 1——
              那是势垒两端反射波的干涉（共振透射）。
            </p>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[12.5px] text-[var(--text-muted)]">
                <span>数值：反射 R / 透射 T</span>
                <span className="font-mono tabular-nums text-[var(--text)]">
                  {stats.R.toFixed(3)} / {stats.T.toFixed(3)}
                </span>
              </div>
              <ProbabilityBar
                segments={[
                  { value: stats.R, color: p.imag, label: '反射' },
                  { value: Math.max(0, 1 - stats.R - stats.T), color: p.faint, label: '仍在势垒附近' },
                  { value: stats.T, color: p.energy, label: '透射' },
                ]}
              />
            </div>
            <div className="flex flex-col justify-center gap-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
              <span>解析（平面波）T = {analyticT.toExponential(2)}</span>
              <span>κ = √(2(V₀−E)) = {energy < v0 ? Math.sqrt(2 * (v0 - energy)).toFixed(3) : '—'}</span>
              <span>剩余归一化 {stats.norm.toFixed(4)}</span>
            </div>
          </div>
          <div className="overflow-x-auto text-[14px]">
            <Tex>{'T \\approx \\ee^{-2\\kappa a},\\qquad \\kappa = \\frac{\\sqrt{2m(V_0-E)}}{\\hbar}'}</Tex>
          </div>
          <Legend
            items={[
              { color: p.real, label: 'ψ（复数管，扭转即相位）' },
              { color: p.prob, label: '|ψ|²' },
              { color: p.potential, label: '势垒 V(x)' },
              ...(showClassical ? [{ color: p.classical, label: '经典粒子' }] : []),
            ]}
          />
        </div>
      }
      guide={[
        '默认参数下 E < V₀。按播放，盯住势垒右侧：会有一小团概率密度从墙里钻出来继续向右跑。它的面积就是透射率 T。',
        '暂停在波包刚好压在势垒上的时刻，切到「看势垒」视角：墙内部的 |ψ|² 不是零，而是指数衰减 e^{−2κx}。墙越宽，钻出来的越少——这就是 T ≈ e^{−2κa} 的来历。',
        '把势垒宽度 a 从 1.6 调到 3.2（只翻一倍），看 T 掉了多少个数量级。指数依赖意味着扫描隧道显微镜能分辨单个原子台阶。',
        '把 E 调到略大于 V₀：经典上应当 100% 通过，但你会看到仍有一部分被反射回去。「量子反射」是波动性的另一面。',
        '打开经典粒子对照：小球撞墙原路弹回，永远不会出现在右侧。两者并排跑一次，差别一目了然。',
      ]}
      pitfalls={[
        {
          title: '“粒子从墙里借了能量翻过去”',
          body: '不需要借。定态里能量是确定的，波函数本来就在经典禁区有非零值——它是指数衰减的实指数解，不是「翻越」。把「借能量」当成正式解释会在计算里立刻出错。',
        },
        {
          title: '“势垒里的粒子速度是虚数”',
          body: '势垒内部没有定义良好的经典速度。那里的波数 k = i κ 是纯虚的，对应的是衰减而不是传播，谈「速度」已经越界了。',
        },
        {
          title: '“透射率随宽度线性下降”',
          body: '是指数下降。宽度翻倍，T 平方级地掉。这个差别是隧道效应一切应用（STM、α 衰变、核聚变）的关键。',
        },
      ]}
      reflect={[
        '把 σ 调大（动量更确定），数值 T 会更接近平面波解析值；σ 小的时候两者偏离。为什么？（提示：波包是很多不同 k 的叠加，每个 k 有自己的 T。）',
        'α 衰变的半衰期能从 10⁻⁷ 秒跨到 10¹⁷ 年，跨了 30 多个数量级，而对应的能量只差几个 MeV。用 T ≈ e^{−2κa} 解释这个夸张的敏感性。',
        '如果势垒高度是无穷大，T 严格为零吗？把 V₀ 拉到最大试试，再想想「无限深方阱」的边界条件是怎么来的。',
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={2}
        maxDistance={30}
        overlay={
          <CanvasStat>
            t = {stats.t.toFixed(1)}　R = {stats.R.toFixed(3)}　T = {stats.T.toFixed(3)}
            {energy < v0 ? <span className="ml-2 opacity-70">E &lt; V₀（经典禁止）</span> : null}
          </CanvasStat>
        }
      >
        <GridPlane size={7} divisions={14} y={-0.02} opacity={0.25} />

        <Line points={potentialPts} color={p.potential} lineWidth={2.4} />
        {/* 势垒实体：半透明盒子，让「墙」有体积 */}
        <mesh
          position={[
            (X(sim.xBarrierLeft) + X(sim.xBarrierRight)) / 2,
            (v0 * 0.55) / 2,
            0,
          ]}
        >
          <boxGeometry args={[Math.max(0.02, X(sim.xBarrierRight) - X(sim.xBarrierLeft)), v0 * 0.55, 1.9]} />
          <meshStandardMaterial color={p.potential} transparent opacity={0.18} roughness={0.8} />
        </mesh>
        <SceneLabel position={[0, v0 * 0.55 + 0.22, 0]} tone="muted" size="xs">
          V₀ = {v0.toFixed(2)}
        </SceneLabel>

        {/* 入射能量参考线 */}
        <Line
          points={[
            [X(X_MIN), energy * 0.55, 0],
            [X(X_MAX), energy * 0.55, 0],
          ]}
          color={p.energy}
          lineWidth={1.4}
          dashed
          dashSize={0.16}
          gapSize={0.12}
          transparent
          opacity={0.8}
        />
        <SceneLabel position={[X(X_MAX) + 0.4, energy * 0.55, 0]} tone="custom" size="xs">
          <span style={{ color: p.energy }}>E</span>
        </SceneLabel>

        <WavePacket
          sim={sim}
          playing={playing}
          speed={speed}
          X={X}
          showPsi={showPsi}
          onStats={setStats}
          gain={gain}
          resetToken={resetToken}
        />

        {showClassical ? (
          <ClassicalParticle
            energy={energy}
            v0={v0}
            xLeft={sim.xBarrierLeft}
            xRight={sim.xBarrierRight}
            playing={playing}
            speed={speed}
            X={X}
            resetToken={resetToken}
          />
        ) : null}
      </SceneCanvas>
    </SceneShell>
  )
}

/** 波包本体：每帧推进若干步，把 ψ 画成管、|ψ|² 画成幕布 */
function WavePacket({
  sim,
  playing,
  speed,
  X,
  showPsi,
  onStats,
  gain,
  resetToken,
}: {
  sim: Sim
  playing: boolean
  speed: number
  X: (x: number) => number
  showPsi: boolean
  onStats: (s: { t: number; R: number; T: number; norm: number; done: boolean }) => void
  gain: number
  resetToken: React.MutableRefObject<number>
}) {
  const p = useScenePalette()
  const tube = useMemo(() => createTube(SEGMENTS, 7), [])
  const curtain = useMemo(() => createCurtain(SEGMENTS), [])
  const buf = useMemo(() => new Float32Array(SEGMENTS * 3), [])
  const probBuf = useMemo(() => new Float32Array(SEGMENTS * 3), [])
  const time = useRef(0)
  const report = useRef(0)
  // 纵向尺度固定在**初始**波包上。逐帧自适应看起来更「饱满」，
  // 但那会把 T = 0.06 的一小团放大成和入射波包一样高，等于在骗人。
  const base = useRef({ amp: 1, prob: 1, token: -1 })

  useEffect(() => () => {
    tube.geometry.dispose()
    curtain.geometry.dispose()
  }, [tube, curtain])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const { op } = sim

    // 用真实帧间隔换算步数：低端机掉到 30 fps 时每帧多走几步，
    // 动画的「物理速度」保持一致，只是画面更新得稀疏一些。
    if (playing) {
      const steps = Math.max(1, Math.min(600, Math.round((TIME_RATE * speed * dt) / DT)))
      op.steps(steps)
      time.current += steps * DT
    }

    const stride = (N - 1) / (SEGMENTS - 1)

    if (base.current.token !== resetToken.current) {
      base.current.token = resetToken.current
      let m = 1e-9
      for (let j = 0; j < N; j++) {
        const pr = op.re[j]! * op.re[j]! + op.im[j]! * op.im[j]!
        if (pr > m) m = pr
      }
      base.current.amp = 1.35 / Math.sqrt(m)
      base.current.prob = 1.5 / m
    }
    const ampScale = base.current.amp * Math.sqrt(gain)
    const probScale = base.current.prob * gain

    for (let i = 0; i < SEGMENTS; i++) {
      const j = Math.round(i * stride)
      const wx = X(op.x[j]!)
      buf[i * 3] = wx
      buf[i * 3 + 1] = op.re[j]! * ampScale
      buf[i * 3 + 2] = op.im[j]! * ampScale
      const pr = op.re[j]! * op.re[j]! + op.im[j]! * op.im[j]!
      probBuf[i * 3] = wx
      probBuf[i * 3 + 1] = pr * probScale
      probBuf[i * 3 + 2] = PROB_Z
    }
    tube.update(buf, 0.045)
    curtain.update(probBuf, 0)

    report.current += dt
    if (report.current > 0.1) {
      report.current = 0
      const R = op.probabilityLeftOf(sim.xBarrierLeft)
      const total = op.norm()
      const T = Math.max(0, total - op.probabilityLeftOf(sim.xBarrierRight))
      onStats({ t: time.current, R, T, norm: total, done: false })
    }
  })

  return (
    <group>
      {showPsi ? (
        <mesh geometry={tube.geometry}>
          <meshStandardMaterial color={p.real} roughness={0.32} metalness={0.1} />
        </mesh>
      ) : null}
      <mesh geometry={curtain.geometry}>
        <meshStandardMaterial
          color={p.prob}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          roughness={0.6}
        />
      </mesh>
    </group>
  )
}

/**
 * 经典粒子：同样的能量、同样的出发点，按牛顿力学跑。
 * E < V₀ 时在墙前原速弹回，E > V₀ 时减速穿过再加速——两条腿并排跑，差别不用解释。
 */
function ClassicalParticle({
  energy,
  v0,
  xLeft,
  xRight,
  playing,
  speed,
  X,
  resetToken,
}: {
  energy: number
  v0: number
  xLeft: number
  xRight: number
  playing: boolean
  speed: number
  X: (x: number) => number
  resetToken: React.MutableRefObject<number>
}) {
  const p = useScenePalette()
  const ref = useRef<THREE.Mesh>(null)
  const state = useRef({ x: -34, v: Math.sqrt(2 * energy), token: -1 })

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05) * speed * 0.55
    const s = state.current
    if (s.token !== resetToken.current) {
      s.token = resetToken.current
      s.x = -34
      s.v = Math.sqrt(2 * energy)
    }
    if (playing) {
      const inside = s.x > xLeft && s.x < xRight
      const local = inside ? Math.max(0, energy - v0) : energy
      const sp = Math.sqrt(2 * local)
      // E < V₀ 且已到墙前：弹回
      if (!inside && s.v > 0 && s.x + s.v * dt >= xLeft && energy < v0) {
        s.v = -Math.sqrt(2 * energy)
      } else {
        s.v = Math.sign(s.v) * (sp || 0.001)
      }
      s.x += s.v * dt
      if (s.x < -60 || s.x > 60) s.x = Math.max(-60, Math.min(60, s.x))
    }
    if (ref.current) ref.current.position.set(X(s.x), 0.14, 1.15)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.13, 20, 16]} />
      <meshStandardMaterial color={p.classical} roughness={0.35} metalness={0.1} />
    </mesh>
  )
}
