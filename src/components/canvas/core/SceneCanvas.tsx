import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import { useScenePalette } from './theme'
import { useSceneStore, useQualityProfile } from './sceneStore'

/**
 * 所有 3D 场景的画布层。
 *
 * 它负责一切与「怎么看」有关的事：相机、预设视角、轨道控制、光照、背景色、
 * 剖切平面、帧率监控与自动降级、截图。场景组件只往里塞「看什么」。
 */

export interface ViewPreset {
  id: string
  label: string
  /** 相机位置 */
  position: [number, number, number]
  /** 注视点，默认原点 */
  target?: [number, number, number]
  /** 这个视角想让人看清什么，作为 tooltip */
  title?: string
}

export interface SceneApi {
  /** 回到默认视角 */
  resetView: () => void
  /** 切到指定预设视角 */
  setView: (id: string) => void
  /** 导出当前画面为 PNG dataURL */
  screenshot: () => string | null
}

interface SceneCanvasProps {
  presets: ViewPreset[]
  /** 默认视角 id，缺省用第一个 */
  defaultPreset?: string
  fov?: number
  children: ReactNode
  /** 场景暴露给外壳的命令接口 */
  apiRef?: MutableRefObject<SceneApi | null>
  /** 剖切平面；传入即启用局部剖切 */
  clippingPlanes?: THREE.Plane[]
  /** 轨道控制的距离范围 */
  minDistance?: number
  maxDistance?: number
  /** 关掉平移（有些场景平移出去就看不懂了） */
  enablePan?: boolean
  /** 画布右下角的额外 HTML 覆盖层 */
  overlay?: ReactNode
  /** 极角限制，避免转到「地板下面」看不懂的角度 */
  polarLimits?: [number, number]
  /** 当前预设视角变化时回调（用户手动拖动时传空串） */
  onViewChange?: (id: string) => void
}

/** 相机动画：切预设视角时平滑飞过去，而不是瞬移——瞬移会让人失去方位感。 */
function CameraRig({
  goal,
  controlsRef,
}: {
  goal: { position: THREE.Vector3; target: THREE.Vector3; token: number } | null
  controlsRef: MutableRefObject<any>
}) {
  const { camera } = useThree()
  const anim = useRef<{ from: THREE.Vector3; fromT: THREE.Vector3; t: number } | null>(null)
  const lastToken = useRef(-1)

  useFrame((_, dt) => {
    if (!goal) return
    const controls = controlsRef.current
    if (goal.token !== lastToken.current) {
      lastToken.current = goal.token
      anim.current = {
        from: camera.position.clone(),
        fromT: controls ? controls.target.clone() : new THREE.Vector3(),
        t: 0,
      }
    }
    const a = anim.current
    if (!a) return
    a.t = Math.min(1, a.t + dt / 0.55)
    // smoothstep：起止都没有速度突变，看起来像镜头运动而不是弹跳
    const s = a.t * a.t * (3 - 2 * a.t)
    camera.position.lerpVectors(a.from, goal.position, s)
    if (controls) {
      controls.target.lerpVectors(a.fromT, goal.target, s)
      controls.update()
    }
    if (a.t >= 1) anim.current = null
  })
  return null
}

/**
 * 帧率监控 + 自动降级。
 *
 * 判据刻意保守：连续两个统计窗口（各 1 秒）平均帧率低于 35 才降一档。
 * 只看瞬时帧率会被首次编译着色器、切换轨道这类一次性尖峰误伤，
 * 用户会莫名其妙看到点云突然变稀。
 */
function PerfGovernor() {
  const setFps = useSceneStore((s) => s.setFps)
  const degrade = useSceneStore((s) => s.degrade)
  const acc = useRef({ frames: 0, time: 0, badWindows: 0 })

  useFrame((_, dt) => {
    const a = acc.current
    a.frames += 1
    a.time += dt
    if (a.time >= 1) {
      const fps = a.frames / a.time
      setFps(Math.round(fps))
      if (fps < 35) {
        a.badWindows += 1
        if (a.badWindows >= 2) {
          degrade()
          a.badWindows = 0
        }
      } else {
        a.badWindows = 0
      }
      a.frames = 0
      a.time = 0
    }
  })
  return null
}

function Lights({ rich }: { rich: boolean }) {
  return (
    <>
      <ambientLight intensity={rich ? 0.65 : 0.9} />
      <directionalLight position={[6, 10, 8]} intensity={rich ? 1.0 : 0.6} />
      <directionalLight position={[-8, -4, -6]} intensity={0.35} />
    </>
  )
}

/** 把剖切平面接到渲染器上（three 的局部剖切必须显式打开） */
function ClipSetup({ planes }: { planes?: THREE.Plane[] }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.localClippingEnabled = !!planes && planes.length > 0
  }, [gl, planes])
  return null
}

export function SceneCanvas(props: SceneCanvasProps) {
  const {
    presets,
    defaultPreset,
    fov = 45,
    children,
    apiRef,
    clippingPlanes,
    minDistance = 1,
    maxDistance = 400,
    enablePan = true,
    overlay,
    polarLimits,
    onViewChange,
  } = props

  const palette = useScenePalette()
  const profile = useQualityProfile()
  const controlsRef = useRef<any>(null)
  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)

  const initialId = defaultPreset ?? presets[0]!.id
  const [activeId, setActiveId] = useState(initialId)
  const [goal, setGoal] = useState<{
    position: THREE.Vector3
    target: THREE.Vector3
    token: number
  } | null>(null)
  const tokenRef = useRef(0)

  const initial = presets.find((p) => p.id === initialId) ?? presets[0]!

  const applyPreset = useCallback(
    (id: string) => {
      const p = presets.find((x) => x.id === id)
      if (!p) return
      setActiveId(id)
      onViewChange?.(id)
      tokenRef.current += 1
      setGoal({
        position: new THREE.Vector3(...p.position),
        target: new THREE.Vector3(...(p.target ?? [0, 0, 0])),
        token: tokenRef.current,
      })
    },
    [presets, onViewChange],
  )

  useEffect(() => {
    if (!apiRef) return
    apiRef.current = {
      resetView: () => applyPreset(initialId),
      setView: applyPreset,
      screenshot: () => {
        const gl = glRef.current
        const scene = sceneRef.current
        const cam = cameraRef.current
        if (!gl || !scene || !cam) return null
        // 必须现渲一帧再读像素：R3F 默认是按需渲染，缓冲区里可能是上一帧甚至空的
        gl.render(scene, cam)
        return gl.domElement.toDataURL('image/png')
      },
    }
    return () => {
      apiRef.current = null
    }
  }, [apiRef, applyPreset, initialId])

  // 轨道被手动拖动后，取消预设高亮——否则按钮会一直亮着，暗示当前是那个视角
  const onUserControl = useCallback(() => {
    setActiveId('')
    onViewChange?.('')
  }, [onViewChange])

  const bg = useMemo(() => new THREE.Color(palette.bg), [palette.bg])

  /**
   * 服务端渲染时不挂 <Canvas>。
   *
   * R3F 的 Canvas 依赖真实 DOM 尺寸测量，在 Astro 的构建期 SSR 里会直接抛错。
   * 用 client:only 也能绕开，但那样整页的场景 JS 会在首屏一次性全部加载。
   * 这里让服务端只输出一块占位骨架，客户端可见时再水合、再建 WebGL 上下文，
   * 既保住 client:visible 的懒加载，也不会有布局跳动。
   */
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="grid h-full w-full place-items-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-2 text-[var(--text-faint)]">
          <div className="size-8 animate-pulse rounded-full border-2 border-current opacity-40" />
          <p className="text-[12px]">3D 场景加载中…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={profile.dpr}
        gl={{
          antialias: true,
          // 截图功能要求保留绘图缓冲区；代价是移动端多一份显存，可以接受
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: initial.position, fov, near: 0.01, far: 2000 }}
        onCreated={({ gl, scene, camera }) => {
          glRef.current = gl
          sceneRef.current = scene
          cameraRef.current = camera
          if (initial.target) camera.lookAt(new THREE.Vector3(...initial.target))
        }}
      >
        <color attach="background" args={[bg.r, bg.g, bg.b]} />
        <Lights rich={profile.rich} />
        <ClipSetup planes={clippingPlanes} />
        <PerfGovernor />
        <CameraRig goal={goal} controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={enablePan}
          enableDamping
          dampingFactor={0.08}
          minDistance={minDistance}
          maxDistance={maxDistance}
          minPolarAngle={polarLimits?.[0]}
          maxPolarAngle={polarLimits?.[1]}
          target={initial.target ?? [0, 0, 0]}
          onStart={onUserControl}
        />
        {children}
      </Canvas>

      {/* 视角预设条：叠在画布左上角，不占版面 */}
      <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.title}
            onClick={() => applyPreset(p.id)}
            className={
              'pointer-events-auto rounded-md border px-2 py-1 text-[11.5px] font-medium backdrop-blur-sm transition-colors ' +
              (activeId === p.id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                : 'border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_78%,transparent)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]')
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
    </div>
  )
}

/**
 * 场景内的文字标注。统一走 DOM 而不是 troika 的 3D 文字：
 * 中文字形文件有好几 MB，而且 troika 默认要去 CDN 拉字体——离线 PWA 下会变成方块。
 * DOM 标注还能直接复用站点的字体与主题变量，缩放时永远清晰。
 */
export function SceneLabel({
  position,
  children,
  tone = 'ink',
  size = 'sm',
  offset,
}: {
  position: [number, number, number]
  children: ReactNode
  tone?: 'ink' | 'muted' | 'accent' | 'custom'
  size?: 'xs' | 'sm'
  /** 屏幕空间偏移（px），避免标注压在几何体上。用 margin 实现——
   *  drei 的 <Html center> 靠内层 div 的 transform 居中，这里再写 transform 会把它顶掉。 */
  offset?: [number, number]
}) {
  const labels = useSceneStore((s) => s.labels)
  const palette = useScenePalette()
  if (!labels) return null
  const color =
    tone === 'accent' ? palette.accent : tone === 'muted' ? palette.muted : tone === 'ink' ? palette.ink : undefined
  return (
    <Html
      position={position}
      center
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        fontSize: size === 'xs' ? '10.5px' : '12px',
        lineHeight: 1.2,
        fontWeight: 500,
        color,
        marginLeft: offset?.[0],
        marginTop: offset?.[1],
        textShadow: '0 1px 3px color-mix(in srgb, var(--bg) 85%, transparent)',
      }}
    >
      {children}
    </Html>
  )
}
