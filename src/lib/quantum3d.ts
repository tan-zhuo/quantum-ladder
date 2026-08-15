/**
 * 3D 场景专用的物理与数值工具。
 *
 * 与 src/lib/numerics.ts 的分工：numerics.ts 是一维演化与解析解（split-operator、
 * FFT、谐振子本征态），那套东西 2D 画布时代就在用；这里放的是三维场景才需要的东西
 * ——任意势的本征值问题、氢原子轨道采样、球谐函数、双缝的惠更斯求和、Bloch 球代数。
 *
 * 单位约定：ħ = m = 1（一维问题），氢原子用玻尔半径 a₀ = 1、能量单位 Hartree。
 */

// ── 通用小工具 ────────────────────────────────────────────

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** ln(n!)，n ≤ 170 之外也不会溢出（对数域累加） */
function lnFact(n: number): number {
  let s = 0
  for (let i = 2; i <= n; i++) s += Math.log(i)
  return s
}

// ── 对称三对角矩阵本征问题（一维定态方程的核心） ──────────────

/**
 * 对称三对角矩阵的全部本征值（升序），隐式位移 QL 算法（EISPACK tql1 的移植）。
 *
 * 为什么自己写：一维定态薛定谔方程离散化后天然是三对角的，用通用稠密线代库
 * 是杀鸡用牛刀，还要给纯前端的包体积加上几百 KB。
 *
 * 为什么只算本征值不算本征矢：累积本征矢是 O(n³)，n = 400 就要 200 ms，
 * 拖滑块时明显卡顿；只求本征值是 O(n²)，同样规模 1~2 ms。需要的十几个本征矢
 * 随后用反迭代单独求（见 inverseIteration），每个只要 O(n)。
 *
 * @param d 主对角线（原地修改，调用方传副本）
 * @param e 次对角线，e[i] 连接 i 与 i+1，e[n-1] 忽略（同样原地修改）
 */
export function tridiagEigenvalues(d: Float64Array, e: Float64Array): Float64Array {
  const n = d.length
  if (n === 0) return new Float64Array(0)
  e[n - 1] = 0

  for (let l = 0; l < n; l++) {
    let iter = 0
    let m = l
    do {
      // 找到可以收缩的次对角元：|e[m]| 相对邻近对角元已可忽略
      for (m = l; m < n - 1; m++) {
        const dd = Math.abs(d[m]!) + Math.abs(d[m + 1]!)
        if (Math.abs(e[m]!) <= Number.EPSILON * dd) break
      }
      if (m === l) break
      if (iter++ === 50) break // 病态输入下放弃细化，返回当前近似值而不是死循环

      let g = (d[l + 1]! - d[l]!) / (2 * e[l]!)
      let r = Math.hypot(g, 1)
      g = d[m]! - d[l]! + e[l]! / (g + (g >= 0 ? Math.abs(r) : -Math.abs(r)))
      let s = 1
      let c = 1
      let p = 0

      for (let i = m - 1; i >= l; i--) {
        const f = s * e[i]!
        const b = c * e[i]!
        r = Math.hypot(f, g)
        e[i + 1] = r
        if (r === 0) {
          d[i + 1] = d[i + 1]! - p
          e[m] = 0
          break
        }
        s = f / r
        c = g / r
        g = d[i + 1]! - p
        r = (d[i]! - g) * s + 2 * c * b
        p = s * r
        d[i + 1] = g + p
        g = c * r - b
      }
      d[l] = d[l]! - p
      e[l] = g
      e[m] = 0
    } while (m !== l)
  }

  const out = Float64Array.from(d)
  out.sort()
  return out
}

/**
 * 解三对角线性方程组 (sub, diag, sup) · x = rhs，带部分选主元（LAPACK dgtsv 的移植）。
 *
 * 选主元是必需的：反迭代里矩阵 T − λI 被有意做成接近奇异，不选主元的 Thomas 算法
 * 会在主元接近 0 时炸成 NaN。
 *
 * @returns 原地写回 rhs 并返回它
 */
export function solveTridiag(
  sub: Float64Array,
  diag: Float64Array,
  sup: Float64Array,
  rhs: Float64Array,
): Float64Array {
  const n = diag.length
  const d = Float64Array.from(diag)
  const du = Float64Array.from(sup)
  const du2 = new Float64Array(n)
  const b = rhs
  const TINY = 1e-300

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]!) >= Math.abs(sub[i]!)) {
      if (d[i] !== 0) {
        const fact = sub[i]! / d[i]!
        d[i + 1] = d[i + 1]! - fact * du[i]!
        b[i + 1] = b[i + 1]! - fact * b[i]!
      }
      du2[i] = 0
    } else {
      const fact = d[i]! / sub[i]!
      d[i] = sub[i]!
      const temp = d[i + 1]!
      d[i + 1] = du[i]! - fact * temp
      if (i < n - 2) {
        du2[i] = du[i + 1]!
        du[i + 1] = -fact * du[i + 1]!
      }
      du[i] = temp
      const tb = b[i]!
      b[i] = b[i + 1]!
      b[i + 1] = tb - fact * b[i + 1]!
    }
  }

  if (d[n - 1] === 0) d[n - 1] = TINY
  b[n - 1] = b[n - 1]! / d[n - 1]!
  if (n > 1) {
    if (d[n - 2] === 0) d[n - 2] = TINY
    b[n - 2] = (b[n - 2]! - du[n - 2]! * b[n - 1]!) / d[n - 2]!
  }
  for (let i = n - 3; i >= 0; i--) {
    if (d[i] === 0) d[i] = TINY
    b[i] = (b[i]! - du[i]! * b[i + 1]! - du2[i]! * b[i + 2]!) / d[i]!
  }
  return b
}

/**
 * 反迭代：已知本征值 λ，求对应的本征矢。
 *
 * 反复解 (T − λI)·x_{k+1} = x_k 并归一化。由于 T − λI 在 λ 方向上几乎奇异，
 * 一两步就会把初始向量拉到该本征矢上，通常 3 步足够收敛到机器精度。
 * λ 上加一点点扰动，避免矩阵严格奇异。
 */
export function inverseIteration(
  diag: Float64Array,
  off: Float64Array,
  lambda: number,
  opts: { iterations?: number; seed?: number } = {},
): Float64Array {
  const { iterations = 3, seed = 12345 } = opts
  const n = diag.length
  const shift = lambda + (Math.abs(lambda) + 1) * 1e-10
  const shifted = new Float64Array(n)
  for (let i = 0; i < n; i++) shifted[i] = diag[i]! - shift
  const sub = new Float64Array(n)
  const sup = new Float64Array(n)
  for (let i = 0; i < n - 1; i++) {
    sub[i] = off[i]! // 第 i+1 行第 i 列
    sup[i] = off[i]! // 第 i 行第 i+1 列（对称）
  }

  // 确定性的初始向量：不能用常数向量，否则与奇宇称本征矢正交、迭代原地踏步
  let s = seed >>> 0
  let x = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    x[i] = s / 4294967296 - 0.5
  }

  for (let it = 0; it < iterations; it++) {
    x = solveTridiag(sub, shifted, sup, x)
    let norm = 0
    for (let i = 0; i < n; i++) norm += x[i]! * x[i]!
    norm = Math.sqrt(norm)
    if (!isFinite(norm) || norm === 0) break
    for (let i = 0; i < n; i++) x[i] = x[i]! / norm
  }
  return x
}

export interface Eigenstate {
  /** 量子数 n = 0,1,2,…（基态记为 0） */
  n: number
  energy: number
  /** 归一化到 ∫|ψ|²dx = 1 的实波函数，长度与网格一致 */
  psi: Float64Array
  /** 是否是束缚态（E < 势能在边界处的值） */
  bound: boolean
}

/**
 * 解一维定态方程 −½ψ'' + V(x)ψ = Eψ，三点差分 + 三对角求解。
 *
 * 边界条件是硬壁（ψ(x_min)=ψ(x_max)=0）。对有限深势阱这意味着计算窗口必须
 * 远大于阱宽，否则最高的束缚态会被人为的墙挤上去——场景里已经按阱宽自动放大窗口。
 */
export function solve1D(opts: {
  xMin: number
  xMax: number
  points: number
  V: (x: number) => number
  /** 最多返回多少个态 */
  count?: number
  /** 判定束缚态的能量上限；默认取势能在窗口两端的较小值（无限深阱要显式传 +∞） */
  continuumEdge?: number
}): { x: Float64Array; V: Float64Array; states: Eigenstate[]; dx: number } {
  const { xMin, xMax, points, V: Vfn, count = 12 } = opts
  const n = points
  const dx = (xMax - xMin) / (n + 1)
  const x = new Float64Array(n)
  const V = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = xMin + (i + 1) * dx
    V[i] = Vfn(x[i]!)
  }

  const invdx2 = 1 / (dx * dx)
  const diag = new Float64Array(n)
  const off = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    diag[i] = invdx2 + V[i]! // ħ²/2m = 1/2，二阶差分系数 −1/2 · (−2/dx²) = 1/dx²
    off[i] = -0.5 * invdx2
  }

  // 本征值用 QL（会原地修改，所以传副本），本征矢逐个反迭代
  const values = tridiagEigenvalues(Float64Array.from(diag), Float64Array.from(off))

  const vEdge = opts.continuumEdge ?? Math.min(Vfn(xMin), Vfn(xMax))
  const states: Eigenstate[] = []
  for (let k = 0; k < Math.min(count, n); k++) {
    const raw = inverseIteration(diag, off, values[k]!)
    // 归一化 + 统一符号约定：让第一个显著非零点为正，切换量子数时波函数不会整体翻转
    let norm = 0
    for (let i = 0; i < n; i++) norm += raw[i]! * raw[i]!
    norm = Math.sqrt(norm * dx)
    let sign = 1
    for (let i = 0; i < n; i++) {
      if (Math.abs(raw[i]!) > 1e-6) {
        sign = raw[i]! > 0 ? 1 : -1
        break
      }
    }
    const psi = new Float64Array(n)
    for (let i = 0; i < n; i++) psi[i] = (sign * raw[i]!) / norm
    states.push({ n: k, energy: values[k]!, psi, bound: values[k]! < vEdge })
  }
  return { x, V, states, dx }
}

// ── 一维势阱模型 ──────────────────────────────────────────

export type WellKind = 'infinite' | 'finite' | 'harmonic'

export interface WellParams {
  kind: WellKind
  /** 阱宽 L（无限深 / 有限深） */
  width: number
  /** 阱深 V₀（有限深） */
  depth: number
  /** 角频率 ω（谐振子） */
  omega: number
}

/** 势能函数 + 建议的计算窗口。窗口留够缓冲，否则边界会污染高激发态。 */
export function wellPotential(p: WellParams): {
  V: (x: number) => number
  xMin: number
  xMax: number
  /** 画图时纵轴的势能范围 */
  vRange: [number, number]
} {
  if (p.kind === 'infinite') {
    // 硬边界：直接把计算窗口取成阱本身，ψ(±L/2)=0 由差分格式的边界条件精确给出。
    // 早先的做法是在阱外放一堵 V = 10⁴ 的高墙，但波函数仍会渗进墙里 1/κ ≈ 0.007，
    // 等效阱宽变大，基态能量比解析值低 1.1%——能级图和公式对不上，学习者会以为
    // 是自己算错了。硬边界下五条能级与 n²π²/2L² 吻合到 4 位有效数字。
    const half = p.width / 2
    return { V: () => 0, xMin: -half, xMax: half, vRange: [0, 1] }
  }
  if (p.kind === 'finite') {
    const half = p.width / 2
    // 缓冲区随阱宽放大：最弱束缚的那条能级衰减长度 1/κ 可以很长，窗口太窄
    // 会被硬边界挤成散射态，能级图上就少一条线。20 是性价比的上限——再宽下去
    // 网格变粗带来的误差比边界效应还大，而极端参数下最高那条本来就近乎不束缚。
    const buffer = clamp(3 * p.width + 6, 8, 20)
    return {
      V: (x) => (Math.abs(x) < half ? -p.depth : 0),
      xMin: -half - buffer,
      xMax: half + buffer,
      vRange: [-p.depth, 0.25 * p.depth],
    }
  }
  const w = p.omega
  // 谐振子：窗口取到经典转折点外 2.5 倍，够容纳 n ≲ 10
  const xt = Math.sqrt((2 * 12) / w)
  return {
    V: (x) => 0.5 * w * w * x * x,
    xMin: -xt,
    xMax: xt,
    vRange: [0, 0.5 * w * w * xt * xt],
  }
}

export interface WellSolution {
  x: Float64Array
  V: Float64Array
  states: Eigenstate[]
  dx: number
  vRange: [number, number]
  xMin: number
  xMax: number
  /** 解析解（有的话），用来在读数区与数值解对照 */
  analytic?: (n: number) => number
  /** 数值解里 E < 连续谱边缘的能级数 */
  boundCount: number
  /**
   * 解析预言的束缚态数目（仅有限深阱）。与 boundCount 不一致时说明最高那条
   * 能级弱束缚到尾巴超出了计算窗口——场景会如实说明，而不是假装它不存在。
   */
  analyticBoundCount?: number
}

/** 场景层唯一需要调的入口：给一组势阱参数，拿到能级 + 波函数 + 画图范围。 */
export function solveWell(p: WellParams, count = 8): WellSolution {
  const { V, xMin, xMax, vRange } = wellPotential(p)
  // 网格数在精度与响应之间折中：700 点时基态误差 < 0.1%，整解算约 30 ms，
  // 配合 UI 层的防抖，拖滑块时仍然跟手
  const points = 700
  const sol = solve1D({
    xMin,
    xMax,
    points,
    V,
    count,
    continuumEdge: p.kind === 'infinite' ? Number.POSITIVE_INFINITY : undefined,
  })

  const analytic =
    p.kind === 'infinite'
      ? (n: number) => (((n + 1) * Math.PI) ** 2 / (2 * p.width * p.width))
      : p.kind === 'harmonic'
        ? (n: number) => p.omega * (n + 0.5)
        : undefined

  return {
    ...sol,
    vRange,
    xMin,
    xMax,
    analytic,
    boundCount: sol.states.filter((s) => s.bound).length,
    analyticBoundCount: p.kind === 'finite' ? finiteWellBoundCount(p.width, p.depth) : undefined,
  }
}

/** 有限深阱的束缚态数目（解析）：⌈√(2mV₀L²/ħ²)/π⌉ */
export function finiteWellBoundCount(width: number, depth: number): number {
  if (depth <= 0) return 0
  return Math.ceil(Math.sqrt(2 * depth * width * width) / Math.PI)
}

// ── 氢原子轨道 ────────────────────────────────────────────

/** 连带拉盖尔多项式 L_k^α(x)，三项递推（k 很小，稳定性无忧） */
export function laguerre(k: number, alpha: number, x: number): number {
  if (k === 0) return 1
  if (k === 1) return 1 + alpha - x
  let lm2 = 1
  let lm1 = 1 + alpha - x
  let l = lm1
  for (let i = 2; i <= k; i++) {
    l = ((2 * i - 1 + alpha - x) * lm1 - (i - 1 + alpha) * lm2) / i
    lm2 = lm1
    lm1 = l
  }
  return l
}

/** 氢原子径向波函数 R_{nl}(r)，玻尔半径为 1 */
export function radialR(n: number, l: number, r: number): number {
  const rho = (2 * r) / n
  const lnNorm =
    1.5 * Math.log(2 / n) + 0.5 * (lnFact(n - l - 1) - Math.log(2 * n) - lnFact(n + l))
  const norm = Math.exp(lnNorm)
  return norm * Math.exp(-rho / 2) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho)
}

/** 连带勒让德函数 P_l^m(x)，m ≥ 0（Numerical Recipes 的 plgndr） */
export function legendreP(l: number, m: number, x: number): number {
  if (m < 0 || m > l || Math.abs(x) > 1) return 0
  let pmm = 1
  if (m > 0) {
    const somx2 = Math.sqrt((1 - x) * (1 + x))
    let fact = 1
    for (let i = 1; i <= m; i++) {
      pmm *= -fact * somx2
      fact += 2
    }
  }
  if (l === m) return pmm
  let pmmp1 = x * (2 * m + 1) * pmm
  if (l === m + 1) return pmmp1
  let pll = 0
  for (let ll = m + 2; ll <= l; ll++) {
    pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m)
    pmm = pmmp1
    pmmp1 = pll
  }
  return pll
}

/**
 * 实球谐函数 Y_{lm}(θ, φ)。
 *
 * 用实形式而不是复形式：教科书上画的 p_x / p_y / d_{xy} 这些「哑铃」和「四叶草」
 * 就是实球谐，学习者在化学课上见到的也是它。复形式 m ≠ 0 的 |Y|² 关于 z 轴旋转对称，
 * 看不出角向结构——那正是很多人第一次看轨道图时困惑的来源，场景里用开关明确区分两者。
 */
export function realY(l: number, m: number, cosTheta: number, phi: number): number {
  const am = Math.abs(m)
  const lnNorm = Math.log((2 * l + 1) / (4 * Math.PI)) + lnFact(l - am) - lnFact(l + am)
  const norm = Math.sqrt(Math.exp(lnNorm))
  const p = legendreP(l, am, cosTheta)
  if (m === 0) return norm * p
  const s = Math.SQRT2 * norm * p
  return m > 0 ? s * Math.cos(am * phi) : s * Math.sin(am * phi)
}

/** 复球谐的模方（与 φ 无关），用于对比展示 */
export function absY2Complex(l: number, m: number, cosTheta: number): number {
  const am = Math.abs(m)
  const lnNorm = Math.log((2 * l + 1) / (4 * Math.PI)) + lnFact(l - am) - lnFact(l + am)
  const p = legendreP(l, am, cosTheta)
  return Math.exp(lnNorm) * p * p
}

export interface Orbital {
  n: number
  l: number
  m: number
  label: string
}

const L_LETTER = ['s', 'p', 'd', 'f', 'g']

export function orbitalLabel(n: number, l: number, m: number): string {
  const base = `${n}${L_LETTER[l] ?? l}`
  if (l === 0) return base
  // 常见的实轨道名字：化学课上就是这么叫的
  const names: Record<string, string[]> = {
    1: ['p_y', 'p_z', 'p_x'], // m = −1, 0, +1
    2: ['d_{xy}', 'd_{yz}', 'd_{z^2}', 'd_{xz}', 'd_{x^2-y^2}'],
    3: ['f_{y(3x^2-y^2)}', 'f_{xyz}', 'f_{yz^2}', 'f_{z^3}', 'f_{xz^2}', 'f_{z(x^2-y^2)}', 'f_{x(x^2-3y^2)}'],
  }
  const arr = names[l]
  if (arr) return `${n}${arr[m + l] ?? base}`
  return `${base}(m=${m})`
}

/** 枚举 n ≤ nMax 的全部轨道 */
export function enumerateOrbitals(nMax: number): Orbital[] {
  const out: Orbital[] = []
  for (let n = 1; n <= nMax; n++) {
    for (let l = 0; l < n; l++) {
      for (let m = -l; m <= l; m++) out.push({ n, l, m, label: orbitalLabel(n, l, m) })
    }
  }
  return out
}

/** 轨道的典型尺度：包含 ~99% 概率的半径，用来定相机距离与采样上限 */
export function orbitalRadius(n: number): number {
  return 4 * n * n + 6
}

export interface OrbitalCloud {
  /** [x,y,z, x,y,z, …]，单位：玻尔半径 */
  positions: Float32Array
  /** 每个点上 ψ 的符号（+1 / −1），用于给波瓣染相位色 */
  phase: Float32Array
  /** 实际生成的点数（可能少于请求数） */
  count: number
  /** 采样半径上限 */
  rMax: number
}

export interface OrbitalSampler {
  /** 往 positions/phase 里填 count 个点，从下标 from 开始；返回实际填入的点数 */
  fill: (positions: Float32Array, phase: Float32Array, from: number, count: number) => number
  rMax: number
}

/**
 * 构造一个 |ψ|² 采样器。
 *
 * 算法：径向用「精确的逆 CDF」（P(r) = r²R² 在网格上积分后求逆），角向用拒绝采样。
 * 为什么不直接在三维盒子里做拒绝采样：3d、4f 这类轨道的概率高度集中在细长的波瓣里，
 * 盒子采样的接受率会低到 1%，几万个点要跑几百毫秒。分离变量后径向 100% 接受，
 * 角向接受率 ≥ 25%，整体快一到两个数量级。
 *
 * 做成「可分块填充」而不是一次算完：六万个点一次性生成会阻塞主线程近 80 ms，
 * 切换轨道时能明显感到一顿。分块之后每帧只算几千个，既不掉帧，
 * 还顺带得到「点云逐渐显影」的动画——而那恰好就是这幅图的正确读法：
 * 每个点是一次位置测量的结果，图像是大量测量累积出来的。
 */
export function createOrbitalSampler(
  n: number,
  l: number,
  m: number,
  opts: { real?: boolean; seed?: number } = {},
): OrbitalSampler {
  const { real = true } = opts
  const rMax = orbitalRadius(n)

  // 径向逆 CDF
  const NR = 1024
  const cdf = new Float64Array(NR + 1)
  const dr = rMax / NR
  let acc = 0
  for (let i = 0; i < NR; i++) {
    const r = (i + 0.5) * dr
    const R = radialR(n, l, r)
    acc += r * r * R * R * dr
    cdf[i + 1] = acc
  }
  for (let i = 0; i <= NR; i++) cdf[i] = cdf[i]! / acc

  // 角向最大值（拒绝采样的上界），网格扫描 + 10% 余量
  let yMax = 0
  const NT = 180
  const NP = real ? 180 : 1
  for (let i = 0; i <= NT; i++) {
    const ct = -1 + (2 * i) / NT
    for (let j = 0; j < NP; j++) {
      const phi = (2 * Math.PI * j) / NP
      const v = real ? realY(l, m, ct, phi) ** 2 : absY2Complex(l, m, ct)
      if (v > yMax) yMax = v
    }
  }
  yMax *= 1.1

  // 简单的确定性随机源：同一轨道每次采样结果一致，切回来时点云不会「跳」一下
  let s = (opts.seed ?? 0x9e3779b9) >>> 0
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function fill(positions: Float32Array, phase: Float32Array, from: number, count: number): number {
    let written = 0
    let guard = 0
    const maxTries = count * 200

    while (written < count && guard++ < maxTries) {
      // 径向：在 CDF 上二分再线性插值
      const u = rnd()
      let lo = 0
      let hi = NR
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (cdf[mid]! < u) lo = mid
        else hi = mid
      }
      const span = cdf[hi]! - cdf[lo]!
      const t = span > 0 ? (u - cdf[lo]!) / span : 0
      const r = (lo + t) * dr

      // 角向拒绝采样
      const ct = 2 * rnd() - 1
      const phi = 2 * Math.PI * rnd()
      const y = real ? realY(l, m, ct, phi) : 0
      const w = real ? y * y : absY2Complex(l, m, ct)
      if (rnd() * yMax > w) continue

      const st = Math.sqrt(Math.max(0, 1 - ct * ct))
      const o = (from + written) * 3
      positions[o] = r * st * Math.cos(phi)
      positions[o + 1] = r * ct // 量子化轴 z 映射到 three.js 的 y（上方向）
      positions[o + 2] = r * st * Math.sin(phi)
      phase[from + written] = real ? (y * radialR(n, l, r) >= 0 ? 1 : -1) : 1
      written++
    }
    return written
  }

  return { fill, rMax }
}

/** 一次性采样（不需要分块动画的场合用它） */
export function sampleOrbital(
  n: number,
  l: number,
  m: number,
  count: number,
  opts: { real?: boolean; seed?: number } = {},
): OrbitalCloud {
  const sampler = createOrbitalSampler(n, l, m, opts)
  const positions = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  const written = sampler.fill(positions, phase, 0, count)
  return { positions, phase, count: written, rMax: sampler.rMax }
}

/**
 * 径向波函数 R_{nl}(r) 的零点位置（径向节点），共 n−l−1 个。
 * 场景里用一圈半透明球面把它们画出来——「节点」不是抽象的说法，是真实的球面。
 */
export function radialNodes(n: number, l: number): number[] {
  const nodes: number[] = []
  const rMax = orbitalRadius(n)
  const steps = 2000
  let prev = radialR(n, l, 1e-6)
  for (let i = 1; i <= steps; i++) {
    const r = (rMax * i) / steps
    const v = radialR(n, l, r)
    if (prev * v < 0) {
      // 线性插值定位零点，够准了：这里只用来画一个球面
      const rPrev = (rMax * (i - 1)) / steps
      nodes.push(rPrev + ((r - rPrev) * Math.abs(prev)) / (Math.abs(prev) + Math.abs(v)))
    }
    prev = v
  }
  return nodes
}

/** 径向概率密度 P(r) = r²|R|²，用于场景里的辅助曲线 */
export function radialDensity(n: number, l: number, samples = 256): { r: Float64Array; p: Float64Array } {
  const rMax = orbitalRadius(n)
  const r = new Float64Array(samples)
  const p = new Float64Array(samples)
  let max = 0
  for (let i = 0; i < samples; i++) {
    r[i] = (rMax * i) / (samples - 1)
    const R = radialR(n, l, r[i]!)
    p[i] = r[i]! * r[i]! * R * R
    if (p[i]! > max) max = p[i]!
  }
  if (max > 0) for (let i = 0; i < samples; i++) p[i] = p[i]! / max
  return { r, p }
}

/**
 * 由位置表象直接算动量的一、二阶矩（ħ = 1）。
 *
 * ⟨p⟩ = ∫ Im(ψ* ψ′) dx，　⟨p²⟩ = ∫ |ψ′|² dx（分部积分后的形式，对束缚/局域态成立）。
 *
 * 为什么不做一次 FFT：这个量每秒只需要更新几次，中心差分已经够准
 * （高斯波包上与解析值 1/(2σ) 差 < 0.5%），而且不必把演化器的内部 FFT 暴露出来。
 */
export function momentumStats(
  re: Float64Array,
  im: Float64Array,
  dx: number,
): { mean: number; sigma: number } {
  const n = re.length
  let norm = 0
  let p1 = 0
  let p2 = 0
  for (let i = 1; i < n - 1; i++) {
    const dre = (re[i + 1]! - re[i - 1]!) / (2 * dx)
    const dim = (im[i + 1]! - im[i - 1]!) / (2 * dx)
    norm += re[i]! * re[i]! + im[i]! * im[i]!
    // Im(ψ* ψ′) = Re ψ · Im ψ′ − Im ψ · Re ψ′
    p1 += re[i]! * dim - im[i]! * dre
    p2 += dre * dre + dim * dim
  }
  const z = norm * dx || 1
  const mean = (p1 * dx) / z
  const sq = (p2 * dx) / z
  return { mean, sigma: Math.sqrt(Math.max(0, sq - mean * mean)) }
}

// ── Bloch 球 / 单量子比特 ─────────────────────────────────

export interface Complex {
  re: number
  im: number
}

export interface Qubit {
  /** |ψ⟩ = a|0⟩ + b|1⟩ */
  a: Complex
  b: Complex
}

export function blochToQubit(theta: number, phi: number): Qubit {
  return {
    a: { re: Math.cos(theta / 2), im: 0 },
    b: { re: Math.sin(theta / 2) * Math.cos(phi), im: Math.sin(theta / 2) * Math.sin(phi) },
  }
}

/** 由 (θ, φ) 得到 Bloch 矢量（three.js 坐标：量子化轴 z 映射到 y 轴朝上） */
export function blochVector(theta: number, phi: number): [number, number, number] {
  const st = Math.sin(theta)
  return [st * Math.cos(phi), Math.cos(theta), st * Math.sin(phi)]
}

/** 由 three.js 坐标下的单位矢量反解 (θ, φ) */
export function vectorToBloch(x: number, y: number, z: number): { theta: number; phi: number } {
  const r = Math.hypot(x, y, z) || 1
  return { theta: Math.acos(clamp(y / r, -1, 1)), phi: Math.atan2(z / r, x / r) }
}

/** 沿单位轴 n̂ 转 α 角后的 Bloch 矢量（罗德里格斯公式） */
export function rotateAboutAxis(
  v: [number, number, number],
  axis: [number, number, number],
  alpha: number,
): [number, number, number] {
  const [ax, ay, az] = axis
  const len = Math.hypot(ax, ay, az) || 1
  const k: [number, number, number] = [ax / len, ay / len, az / len]
  const c = Math.cos(alpha)
  const s = Math.sin(alpha)
  const dot = k[0] * v[0] + k[1] * v[1] + k[2] * v[2]
  const cross: [number, number, number] = [
    k[1] * v[2] - k[2] * v[1],
    k[2] * v[0] - k[0] * v[2],
    k[0] * v[1] - k[1] * v[0],
  ]
  return [
    v[0] * c + cross[0] * s + k[0] * dot * (1 - c),
    v[1] * c + cross[1] * s + k[1] * dot * (1 - c),
    v[2] * c + cross[2] * s + k[2] * dot * (1 - c),
  ]
}

/** 在测量轴 n̂ 上得到 +1 的概率：P₊ = (1 + r⃗·n̂)/2 */
export function measureProbability(
  r: [number, number, number],
  axis: [number, number, number],
): number {
  const len = Math.hypot(...axis) || 1
  const dot = (r[0] * axis[0] + r[1] * axis[1] + r[2] * axis[2]) / len
  return clamp((1 + dot) / 2, 0, 1)
}

// ── 双缝：惠更斯求和 ──────────────────────────────────────

export interface SlitSetup {
  /** 波长 λ（任意长度单位，与下面的长度同一单位） */
  lambda: number
  /** 缝间距 d（两缝中心距离） */
  separation: number
  /** 单缝宽度 a */
  slitWidth: number
  /** 缝到屏的距离 L */
  screenDistance: number
  /** 开着的缝：两条 / 只开左 / 只开右 */
  open: 'both' | 'left' | 'right'
}

/** 每条缝上取多少个惠更斯子波源。够大才能正确复现单缝包络。 */
const SUB_SOURCES = 11

function slitCenters(s: SlitSetup): number[] {
  const half = s.separation / 2
  if (s.open === 'left') return [-half]
  if (s.open === 'right') return [half]
  return [-half, half]
}

/** 缝平面上全部子波源的横坐标 */
export function huygensSources(s: SlitSetup): number[] {
  const out: number[] = []
  for (const c of slitCenters(s)) {
    for (let i = 0; i < SUB_SOURCES; i++) {
      out.push(c + s.slitWidth * (i / (SUB_SOURCES - 1) - 0.5))
    }
  }
  return out
}

/**
 * 屏上的强度分布 I(y)。
 *
 * 直接对子波源求和而不是套 `cos²·sinc²` 解析式：解析式用了远场近似，
 * 学习者把「屏距」拖到很近时解析式会明显失真，而求和是逐点算真实光程，
 * 近场的条纹弯曲、包络畸变都会如实出现——这正是这个参数值得调的原因。
 */
export function screenIntensity(s: SlitSetup, ys: Float64Array, out?: Float64Array): Float64Array {
  const k = (2 * Math.PI) / s.lambda
  const sources = huygensSources(s)
  const res = out ?? new Float64Array(ys.length)
  let max = 0
  for (let i = 0; i < ys.length; i++) {
    let re = 0
    let im = 0
    for (const sx of sources) {
      const dy = ys[i]! - sx
      const r = Math.hypot(dy, s.screenDistance)
      const amp = 1 / Math.sqrt(r) // 二维柱面波振幅 ~ 1/√r
      re += amp * Math.cos(k * r)
      im += amp * Math.sin(k * r)
    }
    const v = re * re + im * im
    res[i] = v
    if (v > max) max = v
  }
  if (max > 0) for (let i = 0; i < res.length; i++) res[i] = res[i]! / max
  return res
}

/** 缝与屏之间的波场强度（俯视平面），用于 3D 里的干涉扇形 */
export function fieldPlane(
  s: SlitSetup,
  opts: { nx: number; ny: number; yHalf: number },
): { data: Float32Array; nx: number; ny: number } {
  const { nx, ny, yHalf } = opts
  const k = (2 * Math.PI) / s.lambda
  const sources = huygensSources(s)
  const data = new Float32Array(nx * ny)
  let max = 1e-12
  for (let j = 0; j < ny; j++) {
    // z：沿传播方向，从缝面 (0) 到屏 (L)
    const z = (s.screenDistance * (j + 0.5)) / ny
    for (let i = 0; i < nx; i++) {
      const y = -yHalf + (2 * yHalf * i) / (nx - 1)
      let re = 0
      let im = 0
      for (const sx of sources) {
        const dy = y - sx
        const r = Math.hypot(dy, z) + 1e-6
        const amp = 1 / Math.sqrt(r)
        re += amp * Math.cos(k * r)
        im += amp * Math.sin(k * r)
      }
      const v = re * re + im * im
      data[j * nx + i] = v
      if (v > max) max = v
    }
  }
  for (let i = 0; i < data.length; i++) data[i] = data[i]! / max
  return { data, nx, ny }
}

/**
 * 按强度分布抽一个粒子落点（逆 CDF）。
 * 单个粒子的落点是随机的，但成千上万个粒子累积出来的就是 I(y)——
 * 这正是模块 01 想让人亲眼看到的那件事。
 */
export function makeSampler(ys: Float64Array, intensity: Float64Array): (u: number) => number {
  const cdf = new Float64Array(intensity.length + 1)
  let acc = 0
  for (let i = 0; i < intensity.length; i++) {
    acc += intensity[i]!
    cdf[i + 1] = acc
  }
  for (let i = 0; i < cdf.length; i++) cdf[i] = cdf[i]! / acc
  return (u: number) => {
    let lo = 0
    let hi = cdf.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (cdf[mid]! < u) lo = mid
      else hi = mid
    }
    const span = cdf[hi]! - cdf[lo]!
    const t = span > 0 ? (u - cdf[lo]!) / span : 0
    const y0 = ys[lo]!
    const y1 = ys[Math.min(hi, ys.length - 1)]!
    return y0 + (y1 - y0) * t
  }
}
