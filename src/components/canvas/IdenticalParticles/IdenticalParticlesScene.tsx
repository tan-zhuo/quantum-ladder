import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { useQualityProfile } from '../core/sceneStore'
import { ControlGroup, Legend, CanvasStat } from '../core/widgets'
import { Slider, Segmented, Button, Toggle } from '@/components/sim/controls'
import Tex from '@/components/math/Tex'

/**
 * 模块 10 主场景：交换对称性。
 *
 * 两粒子波函数 Ψ(x₁, x₂) 是**位形空间**上的函数，不是真实空间里的两团东西。
 * 这一点在三维里可以直接摆出来：把 (x₁, x₂) 当作水平面，Ψ 当作高度。
 * 于是「交换两个粒子」就是沿对角线做一次镜面反射——玻色子的曲面纹丝不动，
 * 费米子的曲面整个翻到地面以下（乘了 −1），而且对角线上恒为零。
 */

const GRID = 96
const PLANE = 6
const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [6.5, 5.5, 6.5], title: '看整张曲面' },
  { id: 'top', label: '俯视', position: [0, 9, 0.01], title: '俯视：看概率在 (x₁,x₂) 平面上的分布' },
  { id: 'diag', label: '沿对角线', position: [6.4, 2.2, 6.4], target: [0, 0, 0], title: '正对 x₁ = x₂ 这条线' },
  { id: 'side', label: '侧视', position: [9, 1.2, 0.01], title: '低角度看曲面起伏' },
]

type Sym = 'distinguishable' | 'boson' | 'fermion'

const L = 1 // 阱宽归一化为 1，网格坐标取 [0,1]

/** 无限深方阱的单粒子本征态，n 从 1 开始 */
function phi(n: number, x: number): number {
  return Math.SQRT2 * Math.sin(n * Math.PI * x)
}

export default function IdenticalParticlesScene() {
  const p = useScenePalette()
  const profile = useQualityProfile()
  const apiRef = useRef<SceneApi | null>(null)

  const [na, setNa] = useState(1)
  const [nb, setNb] = useState(2)
  const [sym, setSym] = useState<Sym>('fermion')
  const [showSquared, setShowSquared] = useState(false)
  const [exchangeToken, setExchangeToken] = useState(0)
  const [showDiagonal, setShowDiagonal] = useState(true)

  const grid = profile.rich ? GRID : 64

  /** 两粒子波函数在网格上的取值，以及一些可读的统计量 */
  const data = useMemo(() => {
    const arr = new Float32Array(grid * grid)
    let max = 1e-9
    let sep = 0
    let norm = 0
    const h = 1 / (grid - 1)
    for (let j = 0; j < grid; j++) {
      const x2 = j * h
      for (let i = 0; i < grid; i++) {
        const x1 = i * h
        const ab = phi(na, x1) * phi(nb, x2)
        const ba = phi(nb, x1) * phi(na, x2)
        let v: number
        if (sym === 'distinguishable') v = ab
        else if (sym === 'boson') v = (ab + ba) / Math.SQRT2
        else v = (ab - ba) / Math.SQRT2
        arr[j * grid + i] = v
        const w = v * v
        norm += w
        sep += (x1 - x2) * (x1 - x2) * w
        if (Math.abs(v) > max) max = Math.abs(v)
      }
    }
    return { arr, max, meanSep: norm > 0 ? sep / norm : 0 }
  }, [na, nb, sym, grid])

  const identical = na === nb
  const collapsed = identical && sym === 'fermion'

  /** 三种情形的 ⟨(x₁−x₂)²⟩ 对照 */
  const comparison = useMemo(() => {
    const calc = (s: Sym) => {
      let sep = 0
      let norm = 0
      const steps = 120
      const h = 1 / (steps - 1)
      for (let j = 0; j < steps; j++) {
        const x2 = j * h
        for (let i = 0; i < steps; i++) {
          const x1 = i * h
          const ab = phi(na, x1) * phi(nb, x2)
          const ba = phi(nb, x1) * phi(na, x2)
          const v =
            s === 'distinguishable' ? ab : s === 'boson' ? (ab + ba) / Math.SQRT2 : (ab - ba) / Math.SQRT2
          const w = v * v
          norm += w
          sep += (x1 - x2) * (x1 - x2) * w
        }
      }
      return norm > 0 ? sep / norm : 0
    }
    return {
      distinguishable: calc('distinguishable'),
      boson: calc('boson'),
      fermion: identical ? NaN : calc('fermion'),
    }
  }, [na, nb, identical])

  const exchange = useCallback(() => setExchangeToken((v) => v + 1), [])

  return (
    <SceneShell
      id="identical-particles"
      title="全同粒子：交换 = 沿对角线翻一次面"
      subtitle="水平面是位形空间 (x₁, x₂)，高度是波函数 Ψ。点「交换两个粒子」——玻色子的曲面纹丝不动，费米子的整张曲面翻到地面以下。"
      apiRef={apiRef}
      height={560}
      controls={
        <>
          <ControlGroup title="单粒子态">
            <Slider label="量子数 a" value={na} min={1} max={5} step={1} onChange={setNa} />
            <Slider label="量子数 b" value={nb} min={1} max={5} step={1} onChange={setNb} />
            {identical ? (
              <p className="rounded-lg border border-[var(--c-warn)]/40 bg-[color-mix(in_srgb,var(--c-warn)_8%,transparent)] px-2.5 py-1.5 text-[12px] leading-snug text-[var(--text-muted)]">
                两个量子数相同。费米子模式下整个波函数会**恒等于零**——这就是泡利不相容，
                它不是外加的禁令，而是反对称化的算术结果。
              </p>
            ) : null}
          </ControlGroup>

          <ControlGroup title="对称性">
            <Segmented
              value={sym}
              onChange={(v) => setSym(v as Sym)}
              options={[
                { value: 'distinguishable', label: '可分辨' },
                { value: 'boson', label: '玻色子' },
                { value: 'fermion', label: '费米子' },
              ]}
            />
            <Button variant="primary" onClick={exchange}>
              交换两个粒子
            </Button>
            <Toggle label="显示 |Ψ|² 而不是 Ψ" checked={showSquared} onChange={setShowSquared} />
            <Toggle label="高亮 x₁ = x₂ 对角线" checked={showDiagonal} onChange={setShowDiagonal} />
          </ControlGroup>

          <ControlGroup title="⟨(x₁−x₂)²⟩ 对照" hint="哈密顿量里没有任何相互作用势，差别纯粹来自对称性。">
            <div className="space-y-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>可分辨</span>
                <span>{comparison.distinguishable.toFixed(4)}</span>
              </div>
              <div className="flex justify-between" style={{ color: p.energy }}>
                <span>玻色子（聚集）</span>
                <span>{comparison.boson.toFixed(4)}</span>
              </div>
              <div className="flex justify-between" style={{ color: p.imag }}>
                <span>费米子（回避）</span>
                <span>{Number.isNaN(comparison.fermion) ? '—' : comparison.fermion.toFixed(4)}</span>
              </div>
            </div>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="overflow-x-auto text-[15px]">
            <Tex>
              {sym === 'distinguishable'
                ? '\\Psi(x_1,x_2) = \\phi_a(x_1)\\phi_b(x_2)'
                : sym === 'boson'
                  ? '\\Psi_+ = \\tfrac{1}{\\sqrt2}\\left[\\phi_a(x_1)\\phi_b(x_2) + \\phi_b(x_1)\\phi_a(x_2)\\right]'
                  : '\\Psi_- = \\tfrac{1}{\\sqrt2}\\left[\\phi_a(x_1)\\phi_b(x_2) - \\phi_b(x_1)\\phi_a(x_2)\\right]'}
            </Tex>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>⟨(x₁−x₂)²⟩ = {collapsed ? '—' : data.meanSep.toFixed(4)}</span>
            <span>交换后 Ψ → {sym === 'fermion' ? '−Ψ' : sym === 'boson' ? '+Ψ' : '另一个态（可分辨粒子不要求对称性）'}</span>
            {collapsed ? <span style={{ color: p.danger }}>Ψ ≡ 0（泡利不相容）</span> : null}
          </div>
          <Legend
            items={[
              { color: p.phasePos, label: 'Ψ > 0' },
              { color: p.phaseNeg, label: 'Ψ < 0' },
              { color: p.faint, label: 'x₁ = x₂ 对角线' },
            ]}
          />
        </div>
      }
      guide={[
        '先选「可分辨」：曲面在对角线两侧不对称——「1 号在左、2 号在右」和反过来是两个不同的状态。',
        '切到「玻色子」：曲面关于对角线镜像对称，而且在对角线上（两粒子重合处）取值最大。玻色子喜欢聚在一起。',
        '切到「费米子」：曲面在对角线上**严格为零**，而且对角线两侧一正一负。两个费米子不可能出现在同一点。',
        '点「交换两个粒子」：这个动画就是把曲面沿对角线翻 180°。玻色子看不出变化，费米子整个翻到了地面下——差别只有一个负号，后果是整张元素周期表。',
        '把两个量子数调成相同、选费米子：曲面直接消失。泡利不相容不需要额外规则，反对称化自己就把它算没了。',
      ]}
      pitfalls={[
        {
          title: '“交换对称性是一种作用力”',
          body: '哈密顿量里没有任何相互作用项。粒子的聚集或回避完全来自波函数必须（反）对称这个约束。习惯上叫「交换力」，但它不是力。',
        },
        {
          title: '“波函数画的是两个粒子在空间中的位置”',
          body: '这张曲面画在**位形空间**上：横轴是 1 号的位置，纵轴是 2 号的位置。两个粒子的真实空间是一维的，位形空间才是二维的。三个粒子就是三维，十个粒子就是十维——这也是多体问题难的根源。',
        },
        {
          title: '“泡利不相容说的是费米子之间有排斥力”',
          body: '不相容是波函数结构的后果，不是相互作用。它不传递能量、不随距离衰减，也没有对应的场。',
        },
      ]}
      reflect={[
        '两个电子的总波函数 = 空间部分 × 自旋部分，整体必须反对称。若自旋处于三重态（对称），空间部分必须反对称——这对它们的平均间距意味着什么？这就是铁磁性的起源之一。',
        '把 a、b 调得很远（比如 1 和 5），三种情形的 ⟨(x₁−x₂)²⟩ 差别会怎么变？为什么两个态的空间重叠越小，交换效应越弱？',
        '二维体系里交换两次不一定回到原状态，于是允许「任意子」（分数统计）。这与三维有什么本质区别？',
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={3}
        maxDistance={22}
        overlay={
          <CanvasStat>
            {sym === 'boson' ? '玻色子（对称）' : sym === 'fermion' ? '费米子（反对称）' : '可分辨粒子'}
            　a={na} b={nb}
          </CanvasStat>
        }
      >
        <Surface
          data={data}
          grid={grid}
          showSquared={showSquared}
          exchangeToken={exchangeToken}
          collapsed={collapsed}
        />

        {/* 位形空间的坐标框 */}
        <Line
          points={[
            [-PLANE / 2, 0, -PLANE / 2],
            [PLANE / 2, 0, -PLANE / 2],
            [PLANE / 2, 0, PLANE / 2],
            [-PLANE / 2, 0, PLANE / 2],
            [-PLANE / 2, 0, -PLANE / 2],
          ]}
          color={p.axis}
          lineWidth={1.2}
          transparent
          opacity={0.6}
        />
        {showDiagonal ? (
          <Line
            points={[
              [-PLANE / 2, 0.005, -PLANE / 2],
              [PLANE / 2, 0.005, PLANE / 2],
            ]}
            color={p.faint}
            lineWidth={2}
            dashed
            dashSize={0.14}
            gapSize={0.1}
          />
        ) : null}
        <SceneLabel position={[PLANE / 2 + 0.4, 0, -PLANE / 2]} tone="muted" size="xs">
          x₁
        </SceneLabel>
        <SceneLabel position={[-PLANE / 2, 0, PLANE / 2 + 0.4]} tone="muted" size="xs">
          x₂
        </SceneLabel>
        <SceneLabel position={[PLANE / 2 + 0.5, 0.1, PLANE / 2 + 0.5]} tone="muted" size="xs">
          x₁ = x₂
        </SceneLabel>
      </SceneCanvas>
    </SceneShell>
  )
}

function Surface({
  data,
  grid,
  showSquared,
  exchangeToken,
  collapsed,
}: {
  data: { arr: Float32Array; max: number }
  grid: number
  showSquared: boolean
  exchangeToken: number
  collapsed: boolean
}) {
  const p = useScenePalette()
  const groupRef = useRef<THREE.Group>(null)
  const anim = useRef({ token: -1, t: 1 })

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(grid * grid * 3)
    const col = new Float32Array(grid * grid * 3)
    const idx = new Uint32Array((grid - 1) * (grid - 1) * 6)
    let k = 0
    for (let j = 0; j < grid - 1; j++) {
      for (let i = 0; i < grid - 1; i++) {
        const a = j * grid + i
        idx[k++] = a
        idx[k++] = a + 1
        idx[k++] = a + grid + 1
        idx[k++] = a
        idx[k++] = a + grid + 1
        idx[k++] = a + grid
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.setIndex(new THREE.BufferAttribute(idx, 1))
    return g
  }, [grid])

  useEffect(() => () => geom.dispose(), [geom])

  useEffect(() => {
    const pos = geom.getAttribute('position') as THREE.BufferAttribute
    const col = geom.getAttribute('color') as THREE.BufferAttribute
    const pa = pos.array as Float32Array
    const ca = col.array as Float32Array
    const cPos = new THREE.Color(p.phasePos)
    const cNeg = new THREE.Color(p.phaseNeg)
    const cZero = new THREE.Color(p.bg)
    const scale = 1.6 / (data.max || 1)
    for (let j = 0; j < grid; j++) {
      for (let i = 0; i < grid; i++) {
        const v = data.arr[j * grid + i]!
        const o = (j * grid + i) * 3
        pa[o] = -PLANE / 2 + (PLANE * i) / (grid - 1)
        pa[o + 1] = showSquared ? v * v * scale * scale * 1.2 : v * scale
        pa[o + 2] = -PLANE / 2 + (PLANE * j) / (grid - 1)
        const t = Math.min(1, Math.abs(v) / (data.max || 1))
        const target = v >= 0 ? cPos : cNeg
        ca[o] = cZero.r + (target.r - cZero.r) * t
        ca[o + 1] = cZero.g + (target.g - cZero.g) * t
        ca[o + 2] = cZero.b + (target.b - cZero.b) * t
      }
    }
    pos.needsUpdate = true
    col.needsUpdate = true
    geom.computeVertexNormals()
    geom.computeBoundingSphere()
  }, [data, geom, grid, showSquared, p.phasePos, p.phaseNeg, p.bg])

  /**
   * 交换动画：绕对角线 (1,0,1)/√2 转 180°。
   * 这不是「示意」，而是交换算符在这张图上的**精确**几何作用：
   * 绕对角线转半圈，正是把 (x₁,x₂) 映到 (x₂,x₁) 并把高度取反。
   */
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    if (anim.current.token !== exchangeToken) {
      anim.current.token = exchangeToken
      anim.current.t = 0
    }
    if (anim.current.t < 1) {
      anim.current.t = Math.min(1, anim.current.t + dt / 1.1)
      const s = anim.current.t * anim.current.t * (3 - 2 * anim.current.t)
      if (groupRef.current) {
        groupRef.current.setRotationFromAxisAngle(
          new THREE.Vector3(1, 0, 1).normalize(),
          Math.PI * s,
        )
      }
    }
  })

  if (collapsed) {
    return (
      <SceneLabel position={[0, 0.6, 0]} tone="custom">
        <span style={{ color: p.danger, fontSize: 14 }}>Ψ ≡ 0：两个费米子不能占据同一个态</span>
      </SceneLabel>
    )
  }

  return (
    <group ref={groupRef}>
      <mesh geometry={geom}>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.55}
          metalness={0.05}
          flatShading={false}
        />
      </mesh>
    </group>
  )
}
