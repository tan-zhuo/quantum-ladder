import { translator, DEFAULT_LANG, type Lang } from '@/i18n'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { BlochFrame, circlePoints } from './BlochFrame'
import { ControlGroup, TimeBar, Legend, CanvasStat, ProbabilityBar } from '../core/widgets'
import { Slider, Segmented, Button, Toggle } from '@/components/sim/controls'
import Tex from '@/components/math/Tex'
import { measureProbability, rotateAboutAxis, vectorToBloch } from '@/lib/quantum3d'

/**
 * 模块 05 主场景：自旋与 Bloch 球。
 *
 * 想让人拿走三件事：
 *   1. 一个纯态就是球面上的一个点——两个实参数 (θ, φ)，不是四个实数；
 *   2. 磁场让它绕着磁场方向**进动**，而不是「被吸过去」；
 *   3. 测量沿某个轴把它投到两极，概率由投影长度给出，单次结果随机、大量重复才显出规律。
 */

const AXES: Record<string, [number, number, number]> = {
  // three.js 坐标：y 轴朝上对应量子化轴 z
  z: [0, 1, 0],
  x: [1, 0, 0],
  y: [0, 0, 1],
}

const AXIS_LABEL: Record<string, string> = { z: 'Z（σ_z）', x: 'X（σ_x）', y: 'Y（σ_y）' }

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [2.4, 1.7, 2.4], title: '默认视角：三条轴都能看清' },
  { id: 'front', label: '正面 xz', position: [0, 0.35, 3.4], title: '沿 y 轴看：θ 就是与竖直方向的夹角' },
  { id: 'top', label: '俯视 xy', position: [0, 3.4, 0.001], title: '沿 z 轴俯视：φ 就是赤道面上的方位角' },
  { id: 'close', label: '近观', position: [1.5, 1.0, 1.5], title: '拉近看矢量与投影' },
]

interface LiveState {
  vec: THREE.Vector3
  /** 测量投影动画 */
  anim: { from: THREE.Vector3; to: THREE.Vector3; t: number } | null
}

/** 球面上的状态矢量 + 尖端拖拽手柄 + 到测量轴的投影 */
function StateVector({
  live,
  measureAxis,
  showProjection,
  onDrag,
}: {
  live: React.MutableRefObject<LiveState>
  measureAxis: [number, number, number]
  showProjection: boolean
  onDrag: (v: THREE.Vector3) => void
}) {
  const p = useScenePalette()
  const groupRef = useRef<THREE.Group>(null)
  const tipRef = useRef<THREE.Mesh>(null)
  const { camera, gl, controls } = useThree()
  const [dragging, setDragging] = useState(false)

  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const projGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return g
  }, [])

  useFrame(() => {
    const v = live.current.vec
    if (groupRef.current) {
      q.setFromUnitVectors(up, v)
      groupRef.current.quaternion.copy(q)
    }
    if (tipRef.current) tipRef.current.position.copy(v)
    if (showProjection) {
      // 从矢量尖端垂直落到测量轴上：P± = (1 ± r·n̂)/2 的几何来源
      const n = new THREE.Vector3(...measureAxis).normalize()
      const foot = n.clone().multiplyScalar(v.dot(n))
      const arr = projGeom.attributes.position!.array as Float32Array
      arr[0] = v.x
      arr[1] = v.y
      arr[2] = v.z
      arr[3] = foot.x
      arr[4] = foot.y
      arr[5] = foot.z
      projGeom.attributes.position!.needsUpdate = true
    }
  })

  // 拖拽：把指针射线打到单位球上。射线打空时退化成「球心到射线的最近点再归一化」，
  // 这样拖出球缘也不会突然失去响应——否则用户会以为是卡住了。
  useEffect(() => {
    if (!dragging) return
    const el = gl.domElement
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1)
    const hit = new THREE.Vector3()

    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      ray.setFromCamera(ndc, camera)
      const p1 = ray.ray.intersectSphere(sphere, hit)
      if (p1) {
        onDrag(p1.clone().normalize())
      } else {
        ray.ray.closestPointToPoint(sphere.center, hit)
        if (hit.lengthSq() > 1e-9) onDrag(hit.clone().normalize())
      }
    }
    const up2 = () => setDragging(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up2)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up2)
    }
  }, [dragging, camera, gl, onDrag])

  useEffect(() => {
    // 拖矢量时必须关掉轨道控制，否则会同时转相机
    const c = controls as unknown as { enabled: boolean } | null
    if (c) c.enabled = !dragging
    gl.domElement.style.cursor = dragging ? 'grabbing' : ''
    return () => {
      if (c) c.enabled = true
      gl.domElement.style.cursor = ''
    }
  }, [dragging, controls, gl])

  return (
    <group>
      <group ref={groupRef}>
        <mesh position={[0, 0.44, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.88, 12]} />
          <meshStandardMaterial color={p.accent} roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.94, 0]}>
          <coneGeometry args={[0.05, 0.12, 18]} />
          <meshStandardMaterial color={p.accent} roughness={0.35} metalness={0.1} />
        </mesh>
      </group>

      {/* 尖端手柄：hover 变手型，按下即进入拖拽 */}
      <mesh
        ref={tipRef}
        onPointerDown={(e) => {
          e.stopPropagation()
          setDragging(true)
        }}
        onPointerOver={() => (gl.domElement.style.cursor = 'grab')}
        onPointerOut={() => {
          if (!dragging) gl.domElement.style.cursor = ''
        }}
      >
        <sphereGeometry args={[0.075, 20, 16]} />
        <meshStandardMaterial
          color={p.accent}
          emissive={p.accent}
          emissiveIntensity={dragging ? 0.55 : 0.2}
          roughness={0.3}
        />
      </mesh>

      {showProjection ? (
        // 用 <line> + 原生几何而不是 drei 的 <Line>：这条线每帧都在动，
        // 逐帧重建 Line2 的几何体不划算，这里只改两个顶点的坐标。
        <line>
          <primitive object={projGeom} attach="geometry" />
          <lineBasicMaterial color={p.muted} transparent opacity={0.75} />
        </line>
      ) : null}
    </group>
  )
}

/** 进动动力学：dr⃗/dt = ω⃗ × r⃗，用罗德里格斯公式做严格的有限转动（模长不漂移） */
function Dynamics({
  live,
  playing,
  speed,
  omega,
  axis,
  onSample,
}: {
  live: React.MutableRefObject<LiveState>
  playing: boolean
  speed: number
  omega: number
  axis: [number, number, number]
  onSample: (v: THREE.Vector3) => void
}) {
  const acc = useRef(0)
  useFrame((_, dtRaw) => {
    // 标签页切回来时 dt 可能是好几秒，一次转过头会让人以为程序算错了
    const dt = Math.min(dtRaw, 0.05)
    const st = live.current

    if (st.anim) {
      st.anim.t = Math.min(1, st.anim.t + dt / 0.45)
      const s = st.anim.t * st.anim.t * (3 - 2 * st.anim.t)
      // 沿大圆插值，中间过程始终是合法的纯态（模长 1）
      const from = st.anim.from
      const to = st.anim.to
      const dot = THREE.MathUtils.clamp(from.dot(to), -1, 1)
      const ang = Math.acos(dot)
      if (ang < 1e-4) {
        st.vec.copy(to)
      } else {
        const sa = Math.sin(ang)
        st.vec
          .copy(from)
          .multiplyScalar(Math.sin((1 - s) * ang) / sa)
          .addScaledVector(to, Math.sin(s * ang) / sa)
          .normalize()
      }
      if (st.anim.t >= 1) st.anim = null
    } else if (playing && omega > 0) {
      const r = rotateAboutAxis([st.vec.x, st.vec.y, st.vec.z], axis, omega * dt * speed)
      st.vec.set(r[0], r[1], r[2]).normalize()
    }

    // 读数区不需要 60 Hz：12 Hz 已经跟得上眼睛，还省掉大量 React 重渲染
    acc.current += dt
    if (acc.current > 0.08) {
      acc.current = 0
      onSample(st.vec)
    }
  })
  return null
}

function PrecessionCone({
  axis,
  cosAngle,
  visible,
}: {
  axis: [number, number, number]
  cosAngle: number
  visible: boolean
}) {
  const p = useScenePalette()
  const pts = useMemo(() => {
    const n = new THREE.Vector3(...axis).normalize()
    const r = Math.sqrt(Math.max(0, 1 - cosAngle * cosAngle))
    const c = n.clone().multiplyScalar(cosAngle)
    return circlePoints([n.x, n.y, n.z], r, 96, [c.x, c.y, c.z])
  }, [axis, cosAngle])
  if (!visible || Math.abs(cosAngle) > 0.999) return null
  return <Line points={pts} color={p.classical} lineWidth={1.6} dashed dashSize={0.06} gapSize={0.045} transparent opacity={0.9} />
}

/** 读数区里可点击的一项公式。点亮之后 3D 里会画出对应的几何量。 */
function FormulaTerm({
  children,
  active,
  onToggle,
  title,
}: {
  children: React.ReactNode
  active: boolean
  onToggle: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={
        'rounded-md px-1 transition-colors ' +
        (active
          ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] ring-1 ring-[var(--accent)]/40'
          : 'hover:bg-[var(--bg-subtle)]')
      }
    >
      {children}
    </button>
  )
}

/**
 * θ 与 φ 的角度弧。
 *
 * 这是规格里「点击公式高亮对应 3D 元素」的落点：θ 是矢量与 +z 轴的夹角，
 * φ 是它在赤道面上的投影与 +x 轴的夹角。两个角在公式里各占一项，
 * 在球上各是一段弧——点一下就把这层对应关系摆出来。
 */
function AngleArcs({
  highlight,
  theta,
  phi,
}: {
  highlight: 'theta' | 'phi' | null
  theta: number
  phi: number
}) {
  const p = useScenePalette()
  const arcs = useMemo(() => {
    const R = 0.42
    const thetaArc: [number, number, number][] = []
    for (let i = 0; i <= 48; i++) {
      const a = (theta * i) / 48
      // 从 +z（three 的 +y）转向矢量所在的那个竖直平面
      thetaArc.push([
        R * Math.sin(a) * Math.cos(phi),
        R * Math.cos(a),
        R * Math.sin(a) * Math.sin(phi),
      ])
    }
    const phiArc: [number, number, number][] = []
    for (let i = 0; i <= 48; i++) {
      const a = (phi * i) / 48
      phiArc.push([R * 1.35 * Math.cos(a), 0, R * 1.35 * Math.sin(a)])
    }
    return { thetaArc, phiArc, R }
  }, [theta, phi])

  if (!highlight) return null

  if (highlight === 'theta') {
    const mid = arcs.thetaArc[24]!
    return (
      <group>
        <Line points={arcs.thetaArc} color={p.accent} lineWidth={2.6} />
        <Line
          points={[
            [0, 0, 0],
            [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)],
          ]}
          color={p.accent}
          lineWidth={1.2}
          transparent
          opacity={0.5}
        />
        <SceneLabel position={[mid[0] * 1.35, mid[1] * 1.35, mid[2] * 1.35]} tone="accent">
          θ = {((theta * 180) / Math.PI).toFixed(0)}°
        </SceneLabel>
      </group>
    )
  }

  const mid = arcs.phiArc[24]!
  return (
    <group>
      <Line points={arcs.phiArc} color={p.imag} lineWidth={2.6} />
      <Line
        points={[
          [0, 0, 0],
          [Math.sin(theta) * Math.cos(phi), 0, Math.sin(theta) * Math.sin(phi)],
        ]}
        color={p.imag}
        lineWidth={1.2}
        transparent
        opacity={0.55}
        dashed
        dashSize={0.05}
        gapSize={0.04}
      />
      <SceneLabel position={[mid[0] * 1.2, 0.08, mid[2] * 1.2]} tone="custom">
        <span style={{ color: p.imag }}>φ = {((phi * 180) / Math.PI).toFixed(0)}°</span>
      </SceneLabel>
    </group>
  )
}

export default function BlochSphereScene({ lang = DEFAULT_LANG }: { lang?: Lang }) {
  const T = translator(lang)
  const p = useScenePalette()
  const apiRef = useRef<SceneApi | null>(null)

  // 默认状态刻意落在相机对面的象限：θ=60°、φ=120° 时矢量与等轴视角约成 65°，
  // 一眼就能看出它是斜的。早先默认 φ=45°，矢量几乎正对相机，看上去像个点。
  const [theta, setTheta] = useState(Math.PI / 3)
  const [phi, setPhi] = useState((2 * Math.PI) / 3)
  const [bAxis, setBAxis] = useState<'z' | 'x' | 'y'>('z')
  const [bMag, setBMag] = useState(1.2)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [mAxis, setMAxis] = useState<'z' | 'x' | 'y'>('z')
  const [showCone, setShowCone] = useState(true)
  const [showProjection, setShowProjection] = useState(true)
  const [tally, setTally] = useState({ plus: 0, minus: 0 })
  const [outcome, setOutcome] = useState<null | { value: 1 | -1; at: number }>(null)
  /** 公式与 3D 的联动：点公式里的某一项，就在球上把对应的几何量画出来 */
  const [highlight, setHighlight] = useState<'theta' | 'phi' | null>(null)

  // 实时矢量放在 ref 里逐帧更新；React state 只保存 12 Hz 的采样，用于读数
  const live = useRef<LiveState>({
    vec: new THREE.Vector3(
      Math.sin(Math.PI / 3) * Math.cos((2 * Math.PI) / 3),
      Math.cos(Math.PI / 3),
      Math.sin(Math.PI / 3) * Math.sin((2 * Math.PI) / 3),
    ),
    anim: null,
  })
  const [sample, setSample] = useState<[number, number, number]>([
    live.current.vec.x,
    live.current.vec.y,
    live.current.vec.z,
  ])

  const setFromAngles = useCallback((t: number, f: number) => {
    live.current.anim = null
    live.current.vec.set(Math.sin(t) * Math.cos(f), Math.cos(t), Math.sin(t) * Math.sin(f))
    setSample([live.current.vec.x, live.current.vec.y, live.current.vec.z])
  }, [])

  useEffect(() => {
    setFromAngles(theta, phi)
  }, [theta, phi, setFromAngles])

  const onDrag = useCallback((v: THREE.Vector3) => {
    live.current.anim = null
    live.current.vec.copy(v)
    const { theta: t, phi: f } = vectorToBloch(v.x, v.y, v.z)
    // 直接改滑块值：拖球和拖滑块必须是同一个状态，不能各存各的
    setTheta(t)
    setPhi(f < 0 ? f + 2 * Math.PI : f)
  }, [])

  // 进动过程中不回写 θ/φ 滑块：那会触发 useEffect 把矢量又重置一次，形成回环。
  // 读数区显示的角度一律从采样值现算（displayAngles），滑块只代表「用户制备的初态」。
  const onSample = useCallback((v: THREE.Vector3) => {
    setSample([v.x, v.y, v.z])
  }, [])

  const mVec = AXES[mAxis]!
  const bVec = AXES[bAxis]!

  const pPlus = measureProbability(sample, mVec)
  const cosAngleToB = sample[0] * bVec[0] + sample[1] * bVec[1] + sample[2] * bVec[2]

  const displayAngles = useMemo(() => {
    const { theta: t, phi: f } = vectorToBloch(sample[0], sample[1], sample[2])
    return { theta: t, phi: f < 0 ? f + 2 * Math.PI : f }
  }, [sample])

  const measure = useCallback(() => {
    const v = live.current.vec
    const pp = measureProbability([v.x, v.y, v.z], mVec)
    const result: 1 | -1 = Math.random() < pp ? 1 : -1
    const to = new THREE.Vector3(...mVec).normalize().multiplyScalar(result)
    live.current.anim = { from: v.clone(), to, t: 0 }
    setTally((s) => (result === 1 ? { ...s, plus: s.plus + 1 } : { ...s, minus: s.minus + 1 }))
    setOutcome({ value: result, at: Date.now() })
    setPlaying(false)
  }, [mVec])

  /**
   * 重复制备并测量 N 次。
   *
   * 关键在「重复制备」：测量之后态已经塌缩，再测同一个方向只会得到同样的结果。
   * 只有每次都重新把系统制备回 |ψ⟩，统计才会显出 P± = (1 ± r⃗·n̂)/2。
   * 这一点是初学者最容易搞混的地方，所以按钮文案与提示都写死了「重新制备」。
   */
  const measureMany = useCallback(
    (n: number) => {
      const v = live.current.vec
      const pp = measureProbability([v.x, v.y, v.z], mVec)
      let plus = 0
      for (let i = 0; i < n; i++) if (Math.random() < pp) plus += 1
      setTally((s) => ({ plus: s.plus + plus, minus: s.minus + (n - plus) }))
    },
    [mVec],
  )

  const total = tally.plus + tally.minus
  const empirical = total > 0 ? tally.plus / total : 0

  return (
    <SceneShell
      lang={lang}
      id="bloch-sphere"
      title={T('Bloch 球：把一个自旋态变成可以用手拖的几何对象')}
      subtitle={T('球面上的每一个点都是一个纯态。拖动箭头尖端改变状态，加上磁场看它进动，选一个轴测量看它塌缩。')}
      apiRef={apiRef}
      height={560}
      controls={
        <>
          <ControlGroup title={T('状态制备')}>
            <Slider
              label={<Tex>{'\\theta'}</Tex>}
              value={theta}
              min={0}
              max={Math.PI}
              step={0.01}
              onChange={setTheta}
              display={`${((theta * 180) / Math.PI).toFixed(0)}°`}
            />
            <Slider
              label={<Tex>{'\\varphi'}</Tex>}
              value={phi}
              min={0}
              max={2 * Math.PI}
              step={0.01}
              onChange={setPhi}
              display={`${((phi * 180) / Math.PI).toFixed(0)}°`}
            />
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['|0⟩', 0, 0],
                  ['|1⟩', Math.PI, 0],
                  ['|+⟩', Math.PI / 2, 0],
                  ['|−⟩', Math.PI / 2, Math.PI],
                  ['|+i⟩', Math.PI / 2, Math.PI / 2],
                ] as [string, number, number][]
              ).map(([label, t, f]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setTheta(t)
                    setPhi(f)
                  }}
                  className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-[12px] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                >
                  {label}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup title={T('磁场与进动')} hint={T('磁场不会把自旋「拉过去」，只会让它绕着磁场方向转圈——夹角始终不变。')}>
            <Segmented
              label={T('磁场方向')}
              value={bAxis}
              onChange={(v) => setBAxis(v as 'z' | 'x' | 'y')}
              options={[
                { value: 'z', label: 'B∥z' },
                { value: 'x', label: 'B∥x' },
                { value: 'y', label: 'B∥y' },
              ]}
            />
            <Slider
              label={T('Larmor 频率 ω')}
              value={bMag}
              min={0}
              max={4}
              step={0.05}
              onChange={setBMag}
              display={bMag.toFixed(2)}
            />
            <TimeBar
              playing={playing}
              onPlay={setPlaying}
              onReset={() => {
                setPlaying(false)
                setFromAngles(theta, phi)
              }}
              speed={speed}
              onSpeed={setSpeed}
            />
            <Toggle label={T('显示进动锥')} checked={showCone} onChange={setShowCone} />
          </ControlGroup>

          <ControlGroup title={T('测量')}>
            <Segmented
              label={T('测量轴')}
              value={mAxis}
              onChange={(v) => setMAxis(v as 'z' | 'x' | 'y')}
              options={[
                { value: 'z', label: 'σz' },
                { value: 'x', label: 'σx' },
                { value: 'y', label: 'σy' },
              ]}
            />
            <Toggle label={T('显示投影辅助线')} checked={showProjection} onChange={setShowProjection} />
            <div className="flex flex-wrap gap-1.5">
              <Button variant="primary" onClick={measure}>
                {T('测量一次')}
              </Button>
              <Button onClick={() => measureMany(200)} title={T('每次都重新制备成当前 |ψ⟩ 再测')}>
                {T('重复制备 ×200')}
              </Button>
              <Button onClick={() => setTally({ plus: 0, minus: 0 })}>{T('清空统计')}</Button>
            </div>

            <div className="space-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2">
              <div className="flex justify-between text-[12px] text-[var(--text-muted)]">
                <span>{T('理论 P₊')}</span>
                <span className="font-mono tabular-nums text-[var(--text)]">{pPlus.toFixed(3)}</span>
              </div>
              <ProbabilityBar
                segments={[
                  { value: pPlus, color: p.energy, label: 'P₊' },
                  { value: 1 - pPlus, color: p.imag, label: 'P₋' },
                ]}
              />
              <div className="flex justify-between text-[12px] text-[var(--text-muted)]">
                <span>{T('实测频率（{0} 次）', total)}</span>
                <span className="font-mono tabular-nums text-[var(--text)]">
                  {total > 0 ? empirical.toFixed(3) : '—'}
                </span>
              </div>
              {total > 0 ? (
                <ProbabilityBar
                  segments={[
                    { value: empirical, color: p.energy, label: '+1' },
                    { value: 1 - empirical, color: p.imag, label: '−1' },
                  ]}
                />
              ) : null}
            </div>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 overflow-x-auto text-[15px]">
            <Tex>{'\\ket{\\psi} ='}</Tex>
            <FormulaTerm active={highlight === 'theta'} onToggle={() => setHighlight((h) => (h === 'theta' ? null : 'theta'))} title={T('点一下：在球上画出 θ（与 +z 轴的夹角）')}>
              <Tex>{`\\cos\\tfrac{\\theta}{2} = ${Math.cos(displayAngles.theta / 2).toFixed(3)}`}</Tex>
            </FormulaTerm>
            <Tex>{'\\ket{0} +'}</Tex>
            <FormulaTerm active={highlight === 'phi'} onToggle={() => setHighlight((h) => (h === 'phi' ? null : 'phi'))} title={T('点一下：在赤道面上画出 φ（相对相位）')}>
              <Tex>{`\\ee^{\\ii\\varphi} = \\ee^{${displayAngles.phi.toFixed(2)}\\ii}`}</Tex>
            </FormulaTerm>
            <FormulaTerm active={highlight === 'theta'} onToggle={() => setHighlight((h) => (h === 'theta' ? null : 'theta'))} title={T('点一下：在球上画出 θ')}>
              <Tex>{`\\sin\\tfrac{\\theta}{2} = ${Math.sin(displayAngles.theta / 2).toFixed(3)}`}</Tex>
            </FormulaTerm>
            <Tex>{'\\ket{1}'}</Tex>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>
              r⃗ = ({sample[0].toFixed(3)}, {sample[2].toFixed(3)}, {sample[1].toFixed(3)})
              <span className="ml-1 font-sans text-[11px] text-[var(--text-faint)]">(x, y, z)</span>
            </span>
            <span>|r⃗| = {Math.hypot(...sample).toFixed(4)}</span>
            <span>
              ⟨{T(AXIS_LABEL[mAxis])}⟩ = {(2 * pPlus - 1).toFixed(3)}
            </span>
          </div>
          <Legend
            items={[
              { color: p.accent, label: T('状态矢量 r⃗') },
              { color: p.classical, label: T('进动锥'), dashed: true },
              { color: p.muted, label: T('到测量轴的投影'), dashed: true },
              { color: p.energy, label: T('测量轴 n̂') },
            ]}
          />
        </div>
      }
      guide={[
        T('读数区的公式是可以点的：点 cos(θ/2) 那一项，球上会画出 θ 这个夹角；点 e^{iφ} 那一项，赤道面上会画出 φ。公式里的每个符号在球上都有一个对应的几何量。'),
        T('先把 θ 拖到 90°：状态落在赤道上，此时沿 z 测量得到 0 和 1 的概率各一半——「等概率叠加」在球面上就是「站在赤道」。'),
        T('保持 θ 不变、只拖 φ：沿 z 测量的概率完全不变。φ 是相对相位，它在 z 基下不可见，却决定了沿 x、y 测量的结果。切到 σx 再拖一次 φ，看读数怎么变。'),
        T('打开磁场按播放：注意矢量与磁场方向的夹角始终不变，只有 φ 在均匀增加。这就是 Larmor 进动。'),
        T('点「测量一次」十几次，观察单次结果是随机的；再点「重复制备 ×200」，看实测频率如何逼近理论 P₊。'),
      ]}
      pitfalls={[
        {
          title: T('“Bloch 球上的点就是粒子在空间中的方向”'),
          body: T('不是。球面是态空间，不是真实空间。θ = 90° 并不代表自旋「躺在水平面上」，而是代表沿 z 测量时上下各一半。'),
        },
        {
          title: T('“测量后再测一次会得到不同结果”'),
          body: T('不会。测量把态投影到本征态上，紧接着沿同一轴再测必得同样结果。要看到统计规律，必须每次重新制备——这正是「重复制备 ×200」在做的事。'),
        },
      ]}
      reflect={[
        T('两个只差一个整体相位的态（|ψ⟩ 与 e^{iα}|ψ⟩）在球面上是同一个点吗？如果是，为什么说相对相位 φ 却是可观测的？'),
        T('若磁场沿 z、初态恰好是 |0⟩，播放后画面上什么都没发生。用「本征态不随时间改变（除整体相位）」解释这件事。'),
        T('把测量轴设成 σx、状态设成 |0⟩，理论 P₊ = 0.5。测量一次后状态停在 ±x 上，此时若改回 σz 测量，概率是多少？这说明连续测不同方向意味着什么？'),
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={1.6}
        maxDistance={8}
        enablePan={false}
        overlay={
          <CanvasStat>
            θ = {((displayAngles.theta * 180) / Math.PI).toFixed(1)}° φ ={' '}
            {((displayAngles.phi * 180) / Math.PI).toFixed(1)}°
            {outcome ? (
              <span className="ml-2" style={{ color: outcome.value === 1 ? p.energy : p.imag }}>
                ↯ {T('上一次测量：{0}', outcome.value === 1 ? '+1' : '−1')}
              </span>
            ) : null}
          </CanvasStat>
        }
      >
        <BlochFrame />

        {/* 测量轴：加粗并延长，明确「往哪个方向投影」 */}
        <Line
          points={[
            [-mVec[0] * 1.3, -mVec[1] * 1.3, -mVec[2] * 1.3],
            [mVec[0] * 1.3, mVec[1] * 1.3, mVec[2] * 1.3],
          ]}
          color={p.energy}
          lineWidth={2.4}
          transparent
          opacity={0.85}
        />
        <SceneLabel position={[mVec[0] * 1.42, mVec[1] * 1.42, mVec[2] * 1.42]} tone="custom">
          <span style={{ color: p.energy }}>n̂ = {mAxis}</span>
        </SceneLabel>

        {/* 磁场 */}
        {bMag > 0 ? (
          <>
            <Line
              points={[
                [0, 0, 0],
                [bVec[0] * 1.55, bVec[1] * 1.55, bVec[2] * 1.55],
              ]}
              color={p.classical}
              lineWidth={2}
              transparent
              opacity={0.9}
            />
            <SceneLabel position={[bVec[0] * 1.68, bVec[1] * 1.68, bVec[2] * 1.68]} tone="custom">
              <span style={{ color: p.classical }}>B</span>
            </SceneLabel>
          </>
        ) : null}

        <PrecessionCone axis={bVec} cosAngle={cosAngleToB} visible={showCone && bMag > 0} />

        <AngleArcs highlight={highlight} theta={displayAngles.theta} phi={displayAngles.phi} />

        <StateVector live={live} measureAxis={mVec} showProjection={showProjection} onDrag={onDrag} />

        <Dynamics
          live={live}
          playing={playing}
          speed={speed}
          omega={bMag}
          axis={bVec}
          onSample={onSample}
        />
      </SceneCanvas>
    </SceneShell>
  )
}
