import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { useQualityProfile } from '../core/sceneStore'
import { ControlGroup, Legend, CanvasStat, MiniPlot, CanvasLegend } from '../core/widgets'
import { Slider, Segmented, Toggle } from '@/components/sim/controls'
import { PointCloud, GridPlane } from '../core/primitives'
import Tex from '@/components/math/Tex'
import {
  createOrbitalSampler,
  orbitalLabel,
  orbitalRadius,
  radialDensity,
  radialNodes,
} from '@/lib/quantum3d'

/**
 * 模块 06 主场景：氢原子轨道概率云。
 *
 * 这是整个平台上「三维不可替代」最典型的一个场景：2p_z 与 2p_x 的区别、
 * 3d 的四叶草、径向节点的球面——这些东西在纸面上要靠一堆剖面图去拼，
 * 在三维里转一圈就懂了。
 *
 * 点云的物理含义要说清楚：每个点是一次位置测量的可能结果，密度 ∝ |ψ|²。
 * 所以这里刻意让点「逐渐显影」，而不是啪地一下全出现。
 */

const PRESET_DIRS: { id: string; label: string; dir: [number, number, number]; title: string }[] = [
  { id: 'iso', label: '等轴', dir: [0.82, 0.5, 0.82], title: '默认视角' },
  { id: 'side', label: '侧视', dir: [0, 0.08, 1.4], title: '沿 y 轴看：看清 z 方向的波瓣分布' },
  { id: 'top', label: '俯视', dir: [0, 1.4, 0.02], title: '沿 z 轴俯视：看清 m 带来的方位角结构' },
  { id: 'edge', label: '贴面', dir: [1.4, 0.02, 0], title: '沿 x 轴看' },
]

function useOrbitalCloud(n: number, l: number, m: number, real: boolean, budget: number) {
  const buffers = useRef<{ positions: Float32Array; phase: Float32Array; colors: Float32Array }>({
    positions: new Float32Array(0),
    phase: new Float32Array(0),
    colors: new Float32Array(0),
  })
  const [ready, setReady] = useState(0)
  const sampler = useMemo(
    () => createOrbitalSampler(n, l, m, { real }),
    [n, l, m, real],
  )

  // 轨道或预算变了：重开一块缓冲区，从零开始显影
  useEffect(() => {
    buffers.current = {
      positions: new Float32Array(budget * 3),
      phase: new Float32Array(budget),
      colors: new Float32Array(budget * 3),
    }
    setReady(0)
  }, [sampler, budget])

  return { buffers, ready, setReady, sampler }
}

/** 每帧填一小块点，直到填满预算 */
function ProgressiveFill({
  sampler,
  buffers,
  budget,
  ready,
  setReady,
  colorPos,
  colorNeg,
}: {
  sampler: ReturnType<typeof createOrbitalSampler>
  buffers: React.MutableRefObject<{ positions: Float32Array; phase: Float32Array; colors: Float32Array }>
  budget: number
  ready: number
  setReady: (n: number) => void
  colorPos: THREE.Color
  colorNeg: THREE.Color
}) {
  const readyRef = useRef(ready)
  readyRef.current = ready

  useFrame(() => {
    const b = buffers.current
    if (b.positions.length === 0) return
    const done = readyRef.current
    if (done >= budget) return
    // 每帧 4000 个点：在低端机上约 4 ms，不会掉帧；六万个点两秒内显影完
    const chunk = Math.min(4000, budget - done)
    const written = sampler.fill(b.positions, b.phase, done, chunk)
    for (let i = done; i < done + written; i++) {
      const c = b.phase[i]! >= 0 ? colorPos : colorNeg
      b.colors[i * 3] = c.r
      b.colors[i * 3 + 1] = c.g
      b.colors[i * 3 + 2] = c.b
    }
    readyRef.current = done + written
    setReady(readyRef.current)
    if (written === 0) setReady(budget) // 采样器异常时别死循环
  })
  return null
}

/** 径向节点：真实存在的球面，波函数在上面严格为零 */
function NodeSpheres({ radii, color }: { radii: number[]; color: string }) {
  return (
    <>
      {radii.map((r, i) => (
        <mesh key={i}>
          <sphereGeometry args={[r, 48, 32]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.14} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

/** 半径参考环 + 刻度，让「1s 比 4f 小得多」这件事有量可依 */
function ScaleRings({ rMax, color }: { rMax: number; color: string }) {
  const rings = useMemo(() => {
    // 只留与当前轨道尺度可比的几圈：1s 的 rMax 只有 10，画到 20a₀ 没意义；
    // 4f 的 rMax 是 70，1a₀ 的圈会缩成中心的一个墨点，标注还会打架。
    const candidates = [1, 2, 5, 10, 20, 40]
    return candidates.filter((r) => r < rMax * 0.95 && r > rMax * 0.07)
  }, [rMax])
  const geoms = useMemo(
    () =>
      rings.map((r) => {
        const pts: number[] = []
        for (let i = 0; i <= 128; i++) {
          const a = (i / 128) * Math.PI * 2
          pts.push(Math.cos(a) * r, 0, Math.sin(a) * r)
        }
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
        return g
      }),
    [rings],
  )
  useEffect(() => () => geoms.forEach((g) => g.dispose()), [geoms])

  return (
    <group>
      {geoms.map((g, i) => (
        <line key={i} geometry={g}>
          <lineBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
        </line>
      ))}
      {rings.map((r) => (
        <SceneLabel key={r} position={[r, 0, 0]} tone="muted" size="xs">
          {r}a₀
        </SceneLabel>
      ))}
    </group>
  )
}

export default function HydrogenOrbitalScene() {
  const p = useScenePalette()
  const profile = useQualityProfile()
  const apiRef = useRef<SceneApi | null>(null)

  const [n, setN] = useState(3)
  const [l, setL] = useState(2)
  const [m, setM] = useState(0)
  const [real, setReal] = useState(true)
  const [opacity, setOpacity] = useState(0.72)
  const [showNodes, setShowNodes] = useState(true)
  const [showRings, setShowRings] = useState(true)
  const [clipOn, setClipOn] = useState(false)
  const [clipPos, setClipPos] = useState(0)
  // 记住用户当前用的是哪个预设视角：切换轨道要重新取景时，沿用同一个方向
  const viewIdRef = useRef('iso')

  // 量子数之间的约束：l < n，|m| ≤ l。改 n 时把越界的 l、m 拉回来
  useEffect(() => {
    if (l > n - 1) setL(n - 1)
  }, [n, l])
  useEffect(() => {
    if (Math.abs(m) > l) setM(0)
  }, [l, m])

  const rMax = orbitalRadius(n)
  const budget = profile.points
  const { buffers, ready, setReady, sampler } = useOrbitalCloud(n, l, m, real, budget)

  const colorPos = useMemo(() => new THREE.Color(p.phasePos), [p.phasePos])
  const colorNeg = useMemo(() => new THREE.Color(p.phaseNeg), [p.phaseNeg])

  // 相机随轨道大小重新取景：从 1s 切到 4f 时镜头拉远，尺度差别才有体感
  const presets = useMemo<ViewPreset[]>(
    () =>
      PRESET_DIRS.map((d) => ({
        id: d.id,
        label: d.label,
        title: d.title,
        position: [d.dir[0] * rMax, d.dir[1] * rMax, d.dir[2] * rMax] as [number, number, number],
      })),
    [rMax],
  )

  useEffect(() => {
    // presets 变化后 SceneCanvas 的 effect 先跑（子组件先于父组件），这里再触发飞行
    apiRef.current?.setView(viewIdRef.current || 'iso')
  }, [presets])

  const clipPlane = useMemo(() => {
    // 法向沿 z（three 的 z 轴）：剖开后能同时看到 xz 与 yz 两个方向的结构
    return new THREE.Plane(new THREE.Vector3(0, 0, -1), clipPos * rMax)
  }, [clipPos, rMax])
  const clipPlanes = useMemo(() => (clipOn ? [clipPlane] : undefined), [clipOn, clipPlane])

  const nodes = useMemo(() => (showNodes ? radialNodes(n, l) : []), [n, l, showNodes])
  const radial = useMemo(() => radialDensity(n, l, 220), [n, l])
  const radialSeries = useMemo(() => {
    const pts: [number, number][] = []
    for (let i = 0; i < radial.r.length; i++) pts.push([radial.r[i]! / rMax, radial.p[i]!])
    return pts
  }, [radial, rMax])

  const label = orbitalLabel(n, l, m)
  const energy = -0.5 / (n * n) // Hartree
  const angularNodes = l
  const radialNodeCount = n - l - 1

  const setOrbital = useCallback((nn: number, ll: number, mm: number) => {
    setN(nn)
    setL(ll)
    setM(mm)
  }, [])

  /**
   * 点的世界尺寸。PointsMaterial 开了 sizeAttenuation，屏幕像素数
   *   px = size · (H/2) / 距离，而相机距离 ≈ 1.2·rMax，
   * 所以 size 必须正比于 rMax 才能保证不同轨道看起来一样大。
   * 系数按「屏高 1100 时约 4 px」定；点数被降级砍掉时再放大一点，
   * 否则低档位下画面会稀得像噪点。
   */
  const pointSize = (rMax / 115) * Math.cbrt(60000 / Math.max(4000, budget))

  const axisGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, -rMax, 0, 0, rMax, 0], 3))
    return g
  }, [rMax])
  useEffect(() => () => axisGeom.dispose(), [axisGeom])

  return (
    <SceneShell
      id="hydrogen-orbital"
      title="氢原子轨道：真正看见 |ψ(r)|² 长什么样"
      subtitle="每个点是一次位置测量的可能结果，点的疏密就是概率密度。切换量子数，看波瓣、节点与尺度如何随 n、l、m 变化。"
      apiRef={apiRef}
      height={580}
      controls={
        <>
          <ControlGroup title="量子数" hint={`当前：${label}　l < n，|m| ≤ l`}>
            <Slider label="主量子数 n" value={n} min={1} max={5} step={1} onChange={setN} />
            <Slider label="角量子数 l" value={l} min={0} max={n - 1} step={1} onChange={setL} />
            <Slider label="磁量子数 m" value={m} min={-l} max={l} step={1} onChange={setM} disabled={l === 0} />
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['1s', 1, 0, 0],
                  ['2s', 2, 0, 0],
                  ['2p_z', 2, 1, 0],
                  ['3d_z²', 3, 2, 0],
                  ['3d_xy', 3, 2, -2],
                  ['4f', 4, 3, 0],
                ] as [string, number, number, number][]
              ).map(([lab, nn, ll, mm]) => (
                <button
                  key={lab}
                  type="button"
                  onClick={() => setOrbital(nn, ll, mm)}
                  className={
                    'rounded-md border px-2 py-1 text-[12px] transition-colors ' +
                    (n === nn && l === ll && m === mm
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                      : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]')
                  }
                >
                  {lab}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup
            title="表示方式"
            hint="化学课上画的哑铃、四叶草是「实球谐」；复球谐的 |ψ|² 关于 z 轴旋转对称，看不出方位角结构。两者都对，只是基底选得不同。"
          >
            <Segmented
              value={real ? 'real' : 'complex'}
              onChange={(v) => setReal(v === 'real')}
              options={[
                { value: 'real', label: '实轨道' },
                { value: 'complex', label: '复轨道 |Y_lm|²' },
              ]}
            />
            <Slider label="点云不透明度" value={opacity} min={0.15} max={1} step={0.01} onChange={setOpacity} />
          </ControlGroup>

          <ControlGroup title="结构与剖切">
            <Toggle label={`径向节点球面（${radialNodeCount} 个）`} checked={showNodes} onChange={setShowNodes} />
            <Toggle label="半径刻度环" checked={showRings} onChange={setShowRings} />
            <Toggle label="剖切平面" checked={clipOn} onChange={setClipOn} />
            {clipOn ? (
              <Slider
                label="剖切位置"
                value={clipPos}
                min={-0.9}
                max={0.9}
                step={0.01}
                onChange={setClipPos}
                display={`${(clipPos * rMax).toFixed(1)} a₀`}
              />
            ) : null}
          </ControlGroup>

          <ControlGroup title="径向概率 P(r) = r²|R(r)|²">
            <MiniPlot
              series={[{ points: radialSeries, color: p.prob, fill: true }]}
              markers={nodes.map((r) => [r / rMax, p.faint] as [number, string])}
              xTicks={[
                [0, 0, '0'],
                [1, 0, `${rMax.toFixed(0)} a₀`],
              ]}
              ariaLabel="径向概率分布"
            />
            <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">
              竖虚线是径向节点。注意峰值位置随 n 迅速外移——这就是原子「变大」的含义。
            </p>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <span className="text-[15px]">
              <Tex>{`\\psi_{${n}${l}${m}}(r,\\theta,\\varphi) = R_{${n}${l}}(r)\\,Y_{${l}}^{${m}}(\\theta,\\varphi)`}</Tex>
            </span>
            <span className="font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
              E = −13.6/{n}² eV = {(energy * 27.2114).toFixed(3)} eV
            </span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>径向节点 {radialNodeCount}</span>
            <span>角向节点 {angularNodes}</span>
            <span>总节点 {n - 1}</span>
            <span>
              采样点 {ready.toLocaleString()} / {budget.toLocaleString()}
            </span>
          </div>
          <Legend
            items={[
              { color: p.phasePos, label: 'ψ > 0 的波瓣' },
              { color: p.phaseNeg, label: 'ψ < 0 的波瓣' },
              { color: p.faint, label: '径向节点球面' },
            ]}
          />
        </div>
      }
      guide={[
        '先看 1s → 2s → 3s：形状都是球，但半径迅速变大，中间多出一层层的节点球面。原子的「大小」就是这么来的。',
        '固定 n = 2，把 l 从 0 调到 1：球变成哑铃。再调 m，哑铃换方向——这就是 p_z、p_x、p_y 的来历。',
        '选 3d、m = ±2，打开剖切平面并拖动它：从外面看是四叶草，剖开才看得到中间是空的。',
        '把「实轨道」切到「复轨道」：形状立刻变成绕 z 轴旋转对称的圆环。两种画法描述同一组本征态，只是基底不同——化学里习惯用实的，做角动量代数时习惯用复的。',
        '打开径向节点球面，数一数：球面数应当恰好是 n − l − 1。',
      ]}
      pitfalls={[
        {
          title: '“电子在轨道上绕着核转”',
          body: '定态里没有轨迹。点云不是电子走过的路线，而是「如果现在测量位置，结果落在这里的概率」。定态的概率密度完全不随时间变化。',
        },
        {
          title: '“轨道有明确的边界”',
          body: '|ψ|² 在任何有限半径外都不为零，只是指数衰减。图上看到的「边缘」是采样点稀疏到画不出来而已，不是墙。',
        },
        {
          title: '“节点是电子不能通过的地方”',
          body: '节点面上概率密度为零，但这不构成「屏障」。在束缚态里问「电子怎么穿过节点」本身就预设了轨迹，而轨迹并不存在。',
        },
      ]}
      reflect={[
        '为什么氢原子的能量只依赖 n，与 l、m 无关？（提示：这是库仑势特有的额外简并，别的中心力场没有。）',
        '2p_z 与 2p_x 的能量相同、形状只差一个转动。那么「电子处在 2p_z 上」这句话有绝对意义吗？',
        '总节点数恒等于 n − 1。回想一维势阱里第 n 个态有 n 个节点——两件事之间是什么关系？',
      ]}
    >
      <SceneCanvas
        presets={presets}
        apiRef={apiRef}
        onViewChange={(id) => (viewIdRef.current = id)}
        clippingPlanes={clipPlanes}
        minDistance={rMax * 0.25}
        maxDistance={rMax * 6}
        overlay={
          <>
            <CanvasStat>
              {label}　n={n} l={l} m={m}
              {ready < budget ? <span className="ml-2 opacity-70">显影中 {Math.round((ready / budget) * 100)}%</span> : null}
            </CanvasStat>
            <CanvasLegend
              items={[
                { color: p.phasePos, label: 'ψ > 0' },
                { color: p.phaseNeg, label: 'ψ < 0' },
              ]}
            />
          </>
        }
      >
        <GridPlane size={rMax} divisions={12} y={-rMax * 0.85} opacity={0.28} />
        {showRings ? <ScaleRings rMax={rMax} color={p.axis} /> : null}

        {/* 原子核：一个小点，提醒尺度中心在哪 */}
        <mesh>
          <sphereGeometry args={[Math.max(0.06, rMax / 120), 16, 12]} />
          <meshBasicMaterial color={p.ink} />
        </mesh>

        {/* 量子化轴 */}
        <line geometry={axisGeom}>
          <lineBasicMaterial color={p.axis} transparent opacity={0.45} />
        </line>
        <SceneLabel position={[0, rMax * 1.06, 0]} tone="muted" size="xs">
          z（量子化轴）
        </SceneLabel>

        {showNodes ? <NodeSpheres radii={nodes} color={p.faint} /> : null}

        <PointCloud
          positions={buffers.current.positions}
          colors={buffers.current.colors}
          count={ready}
          size={pointSize}
          opacity={opacity}
          clippingPlanes={clipPlanes}
        />

        <ProgressiveFill
          sampler={sampler}
          buffers={buffers}
          budget={budget}
          ready={ready}
          setReady={setReady}
          colorPos={colorPos}
          colorNeg={colorNeg}
        />
      </SceneCanvas>
    </SceneShell>
  )
}
