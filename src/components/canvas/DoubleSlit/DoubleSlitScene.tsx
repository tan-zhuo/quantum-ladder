import { useT } from '@/i18n/react'
import { translator, DEFAULT_LANG, type Lang } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { ControlGroup, Legend, CanvasStat, TimeBar, MiniPlot } from '../core/widgets'
import { Slider, Segmented, Toggle, Button } from '@/components/sim/controls'
import { PointCloud } from '../core/primitives'
import Tex from '@/components/math/Tex'
import { fieldPlane, makeSampler, screenIntensity, type SlitSetup } from '@/lib/quantum3d'

/**
 * 模块 01 主场景：双缝。
 *
 * 这个场景要回答的不是「光是波」，而是**单个**粒子一个一个打上去，
 * 为什么会累积出条纹。所以刻意做了两件事：
 *
 *   - 不画任何轨迹。粒子从源出发到打在屏上之间没有连线，因为那条线不存在；
 *     画了它就等于在教一个错误的图像。
 *   - 「观察哪条缝」是一个开关而不是一段动画。打开它，条纹当场消失；
 *     关掉它，条纹回来。这比任何文字都更能说明「获取路径信息」的代价。
 */

const SCREEN_Z = 9
const HALF_WIDTH = 3.2
const NX = 132
const NZ = 96
const MAX_HITS = 24000

/** 视角随屏距重新取景：L 可以从 2 拖到 16，固定视角会让屏跑出画面 */
function buildPresets(L: number): ViewPreset[] {
  const mid = L / 2
  const d = Math.max(9, L * 1.35)
  return [
    { id: 'iso', label: '等轴', position: [d * 0.62, d * 0.5, mid + d], target: [0, 0, mid], title: '同时看到波场与屏' },
    { id: 'top', label: '俯视', position: [0.01, d * 1.15, mid], target: [0, 0, mid], title: '俯视：干涉扇形最清楚' },
    { id: 'screen', label: '看屏', position: [0, 0.8, L + 5], target: [0, 0, L], title: '正对屏看条纹' },
    { id: 'side', label: '侧视', position: [d * 1.25, 1.6, mid], target: [0, 0, mid], title: '侧面看整条光路' },
  ]
}

/** 波场：一张显式的网格，用顶点色着色。省掉纹理坐标方向的来回试错。 */
function FieldMesh({ setup, visible }: { setup: SlitSetup; visible: boolean }) {
  const p = useScenePalette()
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(NX * NZ * 3)
    // 四分量顶点色：three 在 color 属性 itemSize = 4 时自动启用 USE_COLOR_ALPHA。
    // 低强度处直接透明，暗条纹之间才是真的「空」，而不是一张灰白的板子。
    const col = new Float32Array(NX * NZ * 4)
    const idx = new Uint32Array((NX - 1) * (NZ - 1) * 6)
    let k = 0
    for (let j = 0; j < NZ - 1; j++) {
      for (let i = 0; i < NX - 1; i++) {
        const a = j * NX + i
        const b = a + 1
        const c = a + NX + 1
        const d = a + NX
        idx[k++] = a
        idx[k++] = b
        idx[k++] = c
        idx[k++] = a
        idx[k++] = c
        idx[k++] = d
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 4))
    g.setIndex(new THREE.BufferAttribute(idx, 1))
    return g
  }, [])

  useEffect(() => () => geom.dispose(), [geom])

  // 网格顶点随屏距伸缩：拖动 L 时波场必须跟着一起变长，否则屏跑到了波场外面
  useEffect(() => {
    const attr = geom.getAttribute('position') as THREE.BufferAttribute
    const pos = attr.array as Float32Array
    for (let j = 0; j < NZ; j++) {
      for (let i = 0; i < NX; i++) {
        const o = (j * NX + i) * 3
        pos[o] = -HALF_WIDTH + (2 * HALF_WIDTH * i) / (NX - 1)
        pos[o + 1] = 0
        pos[o + 2] = (setup.screenDistance * (j + 0.5)) / NZ
      }
    }
    attr.needsUpdate = true
    geom.computeBoundingSphere()
  }, [geom, setup.screenDistance])

  useEffect(() => {
    if (!visible) return
    const { data } = fieldPlane(setup, { nx: NX, ny: NZ, yHalf: HALF_WIDTH })
    const col = geom.getAttribute('color') as THREE.BufferAttribute
    const arr = col.array as Float32Array
    const hot = new THREE.Color(p.real)
    for (let i = 0; i < NX * NZ; i++) {
      // γ 校正：强度线性映射的话，亮纹之外几乎看不出结构
      const t = Math.pow(Math.min(1, data[i]!), 0.55)
      arr[i * 4] = hot.r
      arr[i * 4 + 1] = hot.g
      arr[i * 4 + 2] = hot.b
      arr[i * 4 + 3] = t * 0.9
    }
    col.needsUpdate = true
  }, [setup, visible, geom, p.bg, p.real])

  if (!visible) return null
  return (
    <mesh geometry={geom}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} transparent depthWrite={false} />
    </mesh>
  )
}

/** 挡板：两片（或三片）不透光的板，中间留出缝 */
function Barrier({ setup, whichPath }: { setup: SlitSetup; whichPath: boolean }) {
  const p = useScenePalette()
  const T = useT()
  const half = setup.separation / 2
  const a = setup.slitWidth
  const H = 2.2
  const panels: { x: number; w: number }[] = []
  const left = -half - a / 2
  const right = half + a / 2
  panels.push({ x: (-HALF_WIDTH - 0.6 + left) / 2, w: left + HALF_WIDTH + 0.6 })
  panels.push({ x: 0, w: setup.separation - a })
  panels.push({ x: (right + HALF_WIDTH + 0.6) / 2, w: HALF_WIDTH + 0.6 - right })

  // 被堵住的缝：用一块和挡板同色的小板补上
  const blocked =
    setup.open === 'left' ? [half] : setup.open === 'right' ? [-half] : []

  return (
    <group position={[0, 0, 0]}>
      {panels.map((pan, i) =>
        pan.w > 0.001 ? (
          <mesh key={i} position={[pan.x, 0, 0]}>
            <boxGeometry args={[pan.w, H, 0.06]} />
            <meshStandardMaterial color={p.potential} roughness={0.7} metalness={0.1} />
          </mesh>
        ) : null,
      )}
      {blocked.map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[a, H, 0.06]} />
          <meshStandardMaterial color={p.potential} roughness={0.7} />
        </mesh>
      ))}
      {whichPath
        ? [-half, half].map((x) => (
            <mesh key={x} position={[x, 0.75, -0.28]}>
              <sphereGeometry args={[0.11, 16, 12]} />
              <meshStandardMaterial
                color={p.danger}
                emissive={p.danger}
                emissiveIntensity={0.5}
                roughness={0.3}
              />
            </mesh>
          ))
        : null}
      <SceneLabel position={[-HALF_WIDTH - 0.4, 1.4, 0]} tone="muted" size="xs">
        {T('挡板')}
      </SceneLabel>
    </group>
  )
}

/** 屏上的落点。逐帧按速率增加，drawRange 控制显示到第几个。 */
function Hits({
  positions,
  count,
  color,
  z,
}: {
  positions: Float32Array
  count: number
  color: string
  z: number
}) {
  return (
    <group position={[0, 0, z + 0.02]}>
      <PointCloud positions={positions} count={count} color={color} size={0.055} opacity={0.95} />
    </group>
  )
}

function Emitter({
  running,
  rate,
  speed,
  sampler,
  positions,
  countRef,
  onTick,
}: {
  running: boolean
  rate: number
  speed: number
  sampler: (u: number) => number
  positions: Float32Array
  countRef: React.MutableRefObject<number>
  onTick: (n: number) => void
}) {
  const acc = useRef(0)
  const report = useRef(0)
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    if (running) {
      acc.current += dt * rate * speed
      const add = Math.floor(acc.current)
      if (add > 0) {
        acc.current -= add
        let c = countRef.current
        for (let i = 0; i < add && c < MAX_HITS; i++) {
          const x = sampler(Math.random())
          // 屏的竖直方向没有结构（缝在这个方向上很长），所以均匀铺开
          const y = (Math.random() - 0.5) * 1.7
          positions[c * 3] = x
          positions[c * 3 + 1] = y
          positions[c * 3 + 2] = 0
          c += 1
        }
        countRef.current = c
      }
    }
    report.current += dt
    if (report.current > 0.1) {
      report.current = 0
      onTick(countRef.current)
    }
  })
  return null
}

export default function DoubleSlitScene({ lang = DEFAULT_LANG }: { lang?: Lang }) {
  const T = translator(lang)
  const p = useScenePalette()
  const apiRef = useRef<SceneApi | null>(null)

  const [lambda, setLambda] = useState(0.09)
  const [separation, setSeparation] = useState(0.7)
  const [slitWidth, setSlitWidth] = useState(0.18)
  const [screenDistance, setScreenDistance] = useState(SCREEN_Z)
  const [open, setOpen] = useState<'both' | 'left' | 'right'>('both')
  const [whichPath, setWhichPath] = useState(false)
  const [mode, setMode] = useState<'wave' | 'particle'>('particle')
  const [showField, setShowField] = useState(true)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [hitCount, setHitCount] = useState(0)

  const rate = 260

  const setup: SlitSetup = useMemo(
    () => ({ lambda, separation, slitWidth, screenDistance, open }),
    [lambda, separation, slitWidth, screenDistance, open],
  )

  /**
   * 「知道走了哪条缝」= 两条缝各自的强度**非相干**相加。
   * 这不是把干涉项手动删掉的作弊：一旦路径信息被环境记录，两条路径就不再相干，
   * 相干项的期望值本来就是零。模块 12 会把这件事讲成退相干。
   */
  const ys = useMemo(() => {
    const a = new Float64Array(801)
    for (let i = 0; i < a.length; i++) a[i] = -HALF_WIDTH + (2 * HALF_WIDTH * i) / (a.length - 1)
    return a
  }, [])

  const intensity = useMemo(() => {
    if (!whichPath || open !== 'both') return screenIntensity(setup, ys)
    const l = screenIntensity({ ...setup, open: 'left' }, ys)
    const r = screenIntensity({ ...setup, open: 'right' }, ys)
    const out = new Float64Array(ys.length)
    let max = 0
    for (let i = 0; i < ys.length; i++) {
      out[i] = l[i]! + r[i]!
      if (out[i]! > max) max = out[i]!
    }
    if (max > 0) for (let i = 0; i < ys.length; i++) out[i] = out[i]! / max
    return out
  }, [setup, ys, whichPath, open])

  const sampler = useMemo(() => makeSampler(ys, intensity), [ys, intensity])

  const positions = useMemo(() => new Float32Array(MAX_HITS * 3), [])
  const countRef = useRef(0)

  // 参数一变，之前累积的落点就不再属于同一个实验，必须清零
  const reset = () => {
    countRef.current = 0
    setHitCount(0)
  }
  useEffect(reset, [setup, whichPath])

  // 理论曲线与实测直方图
  const theoryPts = useMemo(() => {
    const pts: [number, number][] = []
    for (let i = 0; i < ys.length; i += 4) pts.push([(ys[i]! + HALF_WIDTH) / (2 * HALF_WIDTH), intensity[i]!])
    return pts
  }, [ys, intensity])

  const histogram = useMemo(() => {
    const bins = 96
    const counts = new Float64Array(bins)
    for (let i = 0; i < hitCount; i++) {
      const x = positions[i * 3]!
      const b = Math.floor(((x + HALF_WIDTH) / (2 * HALF_WIDTH)) * bins)
      if (b >= 0 && b < bins) counts[b] += 1
    }
    let max = 1
    for (let i = 0; i < bins; i++) max = Math.max(max, counts[i]!)
    const pts: [number, number][] = []
    for (let i = 0; i < bins; i++) pts.push([i / (bins - 1), counts[i]! / max])
    return pts
  }, [hitCount, positions])

  const presets = useMemo(() => buildPresets(screenDistance), [screenDistance])

  // 屏距变了就重新取景，沿用用户当前所在的那个预设方向
  const viewIdRef = useRef('iso')
  useEffect(() => {
    apiRef.current?.setView(viewIdRef.current || 'iso')
  }, [presets])

  const fringeSpacing = (lambda * screenDistance) / separation
  const screenLine = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i < ys.length; i += 4) {
      pts.push([ys[i]!, -1 + intensity[i]! * 1.5, screenDistance + 0.05])
    }
    return pts
  }, [ys, intensity, screenDistance])

  return (
    <SceneShell
      lang={lang}
      id="double-slit"
      title={T('双缝：一个一个打上去的粒子，怎么会长出条纹')}
      subtitle={T('屏上每一个亮点都是一次独立的探测。看着它们一颗颗落下，条纹是自己浮现出来的——没有任何一个粒子「知道」条纹在哪。')}
      apiRef={apiRef}
      height={560}
      controls={
        <>
          <ControlGroup title={T('实验模式')}>
            <Segmented
              value={mode}
              onChange={(v) => {
                setMode(v as 'wave' | 'particle')
                reset()
              }}
              options={[
                { value: 'particle', label: T('单粒子累积') },
                { value: 'wave', label: T('经典波') },
              ]}
            />
            <Segmented
              label={T('开着的缝')}
              value={open}
              onChange={(v) => setOpen(v as 'both' | 'left' | 'right')}
              options={[
                { value: 'both', label: T('双缝') },
                { value: 'left', label: T('只开左') },
                { value: 'right', label: T('只开右') },
              ]}
            />
            <Toggle
              label={T('在缝口安放探测器（知道走哪条）')}
              checked={whichPath}
              onChange={setWhichPath}
            />
          </ControlGroup>

          <ControlGroup title={T('参数')} hint={T('条纹间距 Δy = λL/d ≈ {0}', fringeSpacing.toFixed(2))}>
            <Slider label={T('波长 λ')} value={lambda} min={0.03} max={0.22} step={0.005} onChange={setLambda} />
            <Slider label={T('缝间距 d')} value={separation} min={0.25} max={1.8} step={0.01} onChange={setSeparation} />
            <Slider label={T('单缝宽 a')} value={slitWidth} min={0.05} max={0.5} step={0.01} onChange={setSlitWidth} />
            <Slider
              label={T('缝到屏距离 L')}
              value={screenDistance}
              min={2}
              max={16}
              step={0.1}
              onChange={setScreenDistance}
              hint={T('改变 L 只改变条纹的疏密，不改变干涉本身')}
            />
          </ControlGroup>

          {mode === 'particle' ? (
            <ControlGroup title={T('发射')}>
              <TimeBar
                playing={running}
                onPlay={setRunning}
                onReset={reset}
                speed={speed}
                onSpeed={setSpeed}
                timeLabel={T('{0} 个', hitCount)}
              />
              <div className="flex gap-1.5">
                <Button onClick={reset}>{T('清空屏幕')}</Button>
              </div>
            </ControlGroup>
          ) : null}

          <ControlGroup title={T('显示')}>
            <Toggle label={T('缝后的波场')} checked={showField} onChange={setShowField} />
          </ControlGroup>

          <ControlGroup title={T('屏上分布')}>
            <MiniPlot
              series={[
                { points: theoryPts, color: p.real },
                ...(mode === 'particle' && hitCount > 0
                  ? [{ points: histogram, color: p.hit, fill: true }]
                  : []),
              ]}
              height={76}
              ariaLabel={T('屏上的强度分布与实测直方图')}
            />
            <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">
              {T('细线是理论强度 I(y)，填充是实测落点直方图。粒子数越多，两者越贴合。')}
            </p>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="overflow-x-auto text-[15px]">
            <Tex>
              {whichPath && open === 'both'
                ? T('I(y) = |\\psi_1|^2 + |\\psi_2|^2 \\quad(\\text{干涉项消失})')
                : 'I(y) = |\\psi_1 + \\psi_2|^2 = |\\psi_1|^2 + |\\psi_2|^2 + 2\\,\\mathrm{Re}(\\psi_1^*\\psi_2)'}
            </Tex>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>Δy = λL/d = {fringeSpacing.toFixed(3)}</span>
            <span>{T('已探测 {0} 个', hitCount.toLocaleString())}</span>
            <span>
              {T('可见度')}{' '}
              {whichPath && open === 'both' ? T('0（无条纹）') : open === 'both' ? T('高') : T('单缝包络')}
            </span>
          </div>
          <Legend
            items={[
              { color: p.real, label: T('波场强度 / 理论 I(y)') },
              { color: p.hit, label: T('单个粒子的落点') },
              { color: p.potential, label: T('挡板与屏') },
              ...(whichPath ? [{ color: p.danger, label: T('路径探测器') }] : []),
            ]}
          />
        </div>
      }
      guide={[
        T('先什么都别动，盯着屏看 10 秒：前几十个点看上去毫无规律，几百个之后条纹开始浮现。这就是「概率」两个字的实际含义。'),
        T('切到「只开左」：条纹消失，只剩一个宽包络（单缝衍射）。再切回双缝——注意双缝的暗纹位置，恰恰是单缝时有粒子到达的地方。「多开一条缝反而让某些地方没有粒子」，经典粒子图像在这里彻底失效。'),
        T('打开「在缝口安放探测器」：条纹当场消失，分布变成两条缝各自贡献的简单叠加。关掉它，条纹回来。获取路径信息与看到干涉，二者不可兼得。'),
        T('拖动波长 λ 与缝距 d，验证 Δy = λL/d：λ 变大条纹变疏，d 变大条纹变密。'),
        T('切到「经典波」并用俯视视角：看缝后的波场如何从两个点源扩散、交叠、形成放射状的亮暗扇形。屏上的条纹只是这个扇形与屏的交线。'),
      ]}
      pitfalls={[
        {
          title: T('“粒子分裂了，一半走一条缝”'),
          body: T('不会。每次探测到的都是一个完整的粒子，从不是半个。干涉的是概率幅，不是粒子本身。'),
        },
        {
          title: T('“粒子之间互相干涉”'),
          body: T('把发射速率降到每秒一个、粒子在装置里绝不相遇，条纹照样出现。干涉发生在单个粒子的两条可能路径之间。'),
        },
        {
          title: T('“探测器把粒子撞歪了，所以条纹没了”'),
          body: T('这个解释在某些具体装置里成立，但不是本质。即使用不交换动量的方式获取路径信息，条纹同样消失。真正的原因是路径信息被环境记录后，两条路径不再相干。'),
        },
      ]}
      reflect={[
        T('把 λ 调到最小、d 调到最大，条纹密到几乎看不见。宏观物体（比如一颗子弹）的德布罗意波长约 10⁻³⁴ m，估算一下它的条纹间距，说明为什么我们从未在日常生活中见过干涉。'),
        T('若在两条缝后各放一个可以事后擦除的路径标记（量子擦除），条纹能否恢复？这对「测量在什么时刻发生」意味着什么？'),
        T('单缝包络的宽度由 a 决定，条纹间距由 d 决定。为什么这两个长度控制的是完全不同的两件事？'),
      ]}
    >
      <SceneCanvas
        presets={presets}
        apiRef={apiRef}
        onViewChange={(id) => (viewIdRef.current = id)}
        minDistance={3}
        maxDistance={60}
        overlay={
          <CanvasStat>
            {mode === 'particle' ? T('已探测 {0} 个粒子', hitCount.toLocaleString()) : T('经典波场')}
            {whichPath ? <span style={{ color: p.danger }} className="ml-2">{T('路径探测器：开')}</span> : null}
          </CanvasStat>
        }
      >
        {/* 源 */}
        <mesh position={[0, 0, -2.2]}>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={0.45} roughness={0.3} />
        </mesh>
        <SceneLabel position={[0, 0.42, -2.2]} tone="muted" size="xs">
          {T('源')}
        </SceneLabel>
        <Line
          points={[
            [0, 0, -2.05],
            [0, 0, -0.1],
          ]}
          color={p.accent}
          lineWidth={1.2}
          transparent
          opacity={0.35}
          dashed
          dashSize={0.12}
          gapSize={0.1}
        />

        <Barrier setup={setup} whichPath={whichPath} />

        <FieldMesh setup={setup} visible={showField} />

        {/* 屏 */}
        <mesh position={[0, 0, screenDistance]}>
          <planeGeometry args={[2 * HALF_WIDTH, 2]} />
          <meshStandardMaterial color={p.potential} roughness={0.9} side={THREE.DoubleSide} opacity={0.35} transparent />
        </mesh>
        <SceneLabel position={[HALF_WIDTH + 0.35, 0.9, screenDistance]} tone="muted" size="xs">
          {T('屏')}
        </SceneLabel>

        {/* 屏上的理论强度曲线：让「条纹」与「曲线」是同一件事 */}
        <Line points={screenLine} color={p.real} lineWidth={2} transparent opacity={0.9} />

        {mode === 'particle' ? (
          <>
            <Hits positions={positions} count={hitCount} color={p.hit} z={screenDistance} />
            <Emitter
              running={running}
              rate={rate}
              speed={speed}
              sampler={sampler}
              positions={positions}
              countRef={countRef}
              onTick={setHitCount}
            />
          </>
        ) : null}
      </SceneCanvas>
    </SceneShell>
  )
}
