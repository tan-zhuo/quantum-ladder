import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { useQualityProfile } from '../core/sceneStore'
import { ControlGroup, Legend, CanvasStat } from '../core/widgets'
import { Slider, Toggle, Button } from '@/components/sim/controls'
import Tex from '@/components/math/Tex'

/**
 * 模块 13 主场景：路径积分。
 *
 * 三件事必须同时出现，才能把「所有路径都贡献」讲清楚：
 *   1. 一大把真实生成的路径（不是示意曲线），每条都算了自己的作用量；
 *   2. 相位用颜色编码——偏离经典路径越远，颜色转得越快；
 *   3. 把所有振幅首尾相接画成相量链。链条在经典路径附近几乎是直的（同相叠加），
 *      再往外卷成螺旋并收敛——那个螺旋就是「相消」的样子。
 *
 * ħ 滑块是唯一的开关：调小它，能存活的路径束迅速收窄到经典路径。
 */

const A_X = -3.4
const B_X = 3.4
const STEPS = 48
// 摆在画面顶部中间：链条往哪边长取决于平均相位，两侧都得留出余地，
// 而左上角被预设视角按钮占着。
const PHASOR_ORIGIN: [number, number, number] = [-1.4, 2.7, -1.4]
/** 相量链首尾全同相时的总长度（世界单位） */
const PHASOR_SPAN = 4.5

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [1.5, 4.5, 9], title: '同时看到路径与相量链' },
  { id: 'paths', label: '看路径', position: [0, 0.8, 9.5], title: '正对路径束' },
  { id: 'phasor', label: '看相量链', position: [-0.6, 2.9, 3.4], target: [-0.6, 2.7, -1.4], title: '正对相量链：看螺旋怎么卷起来' },
]

interface PathData {
  /** 每条路径的采样点（世界坐标） */
  points: Float32Array
  /** 作用量 */
  action: number
  /** 相对经典路径的作用量增量 */
  delta: number
}

/** 一条路径：经典直线 + 若干正弦模式的随机叠加（两端固定） */
function makePaths(count: number, roughness: number, seed: number): { paths: PathData[]; classical: number } {
  let s = seed >>> 0
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  const paths: PathData[] = []
  const T = 1
  const dt = T / STEPS
  const mass = 1
  const vx = (B_X - A_X) / T
  const classical = 0.5 * mass * vx * vx * T

  for (let k = 0; k < count; k++) {
    // 前 4 个傅里叶模式足够撑出丰富的路径形状，又不至于让曲线变成噪声
    const amps = [0, 1, 2, 3].map((m) => (rnd() * 2 - 1) * roughness * (1 / (m + 1)))
    const pts = new Float32Array((STEPS + 1) * 3)
    let action = 0
    let prevY = 0
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS
      const x = A_X + (B_X - A_X) * t
      let y = 0
      for (let m = 0; m < amps.length; m++) y += amps[m]! * Math.sin((m + 1) * Math.PI * t)
      pts[i * 3] = x
      pts[i * 3 + 1] = y
      pts[i * 3 + 2] = 0
      if (i > 0) {
        const vy = (y - prevY) / dt
        action += 0.5 * mass * (vx * vx + vy * vy) * dt
      }
      prevY = y
    }
    paths.push({ points: pts, action, delta: action - classical })
  }
  // 第一条永远是严格的经典路径，便于高亮
  const flat = new Float32Array((STEPS + 1) * 3)
  for (let i = 0; i <= STEPS; i++) {
    flat[i * 3] = A_X + (B_X - A_X) * (i / STEPS)
    flat[i * 3 + 1] = 0
    flat[i * 3 + 2] = 0
  }
  paths[0] = { points: flat, action: classical, delta: 0 }
  return { paths, classical }
}

/** 相位 → 颜色（HSL 色环），让「相位转得多快」直接可见 */
function phaseColor(phase: number, out: THREE.Color): THREE.Color {
  const h = ((phase / (2 * Math.PI)) % 1 + 1) % 1
  return out.setHSL(h, 0.72, 0.5)
}

export default function PathIntegralScene() {
  const p = useScenePalette()
  const profile = useQualityProfile()
  const apiRef = useRef<SceneApi | null>(null)

  const [hbar, setHbar] = useState(1)
  const [roughness, setRoughness] = useState(1.1)
  const [count, setCount] = useState(120)
  const [seed, setSeed] = useState(1)
  const [showPhasor, setShowPhasor] = useState(true)
  const [showClassical, setShowClassical] = useState(true)

  const nPaths = Math.min(count, profile.rich ? 220 : 90)

  const { paths, classical } = useMemo(
    () => makePaths(nPaths, roughness, seed),
    [nPaths, roughness, seed],
  )

  /** 全部路径打包成一份 LineSegments：几百条独立的 Line 组件会拖垮帧率 */
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const segs = nPaths * STEPS
    const pos = new Float32Array(segs * 2 * 3)
    const col = new Float32Array(segs * 2 * 3)
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [nPaths])

  useEffect(() => () => geom.dispose(), [geom])

  useEffect(() => {
    const pos = geom.getAttribute('position') as THREE.BufferAttribute
    const col = geom.getAttribute('color') as THREE.BufferAttribute
    const pa = pos.array as Float32Array
    const ca = col.array as Float32Array
    const c = new THREE.Color()
    let o = 0
    for (const path of paths) {
      // 用 ΔS 而不是 S 上色：整体相位不可观测，减掉它之后经典路径永远是同一个颜色，
      // 相邻路径的色差才直接对应「相位差」这件唯一有意义的事。
      const phase = path.delta / hbar
      phaseColor(phase, c)
      for (let i = 0; i < STEPS; i++) {
        pa[o] = path.points[i * 3]!
        pa[o + 1] = path.points[i * 3 + 1]!
        pa[o + 2] = path.points[i * 3 + 2]!
        pa[o + 3] = path.points[(i + 1) * 3]!
        pa[o + 4] = path.points[(i + 1) * 3 + 1]!
        pa[o + 5] = path.points[(i + 1) * 3 + 2]!
        ca[o] = c.r
        ca[o + 1] = c.g
        ca[o + 2] = c.b
        ca[o + 3] = c.r
        ca[o + 4] = c.g
        ca[o + 5] = c.b
        o += 6
      }
    }
    pos.needsUpdate = true
    col.needsUpdate = true
    geom.computeBoundingSphere()
  }, [paths, hbar, geom])

  /**
   * 相量链：把每条路径的 e^{iS/ħ} 首尾相接。
   * 链条越直，说明各路径同相叠加；卷成螺旋并原地打转，说明它们在互相抵消。
   */
  const phasor = useMemo(() => {
    const pts: [number, number, number][] = [PHASOR_ORIGIN]
    let x = PHASOR_ORIGIN[0]
    let y = PHASOR_ORIGIN[1]
    const step = PHASOR_SPAN / Math.max(1, paths.length)
    // 按作用量排序后再首尾相接，螺旋才是光滑的（否则是一团乱麻）
    const sorted = [...paths].sort((a, b) => a.action - b.action)
    let sumRe = 0
    let sumIm = 0
    for (const path of sorted) {
      const ph = path.delta / hbar
      sumRe += Math.cos(ph)
      sumIm += Math.sin(ph)
      x += Math.cos(ph) * step
      y += Math.sin(ph) * step
      pts.push([x, y, PHASOR_ORIGIN[2]])
    }
    const total = Math.hypot(sumRe, sumIm) / paths.length
    return { pts, total }
  }, [paths, hbar])

  /** 存活路径的比例：|ΔS| < πħ 的那些（相位差不到半圈，尚未被抵消） */
  const surviving = useMemo(() => {
    const n = paths.filter((q) => Math.abs(q.delta) < Math.PI * hbar).length
    return n / paths.length
  }, [paths, hbar])

  return (
    <SceneShell
      id="path-integral"
      title="路径积分：所有路径都在贡献，经典路径只是活下来的那条"
      subtitle="每条路径带一个相位 e^{iS/ħ}，颜色就是相位。把所有振幅首尾相接得到右上角那条链——它卷成螺旋的地方，就是路径互相抵消的地方。"
      apiRef={apiRef}
      height={560}
      controls={
        <>
          <ControlGroup
            title="ħ"
            hint="这是整个场景唯一的开关。ħ 越小，同样的 ΔS 对应的相位差越大，抵消越彻底，能活下来的路径束越窄。"
          >
            <Slider
              label="普朗克常数 ħ"
              value={hbar}
              min={0.05}
              max={4}
              step={0.05}
              onChange={setHbar}
              display={hbar.toFixed(2)}
            />
            <div className="flex flex-wrap gap-1.5">
              <Button onClick={() => setHbar(3)}>量子（大 ħ）</Button>
              <Button onClick={() => setHbar(1)}>中间</Button>
              <Button onClick={() => setHbar(0.1)} title="经典极限：只剩经典路径附近的一小束">
                经典极限
              </Button>
            </div>
          </ControlGroup>

          <ControlGroup title="路径样本">
            <Slider label="路径条数" value={count} min={20} max={220} step={10} onChange={setCount} />
            <Slider
              label="路径粗糙度"
              value={roughness}
              min={0.2}
              max={2.5}
              step={0.05}
              onChange={setRoughness}
              hint="控制随机路径偏离直线的幅度"
            />
            <Button onClick={() => setSeed((v) => v + 1)}>换一批路径</Button>
          </ControlGroup>

          <ControlGroup title="显示">
            <Toggle label="相量链（振幅求和）" checked={showPhasor} onChange={setShowPhasor} />
            <Toggle label="高亮经典路径" checked={showClassical} onChange={setShowClassical} />
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="overflow-x-auto text-[15px]">
            <Tex>
              {'K(b;a) = \\int \\mathcal{D}[x(t)]\\;\\ee^{\\ii S[x]/\\hbar},\\qquad S[x]=\\int L\\,\\dd t'}
            </Tex>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>经典作用量 S_cl = {classical.toFixed(3)}</span>
            <span>ħ = {hbar.toFixed(2)}</span>
            <span>相位灵敏度 S_cl/ħ = {(classical / hbar).toFixed(1)} rad</span>
            <span>|ΔS| &lt; πħ 的路径占 {(surviving * 100).toFixed(0)}%</span>
            <span>总振幅 |ΣA|/N = {phasor.total.toFixed(3)}</span>
          </div>
          <Legend
            items={[
              { color: p.ink, label: '经典路径（S 取极值）' },
              { color: p.accent, label: '相量链' },
              { color: p.faint, label: '路径颜色 = 相位（色环）' },
            ]}
          />
        </div>
      }
      guide={[
        '先把 ħ 设成 3（量子）：路径的颜色变化很缓和，说明相邻路径的相位差不大，它们都在有效地贡献。相量链几乎是一条直线——同相叠加。',
        '把 ħ 拖到 0.1（经典极限）：颜色开始高速旋转，相量链立刻卷成一个小螺旋并原地打转。只有紧贴经典路径的那几条还在同相叠加。',
        '注意读数里的「|ΔS| < πħ 的路径占比」：ħ 越小，这个比例越低。存活的路径束就是经典轨迹的宽度。',
        '把「路径粗糙度」调大：偏离更远的路径出现，它们的相位更混乱，对总和几乎没有净贡献——但它们确实参与了。',
        '切到「看相量链」视角正对螺旋：这条链的**端点到起点的连线**就是总振幅。链越直，振幅越大。',
      ]}
      pitfalls={[
        {
          title: '“粒子真的同时走了所有路径”',
          body: '路径积分是一种计算振幅的方法，不是对「粒子做了什么」的字面描述。可靠的说法是：不指定路径时，必须把所有路径的振幅相加。',
        },
        {
          title: '“远离经典的路径贡献小”',
          body: '每条路径的振幅**模长完全相同**。差别只在相位。远处的路径不是贡献小，而是彼此抵消。这两种说法给出的直觉完全不同。',
        },
        {
          title: '“典型路径是光滑的”',
          body: '路径积分里占主导的路径处处连续但处处不可微（⟨Δx²⟩ ∝ Δt，和布朗运动一样）。「速度」在这个框架里不是良定义的量。',
        },
      ]}
      reflect={[
        '最小作用量原理在经典力学里是一条基本假设。在路径积分里它是什么？（提示：看 ħ → 0 时相量链发生了什么。）',
        '双缝实验在这套语言里怎么说？（提示：挡板杀掉了绝大多数路径，只留下两类。）',
        '若某条路径的 S 比经典路径大 100ħ，它「被抵消」的意思是：总有另一条路径与它反相。这个配对在 ħ 很大时还存在吗？',
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={3}
        maxDistance={26}
        overlay={
          <CanvasStat>
            ħ = {hbar.toFixed(2)}　路径 {paths.length}　|ΣA|/N = {phasor.total.toFixed(3)}
          </CanvasStat>
        }
      >
        {/* 起点与终点 */}
        {(
          [
            [A_X, 'A'],
            [B_X, 'B'],
          ] as [number, string][]
        ).map(([x, label]) => (
          <group key={label} position={[x, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.14, 20, 16]} />
              <meshStandardMaterial color={p.ink} />
            </mesh>
            <SceneLabel position={[0, 0.35, 0]} tone="ink" size="xs">
              {label}
            </SceneLabel>
          </group>
        ))}

        <lineSegments geometry={geom}>
          <lineBasicMaterial vertexColors transparent opacity={0.72} />
        </lineSegments>

        {showClassical ? (
          <Line
            points={[
              [A_X, 0, 0.02],
              [B_X, 0, 0.02],
            ]}
            color={p.ink}
            lineWidth={2.6}
          />
        ) : null}

        {showPhasor ? (
          <group>
            <Line points={phasor.pts} color={p.accent} lineWidth={2} />
            <Line
              points={[PHASOR_ORIGIN, phasor.pts[phasor.pts.length - 1]!]}
              color={p.energy}
              lineWidth={2.4}
              dashed
              dashSize={0.12}
              gapSize={0.09}
            />
            <SceneLabel position={[PHASOR_ORIGIN[0], PHASOR_ORIGIN[1] + 0.5, PHASOR_ORIGIN[2]]} tone="accent" size="xs">
              相量链：Σ e^{'{iS/ħ}'}
            </SceneLabel>
            <SceneLabel
              position={phasor.pts[phasor.pts.length - 1]!}
              tone="custom"
              size="xs"
              offset={[0, -14]}
            >
              <span style={{ color: p.energy }}>总振幅</span>
            </SceneLabel>
          </group>
        ) : null}

        <SceneLabel position={[0, -2.4, 0]} tone="muted" size="xs">
          颜色 = 相位 S/ħ（转一圈 = 2π）
        </SceneLabel>
      </SceneCanvas>
    </SceneShell>
  )
}
