import { translator, DEFAULT_LANG, type Lang } from '@/i18n'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { BlochFrame } from '../BlochSphere/BlochFrame'
import { ControlGroup, Legend, CanvasStat, TimeBar } from '../core/widgets'
import { Slider, Button, Toggle } from '@/components/sim/controls'
import { createPolyline } from '../core/primitives'
import Tex from '@/components/math/Tex'

/**
 * 模块 12 主场景：退相干。
 *
 * 两个几何图像同时出现：
 *   - Bloch 矢量从球面往里缩（纯态 → 混合态）；
 *   - 整个单位球被信道压成一个椭球（这才是「信道对所有态做了什么」的完整图像）。
 *
 * 后者是这个场景真正的主角。只画一根缩短的箭头，很容易被误读成「态在衰减」；
 * 画出椭球才看得出：相位阻尼压扁的是赤道方向，而能量弛豫是把整个球拽向北极。
 */

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [2.6, 1.8, 2.6], title: '默认视角' },
  { id: 'front', label: '正面 xz', position: [0, 0.3, 3.6], title: '看相干项被压扁' },
  { id: 'top', label: '俯视 xy', position: [0, 3.6, 0.001], title: '俯视赤道：相干项就是这个圆的半径' },
]

interface LiveState {
  r: [number, number, number]
  t: number
}

export default function DecoherenceScene({ lang = DEFAULT_LANG }: { lang?: Lang }) {
  const T = translator(lang)
  const p = useScenePalette()
  const apiRef = useRef<SceneApi | null>(null)

  const [theta, setTheta] = useState(Math.PI / 2)
  const [phi, setPhi] = useState((2 * Math.PI) / 3)
  const [gammaPhase, setGammaPhase] = useState(0.5)
  const [gammaAmp, setGammaAmp] = useState(0.15)
  const [omega, setOmega] = useState(1.2)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [showEllipsoid, setShowEllipsoid] = useState(true)
  const [showTrail, setShowTrail] = useState(true)
  const [sample, setSample] = useState<{ r: [number, number, number]; t: number }>({
    r: [Math.sin(Math.PI / 2) * Math.cos((2 * Math.PI) / 3), 0, Math.sin(Math.PI / 2) * Math.sin((2 * Math.PI) / 3)],
    t: 0,
  })

  const live = useRef<LiveState>({ r: [-0.5, 0, 0.866], t: 0 })

  const reset = useCallback(() => {
    live.current.r = [
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi),
    ]
    live.current.t = 0
  }, [theta, phi])

  // 参数一改就重新制备
  useEffect(reset, [reset])

  const purity = useMemo(() => {
    const r2 = sample.r[0] ** 2 + sample.r[1] ** 2 + sample.r[2] ** 2
    return (1 + r2) / 2
  }, [sample])

  const coherence = Math.hypot(sample.r[0], sample.r[2]) / 2 // |ρ01|

  // 与下面 Channel 里的 Bloch 方程一致：横向衰减率 = γφ + γ₁/2，纵向 = γ₁
  const gPerp = gammaPhase + gammaAmp / 2
  const t2 = gPerp > 0 ? 1 / gPerp : Infinity
  const t1 = gammaAmp > 0 ? 1 / gammaAmp : Infinity

  return (
    <SceneShell
      lang={lang}
      id="decoherence"
      title={T('退相干：球面上的点如何掉进球里')}
      subtitle={T('纯态在球面上，混合态在球内。打开与环境的耦合，看着箭头一点点缩短——以及整个单位球被压成一个椭球。')}
      apiRef={apiRef}
      height={540}
      controls={
        <>
          <ControlGroup title={T('初态')}>
            <Slider
              label="θ"
              value={theta}
              min={0}
              max={Math.PI}
              step={0.01}
              onChange={setTheta}
              display={`${((theta * 180) / Math.PI).toFixed(0)}°`}
            />
            <Slider
              label="φ"
              value={phi}
              min={0}
              max={2 * Math.PI}
              step={0.01}
              onChange={setPhi}
              display={`${((phi * 180) / Math.PI).toFixed(0)}°`}
            />
            <Button onClick={reset}>{T('重新制备')}</Button>
          </ControlGroup>

          <ControlGroup
            title={T('与环境的耦合')}
            hint={T('相位阻尼只吃掉相干项（赤道方向），能量弛豫还会把布居拽向基态（北极）。')}
          >
            <Slider
              label={T('相位阻尼 γφ')}
              value={gammaPhase}
              min={0}
              max={2}
              step={0.02}
              onChange={setGammaPhase}
            />
            <Slider
              label={T('能量弛豫 γ₁')}
              value={gammaAmp}
              min={0}
              max={2}
              step={0.02}
              onChange={setGammaAmp}
            />
            <Slider label={T('Larmor 频率 ω')} value={omega} min={0} max={4} step={0.05} onChange={setOmega} />
          </ControlGroup>

          <ControlGroup title={T('演化与显示')}>
            <TimeBar
              playing={playing}
              onPlay={setPlaying}
              onReset={reset}
              speed={speed}
              onSpeed={setSpeed}
              timeLabel={`t = ${sample.t.toFixed(2)}`}
            />
            <Toggle label={T('信道椭球（整个球的像）')} checked={showEllipsoid} onChange={setShowEllipsoid} />
            <Toggle label={T('轨迹')} checked={showTrail} onChange={setShowTrail} />
          </ControlGroup>

          <ControlGroup title={T('时间常数')}>
            <div className="space-y-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>{T('T₁（能量弛豫）')}</span>
                <span>{t1 === Infinity ? '∞' : t1.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{T('T₂（退相干）')}</span>
                <span>{t2 === Infinity ? '∞' : t2.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11.5px] text-[var(--text-faint)]">
                <span>T₂ ≤ 2T₁</span>
                <span>{t1 === Infinity ? '—' : (t2 / t1).toFixed(2)} ≤ 2 ✓</span>
              </div>
            </div>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="overflow-x-auto text-[15px]">
            <Tex>{'\\rho = \\tfrac12\\left(\\hat I + \\vec r\\cdot\\vec\\sigma\\right),\\qquad \\mathrm{Tr}(\\rho^2)=\\tfrac{1+|\\vec r|^2}{2}'}</Tex>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>|r⃗| = {Math.hypot(...sample.r).toFixed(4)}</span>
            <span>{T('纯度 Tr(ρ²) = {0}', purity.toFixed(4))}</span>
            <span>{T('相干项 |ρ₀₁| = {0}', coherence.toFixed(4))}</span>
            <span>{T('布居 ρ₁₁ = {0}', ((1 - sample.r[1]) / 2).toFixed(4))}</span>
          </div>
          <Legend
            items={[
              { color: p.accent, label: T('Bloch 矢量 r⃗') },
              { color: p.prob, label: T('信道椭球（单位球的像）') },
              { color: p.classical, label: T('轨迹') },
            ]}
          />
        </div>
      }
      guide={[
        T('先把两个耦合都设为 0：箭头在球面上匀速进动，永远不缩短。这是封闭系统的幺正演化。'),
        T('只开「相位阻尼」：箭头的水平分量迅速缩短，竖直分量一动不动。椭球被压成一根竖直的针——相干性没了，但「上还是下」的概率一点没变。'),
        T('只开「能量弛豫」：椭球整体向北极（基态）收缩并平移。系统在向环境放能。'),
        T('把初态设成 θ = 0（正好在北极）、只开相位阻尼：什么都不会发生。基态本来就没有相干项可丢——「退相干」只对叠加态有意义。'),
        T('把 γφ 拉到最大：相干项在一两个进动周期内就没了。真实的宏观物体上，这个时间是 10⁻³¹ 秒量级。'),
      ]}
      pitfalls={[
        {
          title: T('“退相干 = 波函数坍缩”'),
          body: T('不是。退相干把叠加态变成看起来像经典概率混合的东西（密度矩阵变对角），但它不解释为什么每次只出现一个结果。测量问题被压缩了，没有被消灭。'),
        },
        {
          title: T('“环境把能量抽走了，所以相干消失”'),
          body: T('未必。纯相位阻尼不交换任何能量（布居完全不变），照样彻底摧毁相干。丢失的是相位信息，不是能量。'),
        },
        {
          title: T('“混合态就是我们不知道它是哪个纯态”'),
          body: T('同一个密度矩阵可以由无穷多种不同的纯态系综给出，它们在物理上完全不可区分。「其实是某个纯态，只是我们不知道」这句话没有可操作的含义。'),
        },
      ]}
      reflect={[
        T('把整体（系统 + 环境）算进来时演化是幺正的、纯态始终是纯态。那么系统的熵是从哪冒出来的？'),
        T('T₂ ≤ 2T₁ 这条不等式在几何上意味着什么？（提示：想想椭球在赤道方向与竖直方向的收缩速率。）'),
        T('量子计算需要在 T₂ 之内完成足够多的门操作。若单门耗时 20 ns、T₂ = 100 μs，粗算一下能做多少次操作？够跑一个需要 10⁶ 次门的算法吗？'),
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={1.8}
        maxDistance={8}
        enablePan={false}
        overlay={
          <CanvasStat>
            |r⃗| = {Math.hypot(...sample.r).toFixed(3)}　{T('纯度')} {purity.toFixed(3)}
          </CanvasStat>
        }
      >
        <BlochFrame showLatLong={false} />
        <Channel
          live={live}
          playing={playing}
          speed={speed}
          gammaPhase={gammaPhase}
          gammaAmp={gammaAmp}
          omega={omega}
          showEllipsoid={showEllipsoid}
          showTrail={showTrail}
          onSample={setSample}
        />
        <SceneLabel position={[0, -1.45, 0]} tone="muted" size="xs">
          {T('球面 = 纯态　球内 = 混合态')}
        </SceneLabel>
      </SceneCanvas>
    </SceneShell>
  )
}

/**
 * Lindblad 演化的 Bloch 分量形式（解析，不用数值积分）：
 *
 *   ṙx = −ω ry − (γφ + γ₁/2) rx
 *   ṙy = +ω rx − (γφ + γ₁/2) ry
 *   ṙz = −γ₁ (rz − 1)          ← 弛豫到北极（基态 |0⟩）
 *
 * three 坐标里 z 对应 y 轴朝上，故下面把 rz 写在 r[1] 上。
 */
function Channel({
  live,
  playing,
  speed,
  gammaPhase,
  gammaAmp,
  omega,
  showEllipsoid,
  showTrail,
  onSample,
}: {
  live: React.MutableRefObject<LiveState>
  playing: boolean
  speed: number
  gammaPhase: number
  gammaAmp: number
  omega: number
  showEllipsoid: boolean
  showTrail: boolean
  onSample: (s: { r: [number, number, number]; t: number }) => void
}) {
  const p = useScenePalette()
  const arrowRef = useRef<THREE.Group>(null)
  const tipRef = useRef<THREE.Mesh>(null)
  const ellipsoidRef = useRef<THREE.Mesh>(null)
  const trail = useMemo(() => createPolyline(400), [])
  const trailBuf = useMemo(() => new Float32Array(400 * 3), [])
  const trailLen = useRef(0)
  const report = useRef(0)
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05) * speed
    const st = live.current
    if (playing) {
      const gPerp = gammaPhase + gammaAmp / 2
      const [rx, rz3, ry] = [st.r[0], st.r[1], st.r[2]] // rz3 = 量子 z 分量（three 的 y）
      const drx = -omega * ry - gPerp * rx
      const dry = omega * rx - gPerp * ry
      const drz = -gammaAmp * (rz3 - 1)
      st.r = [rx + drx * dt, rz3 + drz * dt, ry + dry * dt]
      st.t += dt

      if (showTrail) {
        const n = trailLen.current
        if (n < 400) {
          trailBuf[n * 3] = st.r[0]
          trailBuf[n * 3 + 1] = st.r[1]
          trailBuf[n * 3 + 2] = st.r[2]
          trailLen.current = n + 1
        } else {
          trailBuf.copyWithin(0, 3)
          trailBuf[399 * 3] = st.r[0]
          trailBuf[399 * 3 + 1] = st.r[1]
          trailBuf[399 * 3 + 2] = st.r[2]
        }
        // 未填满的部分统一压到最新点上，免得画出一条飞向原点的假线
        for (let i = trailLen.current; i < 400; i++) {
          trailBuf[i * 3] = st.r[0]
          trailBuf[i * 3 + 1] = st.r[1]
          trailBuf[i * 3 + 2] = st.r[2]
        }
        trail.update(trailBuf)
      }
    }

    const len = Math.hypot(st.r[0], st.r[1], st.r[2])
    if (arrowRef.current) {
      v.set(st.r[0], st.r[1], st.r[2])
      if (len > 1e-6) {
        q.setFromUnitVectors(up, v.clone().normalize())
        arrowRef.current.quaternion.copy(q)
        arrowRef.current.scale.setScalar(Math.max(0.02, len))
        arrowRef.current.visible = true
      } else {
        arrowRef.current.visible = false
      }
    }
    if (tipRef.current) tipRef.current.position.set(st.r[0], st.r[1], st.r[2])

    // 信道椭球：单位球在这一时刻的像
    if (ellipsoidRef.current) {
      const gPerp = gammaPhase + gammaAmp / 2
      const sxy = Math.exp(-gPerp * st.t)
      const sz = Math.exp(-gammaAmp * st.t)
      ellipsoidRef.current.scale.set(Math.max(1e-3, sxy), Math.max(1e-3, sz), Math.max(1e-3, sxy))
      // 能量弛豫把球心推向北极
      ellipsoidRef.current.position.set(0, 1 - sz, 0)
    }

    report.current += dt
    if (report.current > 0.08) {
      report.current = 0
      onSample({ r: [...st.r] as [number, number, number], t: st.t })
    }
  })

  return (
    <group>
      {showEllipsoid ? (
        <mesh ref={ellipsoidRef}>
          <sphereGeometry args={[1, 48, 32]} />
          <meshStandardMaterial
            color={p.prob}
            transparent
            opacity={0.16}
            roughness={0.8}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}

      <group ref={arrowRef}>
        <mesh position={[0, 0.44, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.88, 12]} />
          <meshStandardMaterial color={p.accent} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.94, 0]}>
          <coneGeometry args={[0.05, 0.12, 16]} />
          <meshStandardMaterial color={p.accent} roughness={0.35} />
        </mesh>
      </group>

      <mesh ref={tipRef}>
        <sphereGeometry args={[0.05, 16, 12]} />
        <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={0.3} />
      </mesh>

      {showTrail ? (
        <line geometry={trail.geometry}>
          <lineBasicMaterial color={p.classical} transparent opacity={0.75} />
        </line>
      ) : null}
    </group>
  )
}
