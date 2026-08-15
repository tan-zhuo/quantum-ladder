import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { useScenePalette } from '../core/theme'
import { SceneLabel } from '../core/SceneCanvas'

/**
 * Bloch 球的"外壳"：球面、三条大圆、坐标轴与六个基态标注。
 *
 * 单独拆出来是因为它会被三个场景复用（自旋、测量投影、退相干）——
 * 三处必须长得完全一样，学习者才会认为它们讲的是同一个几何对象。
 */

/** 生成一个大圆的点列（法向为 normal 的单位圆） */
export function circlePoints(
  normal: [number, number, number],
  radius = 1,
  segments = 128,
  center: [number, number, number] = [0, 0, 0],
): [number, number, number][] {
  const n = new THREE.Vector3(...normal).normalize()
  // 找一个与 n 不平行的向量做起点，构造正交基
  const ref = Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
  const u = new THREE.Vector3().crossVectors(ref, n).normalize()
  const v = new THREE.Vector3().crossVectors(n, u)
  const pts: [number, number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    const c = Math.cos(a) * radius
    const s = Math.sin(a) * radius
    pts.push([
      center[0] + u.x * c + v.x * s,
      center[1] + u.y * c + v.y * s,
      center[2] + u.z * c + v.z * s,
    ])
  }
  return pts
}

export function BlochFrame({
  radius = 1,
  showLabels = true,
  showLatLong = true,
}: {
  radius?: number
  showLabels?: boolean
  showLatLong?: boolean
}) {
  const p = useScenePalette()

  // 经纬网：只画几条，密了会盖住状态矢量
  const latLong = useMemo(() => {
    if (!showLatLong) return []
    const out: [number, number, number][][] = []
    for (const lat of [-60, -30, 30, 60]) {
      const r = Math.cos((lat * Math.PI) / 180) * radius
      const y = Math.sin((lat * Math.PI) / 180) * radius
      out.push(circlePoints([0, 1, 0], r, 72, [0, y, 0]))
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI
      out.push(circlePoints([Math.cos(a), 0, Math.sin(a)], radius, 72))
    }
    return out
  }, [radius, showLatLong])

  const equator = useMemo(() => circlePoints([0, 1, 0], radius), [radius])
  const meridianXZ = useMemo(() => circlePoints([0, 0, 1], radius), [radius])
  const meridianYZ = useMemo(() => circlePoints([1, 0, 0], radius), [radius])

  const axisEnd = radius * 1.18

  return (
    <group>
      {/* 球体本身：极低不透明度，只用来提供"这是个球"的体积感与深度遮挡 */}
      <mesh>
        <sphereGeometry args={[radius * 0.995, 64, 48]} />
        <meshStandardMaterial
          color={p.accent}
          transparent
          opacity={0.06}
          roughness={0.9}
          metalness={0}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {latLong.map((pts, i) => (
        <Line key={i} points={pts} color={p.grid} lineWidth={1} transparent opacity={0.5} />
      ))}

      <Line points={equator} color={p.axis} lineWidth={1.6} transparent opacity={0.85} />
      <Line points={meridianXZ} color={p.axis} lineWidth={1.2} transparent opacity={0.5} />
      <Line points={meridianYZ} color={p.axis} lineWidth={1.2} transparent opacity={0.5} />

      {/* 三条坐标轴 */}
      <Line points={[[0, -axisEnd, 0], [0, axisEnd, 0]]} color={p.axis} lineWidth={1.2} transparent opacity={0.7} />
      <Line points={[[-axisEnd, 0, 0], [axisEnd, 0, 0]]} color={p.axis} lineWidth={1.2} transparent opacity={0.55} />
      <Line points={[[0, 0, -axisEnd], [0, 0, axisEnd]]} color={p.axis} lineWidth={1.2} transparent opacity={0.55} />

      {showLabels ? (
        <>
          <SceneLabel position={[0, axisEnd + 0.1, 0]} tone="ink">
            |0⟩　<span style={{ opacity: 0.6 }}>+z</span>
          </SceneLabel>
          <SceneLabel position={[0, -axisEnd - 0.1, 0]} tone="ink">
            |1⟩　<span style={{ opacity: 0.6 }}>−z</span>
          </SceneLabel>
          <SceneLabel position={[axisEnd + 0.12, 0, 0]} tone="muted">
            |+⟩　<span style={{ opacity: 0.6 }}>+x</span>
          </SceneLabel>
          <SceneLabel position={[-axisEnd - 0.12, 0, 0]} tone="muted">
            |−⟩
          </SceneLabel>
          <SceneLabel position={[0, 0, axisEnd + 0.12]} tone="muted">
            |+i⟩　<span style={{ opacity: 0.6 }}>+y</span>
          </SceneLabel>
          <SceneLabel position={[0, 0, -axisEnd - 0.12]} tone="muted">
            |−i⟩
          </SceneLabel>
        </>
      ) : null}
    </group>
  )
}
