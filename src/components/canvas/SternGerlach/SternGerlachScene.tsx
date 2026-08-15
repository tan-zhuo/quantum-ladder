import { useCallback, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { useQualityProfile } from '../core/sceneStore'
import { ControlGroup, Legend, CanvasStat, TimeBar, ProbabilityBar } from '../core/widgets'
import { Segmented, Button, Slider } from '@/components/sim/controls'
import { PointCloud } from '../core/primitives'
import Tex from '@/components/math/Tex'
import { measureProbability } from '@/lib/quantum3d'

/**
 * 模块 05 / 07 辅助场景：串联 Stern-Gerlach。
 *
 * 这个装置的教学价值全在「串联」两个字上。单台仪器只说明自旋是量子化的；
 * 把三台串起来、中间换一次测量轴，才能看到第三台里重新冒出本已被筛掉的成分——
 * 那一刻「测量只是读取既有属性」这个念头才真正死掉。
 *
 * 每个飞过去的点都是一个真实抽样：到达分析器时按 P± = (1 ± r⃗·n̂)/2 掷一次骰子，
 * 然后自旋态被置成对应的本征态。屏上的计数是这些抽样的直接统计。
 */

type Axis = 'z' | 'x'
type Block = 'none' | 'plus' | 'minus'

/** 量子化轴在 three 坐标里的方向；同时也是该分析器让粒子偏转的方向 */
const AXIS_VEC: Record<Axis, [number, number, number]> = {
  z: [0, 1, 0], // 沿世界 y 上下分开
  x: [0, 0, 1], // 沿世界 z 左右分开
}

const STAGE_X = [-3.4, -0.4, 2.6]
const MAX_PARTICLES = 900
const SCREEN_X = 5.6
const SOURCE_X = -5.8
/** 束流速度：让一个原子约 1.6 秒穿过整套装置 */
const BEAM_V = 7.2

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [4, 6, 15], title: '看整条装置' },
  { id: 'side', label: '侧视', position: [0, 0.6, 16], title: '正对 Z 方向的分束' },
  { id: 'top', label: '俯视', position: [0, 16, 0.01], title: '俯视：看 X 方向的分束' },
  { id: 'screen', label: '看屏', position: [SCREEN_X + 5, 0.8, 0.01], target: [SCREEN_X, 0, 0], title: '正对屏数点' },
]

interface Particle {
  alive: boolean
  x: number
  y: number
  z: number
  vy: number
  vz: number
  /** 自旋态的 Bloch 矢量（three 坐标） */
  r: [number, number, number]
  stage: number
  /** 最近一次测量结果：0 = 还没被测过 */
  outcome: 0 | 1 | -1
}

interface StageConfig {
  axis: Axis
  block: Block
}

export default function SternGerlachScene() {
  const p = useScenePalette()
  const profile = useQualityProfile()
  const apiRef = useRef<SceneApi | null>(null)

  const [stageCount, setStageCount] = useState(3)
  const [stages, setStages] = useState<StageConfig[]>([
    { axis: 'z', block: 'minus' },
    { axis: 'x', block: 'minus' },
    { axis: 'z', block: 'none' },
  ])
  const [rate, setRate] = useState(60)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [counts, setCounts] = useState({ plus: 0, minus: 0, blocked: 0 })

  const setStage = useCallback((i: number, patch: Partial<StageConfig>) => {
    setStages((s) => s.map((st, k) => (k === i ? { ...st, ...patch } : st)))
  }, [])

  const positions = useMemo(() => new Float32Array(MAX_PARTICLES * 3), [])
  const colors = useMemo(() => new Float32Array(MAX_PARTICLES * 3), [])
  const pool = useMemo<Particle[]>(
    () =>
      Array.from({ length: MAX_PARTICLES }, () => ({
        alive: false,
        x: 0,
        y: 0,
        z: 0,
        vy: 0,
        vz: 0,
        r: [0, 0, 0] as [number, number, number],
        stage: 0,
        outcome: 0 as 0 | 1 | -1,
      })),
    [],
  )

  // 屏上的落点（累积）
  const hits = useMemo(() => new Float32Array(20000 * 3), [])
  const hitCount = useRef(0)
  const [hitTick, setHitTick] = useState(0)

  const reset = useCallback(() => {
    for (const q of pool) q.alive = false
    hitCount.current = 0
    setHitTick(0)
    setCounts({ plus: 0, minus: 0, blocked: 0 })
  }, [pool])

  const activeStages = stages.slice(0, stageCount)
  const total = counts.plus + counts.minus
  const fraction = total > 0 ? counts.plus / total : 0

  /** 最后一台分析器的输出该不该是五五开？给读数区一句解释 */
  const expectation = useMemo(() => {
    if (activeStages.length < 2) return null
    const last = activeStages[activeStages.length - 1]!
    const prev = activeStages[activeStages.length - 2]!
    if (last.axis === prev.axis) return '与前一台同轴：结果必然重复，只有一束'
    return '与前一台正交：五五开——前面筛掉的成分又回来了'
  }, [activeStages])

  return (
    <SceneShell
      id="stern-gerlach"
      title="串联 Stern-Gerlach：测量不是「看一眼」"
      subtitle="每个飞过的点都是一个真实抽样。把第二台换成 X 轴，再用第三台测 Z——你会看到第一台明明筛干净的那一束又回来了。"
      apiRef={apiRef}
      height={520}
      controls={
        <>
          <ControlGroup title="装置">
            <Segmented
              label="分析器台数"
              value={stageCount}
              onChange={(v) => {
                setStageCount(Number(v))
                reset()
              }}
              options={[
                { value: 1, label: '1 台' },
                { value: 2, label: '2 台' },
                { value: 3, label: '3 台' },
              ]}
            />
            {activeStages.map((st, i) => (
              <div key={i} className="space-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2">
                <p className="text-[12px] font-semibold text-[var(--text-muted)]">第 {i + 1} 台</p>
                <Segmented
                  value={st.axis}
                  onChange={(v) => {
                    setStage(i, { axis: v as Axis })
                    reset()
                  }}
                  options={[
                    { value: 'z', label: 'Z 轴' },
                    { value: 'x', label: 'X 轴' },
                  ]}
                />
                <Segmented
                  value={st.block}
                  onChange={(v) => {
                    setStage(i, { block: v as Block })
                    reset()
                  }}
                  options={[
                    { value: 'none', label: '都通过' },
                    { value: 'minus', label: '挡下束' },
                    { value: 'plus', label: '挡上束' },
                  ]}
                />
              </div>
            ))}
          </ControlGroup>

          <ControlGroup title="束流">
            <TimeBar
              playing={playing}
              onPlay={setPlaying}
              onReset={reset}
              speed={speed}
              onSpeed={setSpeed}
              timeLabel={`${total} 个`}
            />
            <Slider label="发射速率" value={rate} min={5} max={200} step={5} onChange={setRate} />
            <Button onClick={reset}>清空计数</Button>
          </ControlGroup>

          <ControlGroup title="末端计数">
            <div className="space-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-2">
              <div className="flex justify-between text-[12px] text-[var(--text-muted)]">
                <span>上束 / 下束</span>
                <span className="font-mono tabular-nums text-[var(--text)]">
                  {counts.plus} / {counts.minus}
                </span>
              </div>
              <ProbabilityBar
                segments={[
                  { value: fraction, color: p.energy, label: '上' },
                  { value: 1 - fraction, color: p.imag, label: '下' },
                ]}
              />
              <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">
                被挡板吸收 {counts.blocked} 个。{expectation}
              </p>
            </div>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="overflow-x-auto text-[15px]">
            <Tex>
              {activeStages.length >= 2 &&
              activeStages[activeStages.length - 1]!.axis !== activeStages[activeStages.length - 2]!.axis
                ? '|\\braket{\\pm_x}{\\pm_z}|^2 = \\tfrac12'
                : '|\\braket{\\pm_z}{\\pm_z}|^2 = 1 \\ \\text{或}\\ 0'}
            </Tex>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
            <span>已发射 {total + counts.blocked}</span>
            <span>到达屏 {total}</span>
            <span>上束比例 {total > 0 ? fraction.toFixed(3) : '—'}</span>
          </div>
          <Legend
            items={[
              { color: p.energy, label: '自旋 +（沿该台的轴）' },
              { color: p.imag, label: '自旋 −' },
              { color: p.potential, label: '磁铁与挡板' },
            ]}
          />
        </div>
      }
      guide={[
        '默认配置就是那个经典实验：Z（挡下束）→ X（挡下束）→ Z。注意最后一台仍然分成两束——第一台明明只放行了「上」。',
        '把第二台也改成 Z 轴：最后一台只剩一束。测量是可重复的，同一个轴测多少次结果都不变。',
        '把第二台改回 X 轴：下束立刻回来了。X 测量不是读取属性，它真的改变了态。',
        '只留一台、都不挡：入射是完全无偏的银原子，两束各占一半——这是 1922 年 Stern 与 Gerlach 看到的原始现象，也是「自旋只有两个值」的第一个直接证据。',
      ]}
      pitfalls={[
        {
          title: '“第一台已经把下束筛掉了，后面不该再出现”',
          body: '「下束」是相对于 Z 轴说的。经过 X 分析器之后，态变成了 X 的本征态，它在 Z 基下重新是叠加态——不是筛子漏了，是属性本身被重新定义了。',
        },
        {
          title: '“磁场把自旋掰到了新方向”',
          body: '非均匀磁场提供的是位置相关的力，把不同自旋分量在空间上分开；真正改变态的是「挡掉一束」这个选择动作（投影）。',
        },
      ]}
      reflect={[
        '如果第二台 X 分析器不挡任何一束，而是把两束重新合并（不去看是哪一束），第三台的 Z 结果会是什么？（这就是量子擦除的雏形。）',
        '把三台都设成 Z 轴、都不挡，屏上会看到几束？为什么？',
        '银原子有 47 个电子，为什么整体表现得像一个自旋 1/2？',
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={4}
        maxDistance={34}
        overlay={
          <CanvasStat>
            {activeStages.map((s) => s.axis.toUpperCase()).join(' → ')}　到达 {total}
          </CanvasStat>
        }
      >
        {/* 炉源 */}
        <mesh position={[SOURCE_X, 0, 0]}>
          <boxGeometry args={[0.7, 0.8, 0.8]} />
          <meshStandardMaterial color={p.potential} roughness={0.7} />
        </mesh>
        <SceneLabel position={[SOURCE_X, 0.75, 0]} tone="muted" size="xs">
          炉源（无偏自旋）
        </SceneLabel>

        {activeStages.map((st, i) => (
          <Magnet key={i} x={STAGE_X[i]!} axis={st.axis} block={st.block} index={i} />
        ))}

        {/* 屏 */}
        <mesh position={[SCREEN_X, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial color={p.potential} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <SceneLabel position={[SCREEN_X, 1.7, 0]} tone="muted" size="xs">
          探测屏
        </SceneLabel>

        <PointCloud
          positions={positions}
          colors={colors}
          count={MAX_PARTICLES}
          size={0.11}
          opacity={0.95}
          dynamic
        />
        <group position={[SCREEN_X + 0.03, 0, 0]}>
          <PointCloud positions={hits} count={hitTick} color={p.hit} size={0.07} opacity={0.8} />
        </group>

        <Beam
          pool={pool}
          positions={positions}
          colors={colors}
          stages={activeStages}
          playing={playing}
          speed={speed}
          rate={rate * (profile.rich ? 1 : 0.5)}
          hits={hits}
          hitCount={hitCount}
          onCounts={setCounts}
          onHitTick={setHitTick}
          palette={p}
        />
      </SceneCanvas>
    </SceneShell>
  )
}

function Magnet({ x, axis, block, index }: { x: number; axis: Axis; block: Block; index: number }) {
  const p = useScenePalette()
  const vertical = axis === 'z'
  return (
    <group position={[x, 0, 0]}>
      {/* 两块极靴：沿分束方向上下（或左右）夹住束流 */}
      {[1, -1].map((s) => (
        <mesh
          key={s}
          position={vertical ? [0, s * 0.62, 0] : [0, 0, s * 0.62]}
          rotation={vertical ? [0, 0, 0] : [Math.PI / 2, 0, 0]}
        >
          <boxGeometry args={[1.3, 0.28, 1.2]} />
          <meshStandardMaterial color={p.potential} roughness={0.55} metalness={0.25} />
        </mesh>
      ))}
      <SceneLabel position={vertical ? [0, 1.15, 0] : [0, 0, 1.15]} tone="accent" size="xs">
        {index + 1}. {axis.toUpperCase()} 分析器
      </SceneLabel>

      {/* 挡板 */}
      {block !== 'none' ? (
        <mesh
          position={
            vertical
              ? [0.95, block === 'plus' ? 0.42 : -0.42, 0]
              : [0.95, 0, block === 'plus' ? 0.42 : -0.42]
          }
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.55, 0.55]} />
          <meshStandardMaterial color={p.danger} side={THREE.DoubleSide} transparent opacity={0.75} />
        </mesh>
      ) : null}
    </group>
  )
}

function Beam({
  pool,
  positions,
  colors,
  stages,
  playing,
  speed,
  rate,
  hits,
  hitCount,
  onCounts,
  onHitTick,
  palette,
}: {
  pool: Particle[]
  positions: Float32Array
  colors: Float32Array
  stages: StageConfig[]
  playing: boolean
  speed: number
  rate: number
  hits: Float32Array
  hitCount: React.MutableRefObject<number>
  onCounts: (c: { plus: number; minus: number; blocked: number }) => void
  onHitTick: (n: number) => void
  palette: ReturnType<typeof useScenePalette>
}) {
  const emitAcc = useRef(0)
  const report = useRef(0)
  const tally = useRef({ plus: 0, minus: 0, blocked: 0 })
  const cPlus = useMemo(() => new THREE.Color(palette.energy), [palette.energy])
  const cMinus = useMemo(() => new THREE.Color(palette.imag), [palette.imag])
  const cNeutral = useMemo(() => new THREE.Color(palette.faint), [palette.faint])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05) * speed
    const vx = BEAM_V

    if (playing) {
      emitAcc.current += dt * rate
      while (emitAcc.current >= 1) {
        emitAcc.current -= 1
        const q = pool.find((x) => !x.alive)
        if (!q) break
        q.alive = true
        q.x = SOURCE_X + 0.4
        q.y = (Math.random() - 0.5) * 0.16
        q.z = (Math.random() - 0.5) * 0.16
        q.vy = 0
        q.vz = 0
        q.stage = 0
        q.outcome = 0
        // 炉源出来的自旋完全无偏：在球面上均匀取一个方向
        const u = 2 * Math.random() - 1
        const phi = 2 * Math.PI * Math.random()
        const s = Math.sqrt(1 - u * u)
        q.r = [s * Math.cos(phi), u, s * Math.sin(phi)]
      }
    }

    for (let i = 0; i < pool.length; i++) {
      const q = pool[i]!
      if (!q.alive) {
        // 不活跃的粒子藏到远处，省去改 drawRange 的麻烦
        positions[i * 3] = 0
        positions[i * 3 + 1] = -999
        positions[i * 3 + 2] = 0
        continue
      }
      if (playing) {
        const prevX = q.x
        q.x += vx * dt
        q.y += q.vy * dt
        q.z += q.vz * dt

        // 穿过某台分析器：掷骰子决定去向
        if (q.stage < stages.length) {
          const sx = STAGE_X[q.stage]!
          if (prevX < sx && q.x >= sx) {
            const st = stages[q.stage]!
            const n = AXIS_VEC[st.axis]
            const pPlus = measureProbability(q.r, n)
            const outcome: 1 | -1 = Math.random() < pPlus ? 1 : -1
            q.r = [n[0] * outcome, n[1] * outcome, n[2] * outcome]
            q.outcome = outcome
            const deflect = 0.42 * outcome
            if (st.axis === 'z') q.vy = deflect * vx * 0.42
            else q.vz = deflect * vx * 0.42

            const blocked =
              (st.block === 'plus' && outcome === 1) || (st.block === 'minus' && outcome === -1)
            if (blocked) {
              q.alive = false
              tally.current.blocked += 1
              positions[i * 3 + 1] = -999
              continue
            }
            q.stage += 1
          }
        }

        if (q.x >= SCREEN_X) {
          q.alive = false
          // 用最后一次测量结果的符号判定上/下（沿最后一台的轴）
          const last = stages[stages.length - 1]!
          const n = AXIS_VEC[last.axis]
          const dot = q.r[0] * n[0] + q.r[1] * n[1] + q.r[2] * n[2]
          if (dot > 0) tally.current.plus += 1
          else tally.current.minus += 1
          const h = hitCount.current
          if (h < 20000) {
            hits[h * 3] = 0
            hits[h * 3 + 1] = q.y
            hits[h * 3 + 2] = q.z
            hitCount.current = h + 1
          }
          positions[i * 3 + 1] = -999
          continue
        }
      }

      positions[i * 3] = q.x
      positions[i * 3 + 1] = q.y
      positions[i * 3 + 2] = q.z
      // 颜色 = 最近一次测量的结果。还没进过任何分析器的粒子是灰的：
      // 它此刻没有「沿某个轴是上还是下」这个属性。
      const c = q.outcome === 0 ? cNeutral : q.outcome === 1 ? cPlus : cMinus
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    report.current += dt
    if (report.current > 0.15) {
      report.current = 0
      onCounts({ ...tally.current })
      onHitTick(hitCount.current)
    }
  })

  return null
}
