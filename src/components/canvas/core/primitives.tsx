import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useScenePalette } from './theme'
import { SceneLabel } from './SceneCanvas'

/**
 * 场景共用的三维图元。
 *
 * 这里的东西都遵循一条规则：**几何体只建一次，之后逐帧原地改缓冲区**。
 * 时间演化类场景每帧都要重画上千个顶点，如果每帧新建 BufferGeometry，
 * 中低端机器上会被 GC 拖到 20 fps 以下——那正是验收标准第 5 条要防的事。
 */

// ── 圆点贴图（点云用） ─────────────────────────────────────

let spriteCache: THREE.Texture | null = null

/** 一张软边圆点贴图。整站共用一张，避免每个场景各生成一份纹理。 */
export function dotSprite(): THREE.Texture {
  if (spriteCache) return spriteCache
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.85)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  spriteCache = tex
  return tex
}

// ── 管：把一条三维曲线画成有体积的管子 ──────────────────────

export interface TubeHandle {
  /** centers: [x,y,z, …] 共 n 个点；就地更新顶点 */
  update: (centers: Float32Array | number[], radius?: number) => void
  geometry: THREE.BufferGeometry
}

/**
 * 建一个固定拓扑的管状几何体，顶点数 = 段数 × 截面边数。
 * 之后 update() 只写 position/normal 的 Float32Array，不重建任何对象。
 */
export function createTube(segments: number, sides = 8): TubeHandle {
  const geom = new THREE.BufferGeometry()
  const vertCount = segments * sides
  const position = new Float32Array(vertCount * 3)
  const normal = new Float32Array(vertCount * 3)
  const index = new Uint32Array((segments - 1) * sides * 6)

  let k = 0
  for (let i = 0; i < segments - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const j2 = (j + 1) % sides
      const a = i * sides + j
      const b = i * sides + j2
      const c = (i + 1) * sides + j2
      const d = (i + 1) * sides + j
      index[k++] = a
      index[k++] = b
      index[k++] = c
      index[k++] = a
      index[k++] = c
      index[k++] = d
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geom.setAttribute('normal', new THREE.BufferAttribute(normal, 3))
  geom.setIndex(new THREE.BufferAttribute(index, 1))

  // 复用的临时向量：逐帧调用，不能在里面 new
  const tangent = new THREE.Vector3()
  const normalRef = new THREE.Vector3()
  const binormal = new THREE.Vector3()
  const prev = new THREE.Vector3()
  const cur = new THREE.Vector3()
  const next = new THREE.Vector3()

  function update(centers: Float32Array | number[], radius = 0.03) {
    const n = segments
    // 平行输运标架：逐点把上一段的法向投影到当前截面上。
    // 直接用 Frenet 标架的话，曲线出现拐点时法向会瞬间翻转，管子看起来像被拧了一下。
    for (let i = 0; i < n; i++) {
      cur.set(centers[i * 3]!, centers[i * 3 + 1]!, centers[i * 3 + 2]!)
      const ip = Math.max(0, i - 1)
      const inx = Math.min(n - 1, i + 1)
      prev.set(centers[ip * 3]!, centers[ip * 3 + 1]!, centers[ip * 3 + 2]!)
      next.set(centers[inx * 3]!, centers[inx * 3 + 1]!, centers[inx * 3 + 2]!)
      tangent.subVectors(next, prev)
      if (tangent.lengthSq() < 1e-20) tangent.set(1, 0, 0)
      tangent.normalize()

      if (i === 0) {
        // 起点：挑一个与切向差别最大的坐标轴做初始法向
        const ax = Math.abs(tangent.x)
        const ay = Math.abs(tangent.y)
        const az = Math.abs(tangent.z)
        normalRef.set(0, 0, 0)
        if (ax <= ay && ax <= az) normalRef.x = 1
        else if (ay <= az) normalRef.y = 1
        else normalRef.z = 1
      }
      // 把参考法向正交化到当前截面
      binormal.copy(tangent).multiplyScalar(normalRef.dot(tangent))
      normalRef.sub(binormal)
      if (normalRef.lengthSq() < 1e-12) normalRef.set(tangent.y, -tangent.x, 0)
      normalRef.normalize()
      binormal.crossVectors(tangent, normalRef)

      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const nx = normalRef.x * ca + binormal.x * sa
        const ny = normalRef.y * ca + binormal.y * sa
        const nz = normalRef.z * ca + binormal.z * sa
        const o = (i * sides + j) * 3
        position[o] = cur.x + nx * radius
        position[o + 1] = cur.y + ny * radius
        position[o + 2] = cur.z + nz * radius
        normal[o] = nx
        normal[o + 1] = ny
        normal[o + 2] = nz
      }
    }
    geom.attributes.position!.needsUpdate = true
    geom.attributes.normal!.needsUpdate = true
    geom.computeBoundingSphere()
  }

  return { update, geometry: geom }
}

export interface CurtainHandle {
  /** tops: [x,y,z…] 曲线上的点；bases 缺省时取 y = baseY 的投影 */
  update: (tops: Float32Array | number[], baseY?: number) => void
  geometry: THREE.BufferGeometry
}

/**
 * 「幕布」：从基线拉到曲线的一层薄片，用来画 |ψ|²、势能这类「面积有意义」的量。
 * 在三维里比裸曲线读数快得多——一眼就能比出哪块概率更大。
 */
export function createCurtain(segments: number): CurtainHandle {
  const geom = new THREE.BufferGeometry()
  const position = new Float32Array(segments * 2 * 3)
  const normal = new Float32Array(segments * 2 * 3)
  const index = new Uint32Array((segments - 1) * 6)
  let k = 0
  for (let i = 0; i < segments - 1; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const c = (i + 1) * 2 + 1
    const d = (i + 1) * 2
    index[k++] = a
    index[k++] = b
    index[k++] = c
    index[k++] = a
    index[k++] = c
    index[k++] = d
  }
  geom.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geom.setAttribute('normal', new THREE.BufferAttribute(normal, 3))
  geom.setIndex(new THREE.BufferAttribute(index, 1))

  function update(tops: Float32Array | number[], baseY = 0) {
    for (let i = 0; i < segments; i++) {
      const x = tops[i * 3]!
      const y = tops[i * 3 + 1]!
      const z = tops[i * 3 + 2]!
      const o = i * 6
      position[o] = x
      position[o + 1] = baseY
      position[o + 2] = z
      position[o + 3] = x
      position[o + 4] = y
      position[o + 5] = z
      // 幕布是竖直的，法向统一朝 +z / −z 由双面材质处理
      normal[o] = 0
      normal[o + 1] = 0
      normal[o + 2] = 1
      normal[o + 3] = 0
      normal[o + 4] = 0
      normal[o + 5] = 1
    }
    geom.attributes.position!.needsUpdate = true
    geom.computeBoundingSphere()
  }

  return { update, geometry: geom }
}

export interface PolylineHandle {
  update: (points: Float32Array | number[]) => void
  geometry: THREE.BufferGeometry
}

/**
 * 固定顶点数的折线，逐帧原地更新。
 * 用于「影子」这类次要曲线：drei 的 <Line> 线宽好看但每帧重建几何体，
 * 主角用它值得，配角用它就浪费了。
 */
export function createPolyline(count: number): PolylineHandle {
  const geom = new THREE.BufferGeometry()
  const position = new Float32Array(count * 3)
  geom.setAttribute('position', new THREE.BufferAttribute(position, 3))
  function update(points: Float32Array | number[]) {
    for (let i = 0; i < count * 3; i++) position[i] = points[i] ?? 0
    geom.attributes.position!.needsUpdate = true
    geom.computeBoundingSphere()
  }
  return { update, geometry: geom }
}

// ── 坐标轴 ────────────────────────────────────────────────

export function Axis({
  from,
  to,
  color,
  label,
  labelOffset = [0, 0],
  width = 1.5,
  dashed = false,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color?: string
  label?: ReactNode
  labelOffset?: [number, number]
  width?: number
  dashed?: boolean
}) {
  const palette = useScenePalette()
  const c = color ?? palette.axis
  return (
    <>
      <Line
        points={[from, to]}
        color={c}
        lineWidth={width}
        dashed={dashed}
        dashSize={0.12}
        gapSize={0.09}
        transparent
        opacity={0.9}
      />
      {label ? (
        <SceneLabel position={to} tone="muted" offset={labelOffset}>
          {label}
        </SceneLabel>
      ) : null}
    </>
  )
}

/** 一个平面上的方格网，给三维空间一个可读的比例尺 */
export function GridPlane({
  size,
  divisions,
  plane = 'xz',
  y = 0,
  color,
  opacity = 0.5,
}: {
  size: number
  divisions: number
  plane?: 'xz' | 'xy'
  y?: number
  color?: string
  opacity?: number
}) {
  const palette = useScenePalette()
  const geom = useMemo(() => {
    const pts: number[] = []
    const step = (2 * size) / divisions
    for (let i = 0; i <= divisions; i++) {
      const t = -size + i * step
      if (plane === 'xz') {
        pts.push(-size, y, t, size, y, t)
        pts.push(t, y, -size, t, y, size)
      } else {
        pts.push(-size, t, 0, size, t, 0)
        pts.push(t, -size, 0, t, size, 0)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [size, divisions, plane, y])

  useEffect(() => () => geom.dispose(), [geom])

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color={color ?? palette.grid} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  )
}

// ── 箭头 ──────────────────────────────────────────────────

/**
 * 从原点指向 dir 的箭头。自旋、磁场、Bloch 矢量都用它，
 * 保证「箭头 = 一个有方向的物理量」这条视觉约定在全站一致。
 */
export function Arrow({
  dir,
  origin = [0, 0, 0],
  length = 1,
  color,
  radius = 0.018,
  headLength = 0.12,
  headRadius = 0.045,
  opacity = 1,
}: {
  dir: [number, number, number]
  origin?: [number, number, number]
  length?: number
  color: string
  radius?: number
  headLength?: number
  headRadius?: number
  opacity?: number
}) {
  const group = useRef<THREE.Group>(null)
  const v = useMemo(() => new THREE.Vector3(...dir), [dir])
  const quat = useMemo(() => {
    const q = new THREE.Quaternion()
    const n = v.clone()
    if (n.lengthSq() < 1e-12) n.set(0, 1, 0)
    n.normalize()
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n)
    return q
  }, [v])

  const shaft = Math.max(0.001, length - headLength)

  return (
    <group ref={group} position={origin} quaternion={quat}>
      <mesh position={[0, shaft / 2, 0]}>
        <cylinderGeometry args={[radius, radius, shaft, 12]} />
        <meshStandardMaterial
          color={color}
          transparent={opacity < 1}
          opacity={opacity}
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, shaft + headLength / 2, 0]}>
        <coneGeometry args={[headRadius, headLength, 16]} />
        <meshStandardMaterial
          color={color}
          transparent={opacity < 1}
          opacity={opacity}
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>
    </group>
  )
}

// ── 点云 ──────────────────────────────────────────────────

export interface PointCloudProps {
  positions: Float32Array
  colors?: Float32Array
  color?: string
  size?: number
  opacity?: number
  /** 只画前 count 个点（用于逐个累积的动画） */
  count?: number
  sizeAttenuation?: boolean
  clippingPlanes?: THREE.Plane[]
  /**
   * 顶点每帧都在动（粒子束这类）时打开：每帧标记一次 needsUpdate。
   * 默认关闭——静态点云（氢原子概率云）逐帧重传几十万个 float 是纯浪费。
   */
  dynamic?: boolean
}

/** 通用点云。氢原子概率云、双缝屏上的粒子落点都用它。 */
export function PointCloud({
  positions,
  colors,
  color = '#ffffff',
  size = 0.06,
  opacity = 0.55,
  count,
  sizeAttenuation = true,
  clippingPlanes,
  dynamic = false,
}: PointCloudProps) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const sprite = useMemo(() => dotSprite(), [])

  useFrame(() => {
    if (!dynamic) return
    const g = geomRef.current
    if (!g) return
    const pos = g.getAttribute('position')
    if (pos) pos.needsUpdate = true
    const col = g.getAttribute('color')
    if (col) col.needsUpdate = true
  })

  useEffect(() => {
    const g = geomRef.current
    if (!g) return
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    if (colors) g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    else g.deleteAttribute('color')
    g.computeBoundingSphere()
  }, [positions, colors])

  useEffect(() => {
    const g = geomRef.current
    if (!g) return
    g.setDrawRange(0, count ?? positions.length / 3)
    // count 变化意味着调用方刚往同一块 Float32Array 里追加了新点（逐帧显影的场景）。
    // 缓冲区对象没变，React 不会重新走上面那个 effect，所以必须在这里显式要求重传。
    const pos = g.getAttribute('position')
    if (pos) pos.needsUpdate = true
    const col = g.getAttribute('color')
    if (col) col.needsUpdate = true
  }, [count, positions])

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial
        map={sprite}
        color={color}
        size={size}
        sizeAttenuation={sizeAttenuation}
        transparent
        opacity={opacity}
        // 关掉深度写入：半透明点云互相遮挡时不会出现按绘制顺序切掉一半的黑边
        depthWrite={false}
        vertexColors={!!colors}
        alphaTest={0.01}
        clippingPlanes={clippingPlanes}
        clipShadows
      />
    </points>
  )
}

// ── 常用小组件 ────────────────────────────────────────────

/** 一段实心曲线（静态几何，参数变化时才重建） */
export function StaticCurve({
  points,
  color,
  width = 2,
  dashed = false,
  opacity = 1,
}: {
  points: [number, number, number][]
  color: string
  width?: number
  dashed?: boolean
  opacity?: number
}) {
  if (points.length < 2) return null
  return (
    <Line
      points={points}
      color={color}
      lineWidth={width}
      dashed={dashed}
      dashSize={0.15}
      gapSize={0.1}
      transparent={opacity < 1}
      opacity={opacity}
    />
  )
}

/** 半透明的参考平面（剖切位置、屏幕、势垒边界） */
export function Plane({
  width,
  height,
  position,
  rotation,
  color,
  opacity = 0.12,
}: {
  width: number
  height: number
  position: [number, number, number]
  rotation?: [number, number, number]
  color: string
  opacity?: number
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
