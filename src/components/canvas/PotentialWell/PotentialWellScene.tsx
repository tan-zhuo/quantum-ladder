import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { useQualityProfile } from '../core/sceneStore'
import { ControlGroup, Legend, CanvasStat, TimeBar, EnergyLadder } from '../core/widgets'
import { Slider, Segmented, Toggle } from '@/components/sim/controls'
import { createTube, createCurtain, GridPlane } from '../core/primitives'
import Tex from '@/components/math/Tex'
import { solveWell, type WellKind, type WellSolution } from '@/lib/quantum3d'

/**
 * 模块 03 主场景：一维束缚态。
 *
 * 三维在这里不是装饰，它同时解决两个二维图讲不清的问题：
 *
 *   1. **相位在哪**。定态的 ψ 是复数，随时间以 e^{−iEt/ħ} 转动。二维图只能画实部，
 *      于是「定态是静止的」这句话看起来像在说谎。把复平面立起来当作第三个维度之后，
 *      你会看见管子在转、而它的影子（|ψ|²）纹丝不动——这才是「定态」的准确图像。
 *   2. **能级与波函数的对应**。把每个本征态摆在自己的能量高度上、沿深度方向排开，
 *      能级图与波函数图第一次成为同一张图。
 */

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [5.2, 3.4, 7.2], title: '同时看到相位转动与概率密度' },
  { id: 'front', label: '正视', position: [0, 1.2, 10.5], title: '标准教科书视角：横轴 x，纵轴能量' },
  { id: 'phase', label: '沿 x 看', position: [10.5, 1.0, 0.01], title: '正对复平面：看 ψ 在复平面上转圈' },
  { id: 'top', label: '俯视', position: [0, 9.5, 0.01], title: '俯视：看概率密度的分布宽度' },
]

/** 世界坐标里的画布尺寸 */
const X_SPAN = 8
const Y_SPAN = 4.6
const PSI_Z = 0 // 复平面（波函数）所在的深度
const PROB_Z = -1.5 // 概率密度幕布所在的深度
const SEGMENTS = 280

interface Frame {
  /** 把物理 x 映射到世界 x */
  X: (x: number) => number
  /** 把能量映射到世界 y */
  Y: (e: number) => number
  /** 波函数振幅的世界尺度 */
  amp: number
  /** 概率密度的世界尺度 */
  probAmp: number
  eMin: number
  eMax: number
}

function buildFrame(sol: WellSolution, count: number): Frame {
  const { xMin, xMax, vRange, states } = sol
  const eTop = Math.max(
    vRange[1],
    ...states.slice(0, count).map((s) => s.energy),
  )
  const eMin = Math.min(vRange[0], 0)
  const eMax = eTop + (eTop - eMin) * 0.12
  const span = eMax - eMin || 1
  let psiMax = 1e-9
  for (const s of states.slice(0, count)) {
    for (let i = 0; i < s.psi.length; i++) psiMax = Math.max(psiMax, Math.abs(s.psi[i]!))
  }
  return {
    X: (x) => ((x - (xMin + xMax) / 2) / (xMax - xMin)) * X_SPAN,
    Y: (e) => ((e - eMin) / span) * Y_SPAN - Y_SPAN / 2,
    amp: 0.62 / psiMax,
    probAmp: 1.15 / (psiMax * psiMax),
    eMin,
    eMax,
  }
}

/** 在网格上重采样成固定段数，供管/幕布使用 */
function resample(src: Float64Array, out: Float64Array) {
  const n = out.length
  const m = src.length
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (m - 1)
    const i0 = Math.floor(t)
    const i1 = Math.min(m - 1, i0 + 1)
    out[i] = src[i0]! + (src[i1]! - src[i0]!) * (t - i0)
  }
}

/**
 * 选中态：一根随时间在复平面里转动的管子，加上永远静止的 |ψ|² 幕布。
 */
function ActiveState({
  frame,
  psi,
  energy,
  xs,
  playing,
  speed,
  showPsi,
  showProb,
  onPhase,
  resetToken,
}: {
  frame: Frame
  psi: Float64Array
  energy: number
  xs: Float64Array
  playing: boolean
  speed: number
  showPsi: boolean
  showProb: boolean
  onPhase: (t: number) => void
  /** 变化即把 t 归零 */
  resetToken: number
}) {
  const p = useScenePalette()
  const tube = useMemo(() => createTube(SEGMENTS, 7), [])
  const curtain = useMemo(() => createCurtain(SEGMENTS), [])
  const buf = useMemo(() => new Float32Array(SEGMENTS * 3), [])
  const psiR = useMemo(() => new Float64Array(SEGMENTS), [])
  const xr = useMemo(() => new Float64Array(SEGMENTS), [])
  const tRef = useRef(0)
  const reportRef = useRef(0)

  useEffect(() => {
    tRef.current = 0
  }, [resetToken])

  useEffect(() => () => {
    tube.geometry.dispose()
    curtain.geometry.dispose()
  }, [tube, curtain])

  // 重采样 + 画一次静止的概率密度幕布
  useEffect(() => {
    resample(psi, psiR)
    resample(xs, xr)
    const y0 = frame.Y(energy)
    for (let i = 0; i < SEGMENTS; i++) {
      buf[i * 3] = frame.X(xr[i]!)
      buf[i * 3 + 1] = y0 + psiR[i]! * psiR[i]! * frame.probAmp
      buf[i * 3 + 2] = PROB_Z
    }
    curtain.update(buf, y0)
  }, [psi, xs, energy, frame, buf, psiR, xr, curtain])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    if (playing) tRef.current += dt * speed
    // 相位随时间以 e^{−iEt/ħ} 转动。这里把能量整体平移一下再乘系数，
    // 纯粹是为了让低能级也转得看得见——物理上只有能级**差**才有可观测效应。
    const phase = -(energy - frame.eMin + 0.35) * tRef.current * 1.6
    // 读数区的相位数字每秒更新八次就够了。逐帧 setState 会把整个场景组件
    // （连同控制面板、观察指南）每帧重渲一次，白白吃掉一半的帧预算。
    reportRef.current += dt
    if (reportRef.current > 0.12) {
      reportRef.current = 0
      onPhase(phase)
    }
    const y0 = frame.Y(energy)
    const c = Math.cos(phase)
    const s = Math.sin(phase)
    for (let i = 0; i < SEGMENTS; i++) {
      const a = psiR[i]! * frame.amp
      buf[i * 3] = frame.X(xr[i]!)
      buf[i * 3 + 1] = y0 + a * c
      buf[i * 3 + 2] = PSI_Z + a * s
    }
    tube.update(buf, 0.035)
  })

  return (
    <group>
      {showPsi ? (
        <mesh geometry={tube.geometry}>
          <meshStandardMaterial color={p.real} roughness={0.35} metalness={0.08} />
        </mesh>
      ) : null}
      {showProb ? (
        <mesh geometry={curtain.geometry}>
          <meshStandardMaterial
            color={p.prob}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
      ) : null}
    </group>
  )
}

/** 其余本征态：按能量摞成一叠，只画轮廓，用来看整个能级阶梯 */
function StateDeck({
  frame,
  sol,
  count,
  active,
  onPick,
}: {
  frame: Frame
  sol: WellSolution
  count: number
  active: number
  onPick: (n: number) => void
}) {
  const p = useScenePalette()
  const curves = useMemo(() => {
    const out: { n: number; pts: [number, number, number][]; energy: number }[] = []
    for (let k = 0; k < Math.min(count, sol.states.length); k++) {
      const st = sol.states[k]!
      const y0 = frame.Y(st.energy)
      const pts: [number, number, number][] = []
      const step = Math.max(1, Math.floor(st.psi.length / 160))
      for (let i = 0; i < st.psi.length; i += step) {
        pts.push([frame.X(sol.x[i]!), y0 + st.psi[i]! * frame.amp, PSI_Z])
      }
      out.push({ n: k, pts, energy: st.energy })
    }
    return out
  }, [frame, sol, count])

  return (
    <group>
      {curves.map((c) => (
        <group key={c.n}>
          <Line
            points={c.pts}
            color={c.n === active ? p.real : p.muted}
            lineWidth={c.n === active ? 2.4 : 1.2}
            transparent
            opacity={c.n === active ? 0.95 : 0.42}
            onClick={(e) => {
              e.stopPropagation()
              onPick(c.n)
            }}
          />
        </group>
      ))}
    </group>
  )
}

export default function PotentialWellScene() {
  const p = useScenePalette()
  const profile = useQualityProfile()
  const apiRef = useRef<SceneApi | null>(null)

  const [kind, setKind] = useState<WellKind>('infinite')
  const [width, setWidth] = useState(4)
  const [depth, setDepth] = useState(6)
  const [omega, setOmega] = useState(1)
  const [n, setN] = useState(2)
  const [showPsi, setShowPsi] = useState(true)
  const [showProb, setShowProb] = useState(true)
  const [deck, setDeck] = useState(true)
  const [classical, setClassical] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [phase, setPhase] = useState(0)
  const [resetToken, setResetToken] = useState(0)

  const levelCount = profile.rich ? 8 : 6

  // 解本征值问题：约 30 ms，比一帧长，所以放在 useMemo 里，只有参数真的变了才重算
  const sol = useMemo(
    () => solveWell({ kind, width, depth, omega }, levelCount),
    [kind, width, depth, omega, levelCount],
  )

  useEffect(() => {
    if (n >= sol.states.length) setN(Math.max(0, sol.states.length - 1))
  }, [sol, n])

  const frame = useMemo(() => buildFrame(sol, levelCount), [sol, levelCount])
  const state = sol.states[Math.min(n, sol.states.length - 1)]!

  // 势能曲线
  const potentialPts = useMemo(() => {
    const pts: [number, number, number][] = []
    const step = Math.max(1, Math.floor(sol.x.length / 200))
    for (let i = 0; i < sol.x.length; i += step) {
      const v = Math.min(sol.V[i]!, frame.eMax)
      pts.push([frame.X(sol.x[i]!), frame.Y(v), PSI_Z])
    }
    return pts
  }, [sol, frame])

  // 无限深阱的两堵墙：势能是无穷大，画成两条到顶的竖线更诚实
  const walls = useMemo(() => {
    if (kind !== 'infinite') return null
    const xl = frame.X(sol.xMin)
    const xr = frame.X(sol.xMax)
    const yb = frame.Y(frame.eMin)
    const yt = frame.Y(frame.eMax)
    return { xl, xr, yb, yt }
  }, [kind, frame, sol])

  // 经典粒子在阱中的概率分布：谐振子 ∝ 1/√(x_t²−x²)，方阱里是均匀分布
  const classicalPts = useMemo(() => {
    if (!classical) return null
    const pts: [number, number, number][] = []
    const y0 = frame.Y(state.energy)
    if (kind === 'harmonic') {
      const xt = Math.sqrt((2 * state.energy) / (omega * omega))
      // 归一化：∫P dx = 1
      for (let i = 1; i < 199; i++) {
        const x = -xt + (2 * xt * i) / 199
        const v = 1 / (Math.PI * Math.sqrt(Math.max(1e-6, xt * xt - x * x)))
        pts.push([frame.X(x), y0 + Math.min(v, 2.2) * frame.probAmp, PROB_Z])
      }
    } else {
      const half = width / 2
      const v = 1 / width
      for (let i = 0; i <= 60; i++) {
        const x = -half + (width * i) / 60
        pts.push([frame.X(x), y0 + v * frame.probAmp, PROB_Z])
      }
    }
    return pts
  }, [classical, kind, state, omega, width, frame])

  const analytic = sol.analytic?.(n)
  const nodes = useMemo(() => {
    let c = 0
    const psi = state.psi
    const scale = Math.max(...Array.from(psi, Math.abs))
    for (let i = 1; i < psi.length; i++) {
      if (psi[i - 1]! * psi[i]! < 0 && Math.abs(psi[i]!) > 1e-3 * scale) c += 1
    }
    return c
  }, [state])

  const stats = useMemo(() => {
    const { x, dx } = sol
    let mean = 0
    let sq = 0
    for (let i = 0; i < x.length; i++) {
      const w = state.psi[i]! * state.psi[i]! * dx
      mean += x[i]! * w
      sq += x[i]! * x[i]! * w
    }
    return { mean, sigma: Math.sqrt(Math.max(0, sq - mean * mean)) }
  }, [sol, state])

  const kindLabel = kind === 'infinite' ? '无限深方阱' : kind === 'finite' ? '有限深方阱' : '谐振子'

  return (
    <SceneShell
      id="potential-well"
      title="一维束缚态：能级、波函数与「定态为什么是静止的」"
      subtitle="蓝色的管子是 ψ 在复平面里的样子，它随时间转动；紫色幕布是 |ψ|²，它一动不动。这就是「定态」的全部含义。"
      apiRef={apiRef}
      height={560}
      controls={
        <>
          <ControlGroup title="势阱">
            <Segmented
              value={kind}
              onChange={(v) => setKind(v as WellKind)}
              options={[
                { value: 'infinite', label: '无限深' },
                { value: 'finite', label: '有限深' },
                { value: 'harmonic', label: '谐振子' },
              ]}
            />
            {kind !== 'harmonic' ? (
              <Slider label="阱宽 L" value={width} min={1} max={8} step={0.1} onChange={setWidth} />
            ) : (
              <Slider label="角频率 ω" value={omega} min={0.4} max={3} step={0.05} onChange={setOmega} />
            )}
            {kind === 'finite' ? (
              <Slider label="阱深 V₀" value={depth} min={0.5} max={20} step={0.1} onChange={setDepth} />
            ) : null}
          </ControlGroup>

          <ControlGroup title="能级" hint="点能级尺或 3D 里的曲线都能切换量子数。">
            <EnergyLadder
              levels={sol.states.map((s) => ({ energy: s.energy, bound: s.bound }))}
              active={n}
              onPick={setN}
              range={[frame.eMin, frame.eMax]}
            />
            <Slider label="量子数 n" value={n} min={0} max={sol.states.length - 1} step={1} onChange={setN} />
          </ControlGroup>

          <ControlGroup title="显示">
            <Toggle label="ψ（复平面里的管）" checked={showPsi} onChange={setShowPsi} />
            <Toggle label="|ψ|²（概率密度幕布）" checked={showProb} onChange={setShowProb} />
            <Toggle label="其余本征态轮廓" checked={deck} onChange={setDeck} />
            <Toggle label="经典概率分布对比" checked={classical} onChange={setClassical} />
          </ControlGroup>

          <ControlGroup title="时间演化">
            <TimeBar
              playing={playing}
              onPlay={setPlaying}
              onReset={() => {
                setPhase(0)
                setResetToken((v) => v + 1)
              }}
              speed={speed}
              onSpeed={setSpeed}
              timeLabel={`相位 ${((((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 57.3).toFixed(0)}°`}
            />
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <span className="text-[15px]">
              <Tex>{`E_{${n}} = ${state.energy.toFixed(4)}`}</Tex>
            </span>
            {analytic !== undefined ? (
              <span className="font-mono text-[12.5px] text-[var(--text-muted)]">
                解析值 {analytic.toFixed(4)}（误差 {(Math.abs(state.energy - analytic) / Math.abs(analytic) * 100).toFixed(2)}%）
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>节点数 {nodes}</span>
            <span>⟨x⟩ = {stats.mean.toFixed(3)}</span>
            <span>Δx = {stats.sigma.toFixed(3)}</span>
            <span>{state.bound ? '束缚态' : '非束缚（受计算窗口限制）'}</span>
            {sol.analyticBoundCount !== undefined ? (
              <span>
                束缚能级 {sol.boundCount}
                {sol.analyticBoundCount !== sol.boundCount ? ` / 解析 ${sol.analyticBoundCount}` : ''}
              </span>
            ) : null}
          </div>
          {sol.analyticBoundCount !== undefined && sol.analyticBoundCount !== sol.boundCount ? (
            <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">
              解析式预言还有一条能级，但它弱束缚到尾巴远超出计算窗口，数值上被硬边界推成了正能量。
              这不是 bug，而是「临界束缚态」的真实特征。
            </p>
          ) : null}
          <Legend
            items={[
              { color: p.real, label: 'ψ（复数，随时间转动）' },
              { color: p.prob, label: '|ψ|²（不随时间变）' },
              { color: p.potential, label: '势能 V(x)' },
              { color: p.energy, label: '能级 Eₙ' },
              ...(classical ? [{ color: p.classical, label: '经典概率分布', dashed: true }] : []),
            ]}
          />
        </div>
      }
      guide={[
        '先按播放，然后切到「沿 x 看」视角：你正对着复平面，会看到 ψ 在原地转圈。转的是相位，不是概率——紫色幕布始终不动。',
        '把量子数 n 从 0 调到 5：数一数波函数穿过零点的次数，应当恰好等于 n。同时注意能级间距怎么变——无限深阱是 n²，谐振子是等间距。',
        '切到有限深阱，把 V₀ 调小：能级一条条被「挤出」阱口，束缚态越来越少。同时注意波函数在阱壁外并不为零——它指数衰减地渗出去，这正是隧道效应的根。',
        '选谐振子、把 n 调到最大，打开「经典概率分布对比」：量子分布的包络开始贴近经典结果，两端最大、中间最小。这就是对应原理。',
        '打开「其余本征态轮廓」并旋转视角：能级图与波函数图其实是同一张图的两个投影方向。',
      ]}
      pitfalls={[
        {
          title: '“波函数是粒子在空间中的形状”',
          body: 'ψ 不是物质分布。它是复振幅；有物理意义的是 |ψ|²（概率密度）以及不同态之间的相对相位。',
        },
        {
          title: '“定态里粒子在阱中来回运动”',
          body: '定态的概率密度完全不随时间变化，也没有概率流。会「流动」的只有叠加态——那是模块 09 的内容。',
        },
        {
          title: '“无限深阱里 ψ 在墙外为零，所以有限深阱也一样”',
          body: '恰恰相反。有限深阱里波函数以 e^{−κ|x|} 渗入经典禁区，这是纯量子效应，也是隧道效应的直接来源。',
        },
      ]}
      reflect={[
        '为什么基态能量不是零？把阱宽调窄时基态能量怎么变？用不确定性原理估一估 E ~ ħ²/(2mL²) 并与读数对照。',
        '无限深阱 E_n ∝ n²，谐振子 E_n ∝ (n + ½) 等间距。从「波必须在阱内装下整数个半波长」和「势能是二次的」两条出发，解释这个差别。',
        '有限深阱无论多浅，都至少有一个束缚态（一维特有）。把 V₀ 调到 0.5 试试。这在三维中不成立——为什么维度会有影响？',
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={3}
        maxDistance={26}
        overlay={
          <CanvasStat>
            {kindLabel}　n = {n}　E = {state.energy.toFixed(3)}
          </CanvasStat>
        }
      >
        <GridPlane size={6} divisions={12} y={frame.Y(frame.eMin) - 0.05} opacity={0.3} />

        {/* 势能曲线 */}
        <Line points={potentialPts} color={p.potential} lineWidth={2.2} />
        {walls ? (
          <>
            <Line
              points={[
                [walls.xl, walls.yb, PSI_Z],
                [walls.xl, walls.yt, PSI_Z],
              ]}
              color={p.potential}
              lineWidth={2.6}
            />
            <Line
              points={[
                [walls.xr, walls.yb, PSI_Z],
                [walls.xr, walls.yt, PSI_Z],
              ]}
              color={p.potential}
              lineWidth={2.6}
            />
          </>
        ) : null}

        {/* 能级：只画到势能曲线之内，避免看起来像自由粒子 */}
        {sol.states.slice(0, 8).map((s, i) => (
          <Line
            key={i}
            points={[
              [-X_SPAN / 2, frame.Y(s.energy), PSI_Z],
              [X_SPAN / 2, frame.Y(s.energy), PSI_Z],
            ]}
            color={p.energy}
            lineWidth={i === n ? 2 : 1}
            transparent
            opacity={i === n ? 0.9 : s.bound ? 0.35 : 0.15}
            dashed={!s.bound}
            dashSize={0.12}
            gapSize={0.1}
          />
        ))}
        <SceneLabel position={[X_SPAN / 2 + 0.35, frame.Y(state.energy), PSI_Z]} tone="custom">
          <span style={{ color: p.energy }}>E{n}</span>
        </SceneLabel>

        {deck ? (
          <StateDeck frame={frame} sol={sol} count={8} active={n} onPick={setN} />
        ) : null}

        {classicalPts ? <Line points={classicalPts} color={p.classical} lineWidth={1.8} dashed dashSize={0.12} gapSize={0.08} /> : null}

        <ActiveState
          frame={frame}
          psi={state.psi}
          energy={state.energy}
          xs={sol.x}
          playing={playing}
          speed={speed}
          showPsi={showPsi}
          showProb={showProb}
          onPhase={setPhase}
          resetToken={resetToken}
        />

        {/* 坐标提示 */}
        <SceneLabel position={[X_SPAN / 2 + 0.5, frame.Y(frame.eMin), PSI_Z]} tone="muted" size="xs">
          x
        </SceneLabel>
        <SceneLabel position={[-X_SPAN / 2 - 0.5, frame.Y(frame.eMax), PSI_Z]} tone="muted" size="xs">
          E
        </SceneLabel>
        <SceneLabel position={[-X_SPAN / 2 - 0.5, frame.Y(state.energy), PROB_Z]} tone="custom" size="xs">
          <span style={{ color: p.prob }}>|ψ|²</span>
        </SceneLabel>
      </SceneCanvas>
    </SceneShell>
  )
}
