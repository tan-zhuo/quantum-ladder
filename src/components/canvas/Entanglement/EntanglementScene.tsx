import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { SceneCanvas, SceneLabel, type SceneApi, type ViewPreset } from '../core/SceneCanvas'
import SceneShell from '../core/SceneShell'
import { useScenePalette } from '../core/theme'
import { BlochFrame } from '../BlochSphere/BlochFrame'
import { ControlGroup, Legend, CanvasStat, MiniPlot, ProbabilityBar } from '../core/widgets'
import { Slider, Button, Segmented, Toggle } from '@/components/sim/controls'
import { PointCloud } from '../core/primitives'
import Tex from '@/components/math/Tex'

/**
 * 模块 08 主场景：纠缠与 Bell 不等式。
 *
 * 这个场景的每一个数字都来自真实抽样，没有任何一处是把理论曲线画上去充数：
 * 每对粒子先按 P(A)=1/2 抽 Alice 的结果，再按 P(B|A) = (1 − A·â·b̂)/2 抽 Bob 的，
 * 于是 CHSH 的 S 是数出来的，不是算出来的。
 *
 * 「局域隐变量」模式换一套抽样规则：每对粒子携带一个共同的随机方向 λ，
 * 两端各自按 sign(λ·n̂) 独立决定结果。它的关联曲线是折线，永远越不过 2。
 */

const PRESETS: ViewPreset[] = [
  { id: 'iso', label: '等轴', position: [0.8, 3.6, 7.5], title: '看整套装置' },
  { id: 'front', label: '正视', position: [0, 0.6, 8.5], title: '正对两个测量平面' },
  { id: 'top', label: '俯视', position: [0, 8.5, 0.01], title: '俯视' },
]

const A_X = -3.2
const B_X = 3.2
const MAX_FLY = 240

type Mode = 'quantum' | 'lhv'

/** 在 xz 平面（three 的 x–y 平面，取 z=0）内的测量方向 */
function axisVec(angleDeg: number): [number, number, number] {
  const a = (angleDeg * Math.PI) / 180
  return [Math.sin(a), Math.cos(a), 0]
}

function dot(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

interface Fly {
  alive: boolean
  t: number
  side: -1 | 1
  outcome: 1 | -1
}

interface Tally {
  n: number
  /** 四种设置组合的 [和, 计数] */
  sums: number[]
  counts: number[]
  singleA: number
  singleB: number
}

const EMPTY: Tally = { n: 0, sums: [0, 0, 0, 0], counts: [0, 0, 0, 0], singleA: 0, singleB: 0 }

export default function EntanglementScene() {
  const p = useScenePalette()
  const apiRef = useRef<SceneApi | null>(null)

  const [mode, setMode] = useState<Mode>('quantum')
  // 自旋 1/2 的关联是 −cos θ（光子偏振才是 −cos 2θ），所以最优角度是
  // a=0°, a′=90°, b=45°, b′=135°，此时 |S| = 2√2。
  const [a1, setA1] = useState(0)
  const [a2, setA2] = useState(90)
  const [b1, setB1] = useState(45)
  const [b2, setB2] = useState(135)
  const [running, setRunning] = useState(true)
  const [tally, setTally] = useState<Tally>(EMPTY)
  const [showSpheres, setShowSpheres] = useState(true)

  const settings = useMemo(
    () => ({ a: [axisVec(a1), axisVec(a2)] as const, b: [axisVec(b1), axisVec(b2)] as const }),
    [a1, a2, b1, b2],
  )

  const tallyRef = useRef<Tally>({ ...EMPTY, sums: [0, 0, 0, 0], counts: [0, 0, 0, 0] })
  const reset = useCallback(() => {
    tallyRef.current = { n: 0, sums: [0, 0, 0, 0], counts: [0, 0, 0, 0], singleA: 0, singleB: 0 }
    setTally({ ...tallyRef.current, sums: [0, 0, 0, 0], counts: [0, 0, 0, 0] })
  }, [])

  useEffect(reset, [mode, a1, a2, b1, b2, reset])

  const E = tally.counts.map((c, i) => (c > 0 ? tally.sums[i]! / c : 0))
  // S = E(a1,b1) − E(a1,b2) + E(a2,b1) + E(a2,b2)，下标顺序 [a1b1, a1b2, a2b1, a2b2]
  const S = E[0]! - E[1]! + E[2]! + E[3]!

  const theoryS = useMemo(() => {
    const q = (i: number, j: number) => -dot(settings.a[i as 0 | 1], settings.b[j as 0 | 1])
    return q(0, 0) - q(0, 1) + q(1, 0) + q(1, 1)
  }, [settings])

  /** 关联曲线：量子的 −cos 与局域隐变量能做到的最好（折线） */
  const curves = useMemo(() => {
    const qm: [number, number][] = []
    const lhv: [number, number][] = []
    for (let i = 0; i <= 90; i++) {
      const deg = (180 * i) / 90
      const rad = (deg * Math.PI) / 180
      qm.push([i / 90, (-Math.cos(rad) + 1) / 2])
      lhv.push([i / 90, (-1 + (2 * deg) / 180 + 1) / 2])
    }
    return { qm, lhv }
  }, [])

  const measured = useMemo(() => {
    const pts: [number, number][] = []
    const pairs: [number, number][] = [
      [a1, b1],
      [a1, b2],
      [a2, b1],
      [a2, b2],
    ]
    pairs.forEach(([x, y], i) => {
      if (tally.counts[i]! < 20) return
      let d = Math.abs(x - y) % 360
      if (d > 180) d = 360 - d
      pts.push([d / 180, (E[i]! + 1) / 2])
    })
    return pts.sort((u, w) => u[0] - w[0])
  }, [tally, E, a1, a2, b1, b2])

  const violated = Math.abs(S) > 2 && tally.n > 200

  return (
    <SceneShell
      id="entanglement"
      title="纠缠与 Bell：把「测量前就定好了」这个假设做掉"
      subtitle="每一对粒子飞向两端，各自给出 ±1。单边看完全随机，合起来看却严格相关。CHSH 的 S 越过 2，局域实在论就出局了。"
      apiRef={apiRef}
      height={540}
      controls={
        <>
          <ControlGroup
            title="模型"
            hint={
              mode === 'quantum'
                ? '按量子力学抽样：P(B|A) = (1 − A·â·b̂)/2'
                : '每对粒子携带一个共同的隐变量 λ，两端各自按 sign(λ·n̂) 独立决定结果'
            }
          >
            <Segmented
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              options={[
                { value: 'quantum', label: '量子力学' },
                { value: 'lhv', label: '局域隐变量' },
              ]}
            />
          </ControlGroup>

          <ControlGroup title="测量角度" hint="默认给的是让 S 最大的那组角度（0°, 90°, 45°, 135°）。自旋的关联是 −cos θ，所以最优角度间隔是 45°。">
            <Slider label="Alice a" value={a1} min={0} max={180} step={1} onChange={setA1} display={`${a1}°`} />
            <Slider label="Alice a′" value={a2} min={0} max={180} step={1} onChange={setA2} display={`${a2}°`} />
            <Slider label="Bob b" value={b1} min={0} max={180} step={0.5} onChange={setB1} display={`${b1}°`} />
            <Slider label="Bob b′" value={b2} min={0} max={180} step={0.5} onChange={setB2} display={`${b2}°`} />
            <div className="flex flex-wrap gap-1.5">
              <Button
                onClick={() => {
                  setA1(0)
                  setA2(90)
                  setB1(45)
                  setB2(135)
                }}
              >
                最优角度
              </Button>
              <Button
                onClick={() => {
                  setA1(0)
                  setA2(0)
                  setB1(0)
                  setB2(0)
                }}
                title="全部同向：S = 0，这组角度检验不出任何非经典性"
              >
                全部同向
              </Button>
            </div>
          </ControlGroup>

          <ControlGroup title="运行">
            <div className="flex flex-wrap gap-1.5">
              <Button variant="primary" onClick={() => setRunning((v) => !v)}>
                {running ? '暂停' : '继续'}
              </Button>
              <Button onClick={reset}>清空统计</Button>
            </div>
            <Toggle label="显示两端的约化态球" checked={showSpheres} onChange={setShowSpheres} />
          </ControlGroup>

          <ControlGroup title="关联 E(θ)">
            <MiniPlot
              series={[
                { points: curves.qm, color: p.real },
                { points: curves.lhv, color: p.classical, dashed: true },
                ...(measured.length > 1 ? [{ points: measured, color: p.energy }] : []),
              ]}
              height={82}
              xTicks={[
                [0, 0, '0°'],
                [0.5, 0, '90°'],
                [1, 0, '180°'],
              ]}
              ariaLabel="关联随夹角变化"
            />
            <p className="text-[11.5px] leading-snug text-[var(--text-faint)]">
              蓝色是量子预言 −cos θ，橙虚线是局域隐变量模型能给出的折线，绿点是当前四组设置的实测值。
              两条曲线在 0°、90°、180° 重合，在 45° 附近差得最多——CHSH 的四个角度就挑在这里。
            </p>
          </ControlGroup>
        </>
      }
      readout={
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-[var(--text-muted)]">CHSH 值 |S|</span>
                <span
                  className="font-mono text-[18px] tabular-nums"
                  style={{ color: violated ? p.danger : p.ink }}
                >
                  {Math.abs(S).toFixed(3)}
                </span>
              </div>
              <ProbabilityBar
                segments={[
                  { value: Math.min(Math.abs(S), 2), color: p.energy, label: '经典可解释部分' },
                  { value: Math.max(0, Math.abs(S) - 2), color: p.danger, label: '超出经典上界' },
                  { value: Math.max(0, 2 * Math.SQRT2 - Math.max(2, Math.abs(S))), color: p.faint, label: '余量' },
                ]}
                height={10}
              />
              <p className="text-[11.5px] text-[var(--text-faint)]">
                经典上界 2　·　量子上界 2√2 ≈ 2.828　·　理论预期 {Math.abs(theoryS).toFixed(3)}
              </p>
            </div>
            <div className="flex flex-col justify-center gap-1 font-mono text-[12.5px] tabular-nums text-[var(--text-muted)]">
              <span>样本数 {tally.n.toLocaleString()}</span>
              <span>
                Alice 单边 +1 比例 {tally.n > 0 ? (tally.singleA / tally.n).toFixed(3) : '—'}
              </span>
              <span>
                Bob 单边 +1 比例 {tally.n > 0 ? (tally.singleB / tally.n).toFixed(3) : '—'}
              </span>
            </div>
          </div>
          {violated ? (
            <p className="rounded-lg border border-[var(--c-danger)]/35 bg-[color-mix(in_srgb,var(--c-danger)_7%,transparent)] px-3 py-2 text-[13px] text-[var(--text-muted)]">
              |S| &gt; 2：这组数据无法用任何「测量前结果已确定 + 定域」的模型解释。
            </p>
          ) : null}
          <div className="overflow-x-auto text-[14px]">
            <Tex>{'S = E(a,b) - E(a,b\') + E(a\',b) + E(a\',b\')'}</Tex>
          </div>
          <Legend
            items={[
              { color: p.energy, label: '结果 +1' },
              { color: p.imag, label: '结果 −1' },
              { color: p.accent, label: '测量轴' },
            ]}
          />
        </div>
      }
      guide={[
        '先看两端的球：两个约化态都缩在球心（最大混合），说明单看任何一边都是纯粹的随机噪声，一点信息也没有。信息全在关联里。',
        '默认角度下让它跑几百对，|S| 会稳定在 2.8 附近，明显越过经典上界 2。',
        '切到「局域隐变量」模式：同样的角度，|S| 卡在 2 以下上不去。这不是模型没调好——任何局域隐变量模型都过不去，这正是 Bell 的定理。',
        '点「全部同向」：S 掉到 0。角度选错的话，这个实验什么也检验不出来——这解释了为什么 Bell 实验的角度必须精心设计。',
        '把关联曲线里的两条对照看：量子是 cos，局域隐变量最多是折线，两者在 45° 附近差得最多——这正是四个测量角度都相隔 45° 的原因。',
      ]}
      pitfalls={[
        {
          title: '“纠缠可以超光速传信息”',
          body: 'Alice 无法控制自己得到 +1 还是 −1，Bob 单边看永远是 50/50。要看到关联必须把两边的记录用经典信道送到一起比对。无信号定理保证了这一点。',
        },
        {
          title: '“Alice 的测量改变了 Bob 的粒子”',
          body: '换个惯性系，两次测量的先后顺序会反过来。「谁导致谁」在类空间隔的事件之间没有不变的含义。可靠的说法只是：联合分布不能被分解成两个独立的定域分布。',
        },
        {
          title: '“纠缠就是很强的关联”',
          body: '经典关联可以很强（两只手套分装两地，看一只就知道另一只）。区别在于：经典关联的强度随角度是折线，量子是 cos，而这个差别是可以测出来的。',
        },
      ]}
      reflect={[
        '手套的例子里，若两端都只测「左还是右」，关联同样是 100%。要区分「手套」和「纠缠」，为什么必须测量至少两组不同的方向？',
        '量子上界是 2√2（Tsirelson 界），代数上界是 4。存在既不能超光速通信、又能达到 4 的理论吗？（关键词：PR box。）',
        '若探测效率只有 50%，且丢失的样本与隐变量相关，局域模型能否伪造出 |S| > 2？这就是「探测漏洞」，2015 年的实验才彻底封上。',
      ]}
    >
      <SceneCanvas
        presets={PRESETS}
        apiRef={apiRef}
        minDistance={4}
        maxDistance={22}
        overlay={
          <CanvasStat>
            {mode === 'quantum' ? '量子力学' : '局域隐变量'}　|S| = {Math.abs(S).toFixed(3)}　样本 {tally.n}
          </CanvasStat>
        }
      >
        {/* 源 */}
        <mesh>
          <sphereGeometry args={[0.2, 20, 16]} />
          <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={0.4} />
        </mesh>
        <SceneLabel position={[0, 0.45, 0]} tone="muted" size="xs">
          纠缠源
        </SceneLabel>

        {([[A_X, 'Alice'], [B_X, 'Bob']] as [number, string][]).map(([x, name]) => (
          <group key={name} position={[x, 0, 0]}>
            {showSpheres ? (
              <group scale={0.85}>
                <BlochFrame showLabels={false} showLatLong={false} />
                {/* 约化态：最大混合，正好是球心的一个点 */}
                <mesh>
                  <sphereGeometry args={[0.07, 16, 12]} />
                  <meshStandardMaterial color={p.faint} />
                </mesh>
              </group>
            ) : null}
            <SceneLabel position={[0, 1.25, 0]} tone="accent" size="xs">
              {name}
            </SceneLabel>
          </group>
        ))}

        <MeasurementAxes settings={settings} showSpheres={showSpheres} />

        <Pairs
          settings={settings}
          mode={mode}
          running={running}
          tallyRef={tallyRef}
          onTally={setTally}
          palette={p}
        />

        <Line
          points={[
            [A_X, 0, 0],
            [B_X, 0, 0],
          ]}
          color={p.grid}
          lineWidth={1}
          transparent
          opacity={0.4}
          dashed
          dashSize={0.12}
          gapSize={0.1}
        />
      </SceneCanvas>
    </SceneShell>
  )
}

function MeasurementAxes({
  settings,
  showSpheres,
}: {
  settings: { a: readonly [number, number, number][]; b: readonly [number, number, number][] }
  showSpheres: boolean
}) {
  const p = useScenePalette()
  const scale = showSpheres ? 0.85 : 0.5
  const draw = (x: number, v: [number, number, number], label: string, dim: boolean) => (
    <group key={label} position={[x, 0, 0]}>
      <Line
        points={[
          [-v[0] * scale * 1.2, -v[1] * scale * 1.2, 0],
          [v[0] * scale * 1.2, v[1] * scale * 1.2, 0],
        ]}
        color={dim ? p.muted : p.accent}
        lineWidth={dim ? 1.4 : 2.2}
        transparent
        opacity={dim ? 0.55 : 0.95}
      />
      <SceneLabel
        position={[v[0] * scale * 1.35, v[1] * scale * 1.35, 0]}
        tone={dim ? 'muted' : 'accent'}
        size="xs"
      >
        {label}
      </SceneLabel>
    </group>
  )
  return (
    <group>
      {draw(A_X, settings.a[0] as [number, number, number], 'a', false)}
      {draw(A_X, settings.a[1] as [number, number, number], "a'", true)}
      {draw(B_X, settings.b[0] as [number, number, number], 'b', false)}
      {draw(B_X, settings.b[1] as [number, number, number], "b'", true)}
    </group>
  )
}

function Pairs({
  settings,
  mode,
  running,
  tallyRef,
  onTally,
  palette,
}: {
  settings: { a: readonly [number, number, number][]; b: readonly [number, number, number][] }
  mode: Mode
  running: boolean
  tallyRef: React.MutableRefObject<Tally>
  onTally: (t: Tally) => void
  palette: ReturnType<typeof useScenePalette>
}) {
  const positions = useMemo(() => new Float32Array(MAX_FLY * 3), [])
  const colors = useMemo(() => new Float32Array(MAX_FLY * 3), [])
  const pool = useMemo<Fly[]>(
    () => Array.from({ length: MAX_FLY }, () => ({ alive: false, t: 0, side: 1 as 1 | -1, outcome: 1 as 1 | -1 })),
    [],
  )
  const emit = useRef(0)
  const report = useRef(0)
  const cPlus = useMemo(() => new THREE.Color(palette.energy), [palette.energy])
  const cMinus = useMemo(() => new THREE.Color(palette.imag), [palette.imag])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)

    if (running) {
      emit.current += dt * 26
      while (emit.current >= 1) {
        emit.current -= 1
        const i = settings.a.length > 1 ? (Math.random() < 0.5 ? 0 : 1) : 0
        const j = Math.random() < 0.5 ? 0 : 1
        const av = settings.a[i]! as [number, number, number]
        const bv = settings.b[j]! as [number, number, number]

        let A: 1 | -1
        let B: 1 | -1
        if (mode === 'quantum') {
          // 单态：边缘分布各半，条件分布 P(B=+1|A) = (1 − A·â·b̂)/2
          A = Math.random() < 0.5 ? 1 : -1
          const c = dot(av, bv)
          B = Math.random() < (1 - A * c) / 2 ? 1 : -1
        } else {
          // 局域隐变量：两端共享一个随机方向 λ，各自独立地按 sign(λ·n̂) 出结果
          const u = 2 * Math.random() - 1
          const ph = 2 * Math.PI * Math.random()
          const s = Math.sqrt(1 - u * u)
          const lam: [number, number, number] = [s * Math.cos(ph), u, s * Math.sin(ph)]
          A = dot(lam, av) >= 0 ? 1 : -1
          B = dot(lam, bv) >= 0 ? -1 : 1
        }

        const idx = i * 2 + j
        const t = tallyRef.current
        t.n += 1
        t.sums[idx] = t.sums[idx]! + A * B
        t.counts[idx] = t.counts[idx]! + 1
        if (A === 1) t.singleA += 1
        if (B === 1) t.singleB += 1

        for (const [side, outcome] of [
          [-1, A],
          [1, B],
        ] as [-1 | 1, 1 | -1][]) {
          const q = pool.find((x) => !x.alive)
          if (!q) break
          q.alive = true
          q.t = 0
          q.side = side
          q.outcome = outcome
        }
      }
    }

    for (let k = 0; k < pool.length; k++) {
      const q = pool[k]!
      if (!q.alive) {
        positions[k * 3 + 1] = -999
        continue
      }
      q.t += dt * 1.6
      if (q.t >= 1) {
        q.alive = false
        positions[k * 3 + 1] = -999
        continue
      }
      const x = q.side * q.t * (q.side < 0 ? -A_X : B_X)
      positions[k * 3] = x
      positions[k * 3 + 1] = 0
      positions[k * 3 + 2] = 0
      const c = q.outcome === 1 ? cPlus : cMinus
      colors[k * 3] = c.r
      colors[k * 3 + 1] = c.g
      colors[k * 3 + 2] = c.b
    }

    report.current += dt
    if (report.current > 0.2) {
      report.current = 0
      const t = tallyRef.current
      onTally({ ...t, sums: [...t.sums], counts: [...t.counts] })
    }
  })

  return <PointCloud positions={positions} colors={colors} count={MAX_FLY} size={0.09} opacity={0.95} dynamic />
}
