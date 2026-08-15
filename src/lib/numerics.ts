/**
 * 数值工具箱 —— 所有交互模拟共用的计算核心。
 *
 * 单位约定：模拟内部一律取 ħ = m = 1（自然单位）。
 * 这样能量、长度、时间都是 O(1) 数量级，Float64 精度和滑块范围都好安排；
 * 换算回 SI 的公式见附录 C。
 *
 * 这个文件不依赖 DOM，可以单独在 node 里跑测试。
 */

export const HBAR = 1
export const MASS = 1

// ── 基础数组工具 ──────────────────────────────────────────

export function linspace(a: number, b: number, n: number): Float64Array {
  const out = new Float64Array(n)
  if (n === 1) {
    out[0] = a
    return out
  }
  const step = (b - a) / (n - 1)
  for (let i = 0; i < n; i++) out[i] = a + i * step
  return out
}

/** 复合梯形积分 */
export function trapz(y: ArrayLike<number>, dx: number): number {
  const n = y.length
  if (n < 2) return 0
  let s = (y[0]! + y[n - 1]!) / 2
  for (let i = 1; i < n - 1; i++) s += y[i]!
  return s * dx
}

/** 就地归一化复波函数，使 ∫|ψ|² dx = 1 */
export function normalize(re: Float64Array, im: Float64Array, dx: number): number {
  let s = 0
  for (let i = 0; i < re.length; i++) s += re[i]! * re[i]! + im[i]! * im[i]!
  const norm = Math.sqrt(s * dx)
  if (norm === 0 || !Number.isFinite(norm)) return 0
  for (let i = 0; i < re.length; i++) {
    re[i] = re[i]! / norm
    im[i] = im[i]! / norm
  }
  return norm
}

export function probabilityDensity(re: Float64Array, im: Float64Array, out?: Float64Array) {
  const p = out ?? new Float64Array(re.length)
  for (let i = 0; i < re.length; i++) p[i] = re[i]! * re[i]! + im[i]! * im[i]!
  return p
}

/** ⟨x⟩ */
export function expectationX(p: Float64Array, x: Float64Array, dx: number): number {
  let s = 0
  for (let i = 0; i < p.length; i++) s += p[i]! * x[i]!
  return s * dx
}

/** Δx = sqrt(⟨x²⟩ − ⟨x⟩²) */
export function spreadX(p: Float64Array, x: Float64Array, dx: number): number {
  const mean = expectationX(p, x, dx)
  let s = 0
  for (let i = 0; i < p.length; i++) s += p[i]! * (x[i]! - mean) * (x[i]! - mean)
  return Math.sqrt(Math.max(0, s * dx))
}

// ── 特殊函数 ──────────────────────────────────────────────

/**
 * 物理学家的 Hermite 多项式 H_n(x)，三项递推。
 * H_0 = 1, H_1 = 2x, H_{n+1} = 2x H_n − 2n H_{n−1}
 */
export function hermite(n: number, x: number): number {
  if (n === 0) return 1
  if (n === 1) return 2 * x
  let hm1 = 1
  let h = 2 * x
  for (let k = 1; k < n; k++) {
    const next = 2 * x * h - 2 * k * hm1
    hm1 = h
    h = next
  }
  return h
}

/** ln(n!)，用对数避免 n 稍大时 2^n·n! 溢出 */
export function lnFactorial(n: number): number {
  let s = 0
  for (let k = 2; k <= n; k++) s += Math.log(k)
  return s
}

/**
 * 谐振子定态波函数 ψ_n(x)，取 ħ = m = 1。
 * ψ_n(x) = (ω/π)^{1/4} · (2^n n!)^{−1/2} · H_n(√ω x) · e^{−ω x²/2}
 *
 * 直接算 H_n 会在 n≳20 时溢出，所以把归一化常数搬进指数一起算。
 */
export function harmonicEigenstate(n: number, x: number, omega = 1): number {
  const xi = Math.sqrt(omega) * x
  const logNorm = 0.25 * Math.log(omega / Math.PI) - 0.5 * (n * Math.LN2 + lnFactorial(n))
  const h = hermite(n, xi)
  if (h === 0) return 0
  const sign = Math.sign(h)
  // exp(logNorm + ln|H_n| − ξ²/2)：三项都在指数里做加减，全程不溢出
  return sign * Math.exp(logNorm + Math.log(Math.abs(h)) - (xi * xi) / 2)
}

/** 无限深势阱 [0, L] 的定态：ψ_n(x) = √(2/L)·sin(nπx/L) */
export function infiniteWellEigenstate(n: number, x: number, L: number): number {
  if (x <= 0 || x >= L) return 0
  return Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L)
}

/** 无限深势阱能级 E_n = n²π²ħ²/(2mL²) */
export function infiniteWellEnergy(n: number, L: number): number {
  return (n * n * Math.PI * Math.PI * HBAR * HBAR) / (2 * MASS * L * L)
}

// ── FFT（radix-2 迭代 Cooley–Tukey） ──────────────────────

/** 位反转置换表，长度必须是 2 的幂 */
function bitReverseTable(n: number): Uint32Array {
  const table = new Uint32Array(n)
  const bits = Math.log2(n)
  for (let i = 0; i < n; i++) {
    let rev = 0
    for (let b = 0; b < bits; b++) if (i & (1 << b)) rev |= 1 << (bits - 1 - b)
    table[i] = rev
  }
  return table
}

/**
 * 预计算旋转因子与位反转表的 FFT 计划。
 * split-operator 每帧要做 2 次 FFT，预计算能省掉大量 sin/cos。
 */
export class FFT {
  readonly n: number
  private readonly rev: Uint32Array
  private readonly cos: Float64Array
  private readonly sin: Float64Array

  constructor(n: number) {
    if (n < 2 || (n & (n - 1)) !== 0) throw new Error(`FFT 长度必须是 2 的幂，收到 ${n}`)
    this.n = n
    this.rev = bitReverseTable(n)
    this.cos = new Float64Array(n / 2)
    this.sin = new Float64Array(n / 2)
    for (let i = 0; i < n / 2; i++) {
      this.cos[i] = Math.cos((-2 * Math.PI * i) / n)
      this.sin[i] = Math.sin((-2 * Math.PI * i) / n)
    }
  }

  /** 就地变换。inverse=true 时做逆变换并除以 n。 */
  transform(re: Float64Array, im: Float64Array, inverse = false) {
    const { n, rev, cos, sin } = this

    for (let i = 0; i < n; i++) {
      const j = rev[i]!
      if (j > i) {
        let t = re[i]!
        re[i] = re[j]!
        re[j] = t
        t = im[i]!
        im[i] = im[j]!
        im[j] = t
      }
    }

    const s = inverse ? -1 : 1
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1
      const step = n / size
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += step) {
          const wr = cos[k]!
          const wi = s * sin[k]!
          const l = j + half
          const tr = re[l]! * wr - im[l]! * wi
          const ti = re[l]! * wi + im[l]! * wr
          re[l] = re[j]! - tr
          im[l] = im[j]! - ti
          re[j] = re[j]! + tr
          im[j] = im[j]! + ti
        }
      }
    }

    if (inverse) {
      for (let i = 0; i < n; i++) {
        re[i] = re[i]! / n
        im[i] = im[i]! / n
      }
    }
  }
}

/**
 * FFT 频率轴（与 numpy.fft.fftfreq 同序）：
 * [0, 1, …, n/2−1, −n/2, …, −1] × 2π/(n·dx)，直接就是波数 k。
 */
export function fftWavenumbers(n: number, dx: number): Float64Array {
  const k = new Float64Array(n)
  const factor = (2 * Math.PI) / (n * dx)
  for (let i = 0; i < n; i++) k[i] = (i < n / 2 ? i : i - n) * factor
  return k
}

// ── split-operator 时间演化 ───────────────────────────────

export type PotentialSpec = ((x: number) => number) | Float64Array

/**
 * 把矩形势垒对齐到网格，返回势能数组与网格上的**真实**宽度。
 *
 * 为什么必须对齐：直接写 `x => |x−c| < a/2 ? V₀ : 0` 时，落进势垒的格点数是
 * ⌊a/dx⌋ 或 ⌈a/dx⌉，随 a 连续变化会整格跳变。由于 T ~ e^{−2κa}，
 * 半格的宽度误差就能让透射率偏离解析值 15%——学生会看到数值曲线和
 * 解析曲线对不上，并且拖滑块时 T 阶梯式抖动。对齐后两者误差降到 0.3%。
 */
export function rectBarrierOnGrid(
  x: Float64Array,
  opts: { center: number; width: number; height: number },
): { V: Float64Array; width: number; cells: number; iStart: number; iEnd: number } {
  const n = x.length
  const dx = x[1]! - x[0]!
  const cells = Math.max(1, Math.round(opts.width / dx))
  // 以离 center 最近的格点为中心向两侧铺开，保证格点数恒等于 cells
  const iCenter = Math.round((opts.center - x[0]!) / dx)
  const iStart = Math.max(0, iCenter - Math.floor(cells / 2))
  const iEnd = Math.min(n, iStart + cells)
  const V = new Float64Array(n)
  for (let i = iStart; i < iEnd; i++) V[i] = opts.height
  return { V, width: (iEnd - iStart) * dx, cells: iEnd - iStart, iStart, iEnd }
}

/**
 * 分步算符法演化 iħ∂ψ/∂t = [−ħ²/2m ∂²ₓ + V(x)]ψ。
 *
 * 一步用对称分裂 e^{−iVdt/2ħ} e^{−iT dt/ħ} e^{−iVdt/2ħ}，误差 O(dt³)，
 * 且严格幺正——波包跑上万步范数也不掉，这是选它而不是显式差分的原因。
 * 代价是隐含周期边界，所以势垒两侧要留足缓冲区，并在边缘加吸收层。
 */
export class SplitOperator {
  readonly n: number
  readonly dx: number
  readonly x: Float64Array
  readonly re: Float64Array
  readonly im: Float64Array

  private readonly fft: FFT
  private readonly V: Float64Array
  private readonly expV: { re: Float64Array; im: Float64Array }
  private readonly expT: { re: Float64Array; im: Float64Array }
  private readonly damping: Float64Array | null
  private dt: number

  constructor(opts: {
    n: number
    xMin: number
    xMax: number
    dt: number
    /** 势能：给函数则逐点采样，给数组则直接用（配合 rectBarrierOnGrid 做网格对齐） */
    potential: PotentialSpec
    /** 边缘吸收层宽度（占总长比例）。设 0 关闭，则边界为周期性。 */
    absorbFraction?: number
  }) {
    const { n, xMin, xMax, dt, potential, absorbFraction = 0.08 } = opts
    this.n = n
    this.dx = (xMax - xMin) / n
    this.dt = dt
    this.x = new Float64Array(n)
    for (let i = 0; i < n; i++) this.x[i] = xMin + i * this.dx

    this.re = new Float64Array(n)
    this.im = new Float64Array(n)
    this.fft = new FFT(n)

    this.V = new Float64Array(n)
    this.fillPotential(potential)

    this.expV = { re: new Float64Array(n), im: new Float64Array(n) }
    this.expT = { re: new Float64Array(n), im: new Float64Array(n) }
    this.buildPropagators()

    if (absorbFraction > 0) {
      // cos^(1/8) 型吸收掩模：出射波在边缘被吃掉，避免绕回来假装成反射波
      const w = Math.max(1, Math.floor(n * absorbFraction))
      this.damping = new Float64Array(n).fill(1)
      for (let i = 0; i < w; i++) {
        const s = Math.pow(Math.cos((Math.PI / 2) * ((w - i) / w)), 1 / 8)
        this.damping[i] = s
        this.damping[n - 1 - i] = s
      }
    } else {
      this.damping = null
    }
  }

  private buildPropagators() {
    const { n, dt, V } = this
    for (let i = 0; i < n; i++) {
      const phase = (-V[i]! * dt) / (2 * HBAR)
      this.expV.re[i] = Math.cos(phase)
      this.expV.im[i] = Math.sin(phase)
    }
    const k = fftWavenumbers(n, this.dx)
    for (let i = 0; i < n; i++) {
      const phase = (-(HBAR * k[i]! * k[i]!) * dt) / (2 * MASS)
      this.expT.re[i] = Math.cos(phase)
      this.expT.im[i] = Math.sin(phase)
    }
  }

  get potential(): Float64Array {
    return this.V
  }

  private fillPotential(potential: PotentialSpec) {
    if (typeof potential === 'function') {
      for (let i = 0; i < this.n; i++) this.V[i] = potential(this.x[i]!)
    } else {
      if (potential.length !== this.n) {
        throw new Error(`势能数组长度 ${potential.length} 与网格 ${this.n} 不符`)
      }
      this.V.set(potential)
    }
  }

  /** 换势能（例如拖动势垒高度滑块）后重建传播子，波函数保持不变 */
  setPotential(potential: PotentialSpec) {
    this.fillPotential(potential)
    this.buildPropagators()
  }

  setDt(dt: number) {
    this.dt = dt
    this.buildPropagators()
  }

  /** 装入高斯波包 ψ(x) = (2πσ²)^{−1/4} exp(−(x−x₀)²/4σ²) e^{ik₀x} */
  setGaussian(x0: number, k0: number, sigma: number) {
    const norm = Math.pow(2 * Math.PI * sigma * sigma, -0.25)
    for (let i = 0; i < this.n; i++) {
      const dxi = this.x[i]! - x0
      const env = norm * Math.exp(-(dxi * dxi) / (4 * sigma * sigma))
      this.re[i] = env * Math.cos(k0 * this.x[i]!)
      this.im[i] = env * Math.sin(k0 * this.x[i]!)
    }
    normalize(this.re, this.im, this.dx)
  }

  private multiplyPhase(p: { re: Float64Array; im: Float64Array }) {
    const { re, im, n } = this
    for (let i = 0; i < n; i++) {
      const a = re[i]!
      const b = im[i]!
      re[i] = a * p.re[i]! - b * p.im[i]!
      im[i] = a * p.im[i]! + b * p.re[i]!
    }
  }

  /** 前进一个 dt */
  step() {
    this.multiplyPhase(this.expV)
    this.fft.transform(this.re, this.im, false)
    this.multiplyPhase(this.expT)
    this.fft.transform(this.re, this.im, true)
    this.multiplyPhase(this.expV)
    if (this.damping) {
      for (let i = 0; i < this.n; i++) {
        this.re[i] = this.re[i]! * this.damping[i]!
        this.im[i] = this.im[i]! * this.damping[i]!
      }
    }
  }

  steps(count: number) {
    for (let i = 0; i < count; i++) this.step()
  }

  /** 剩余总概率（吸收层吃掉的部分不再计入，可用来看波包是否已跑出窗口） */
  norm(): number {
    let s = 0
    for (let i = 0; i < this.n; i++) s += this.re[i]! ** 2 + this.im[i]! ** 2
    return s * this.dx
  }

  /** x < xSplit 区域的概率，配合势垒中心即为「反射概率」 */
  probabilityLeftOf(xSplit: number): number {
    let s = 0
    for (let i = 0; i < this.n; i++) {
      if (this.x[i]! >= xSplit) break
      s += this.re[i]! ** 2 + this.im[i]! ** 2
    }
    return s * this.dx
  }
}

// ── 解析结果：矩形势垒透射率 ──────────────────────────────

/**
 * 单粒子平面波穿过高 V₀、宽 a 的矩形势垒的透射系数（ħ = m = 1）。
 * E < V₀ 与 E > V₀ 分别用双曲/三角形式，E = V₀ 处取极限值。
 * 用来和 split-operator 的数值结果对照——两条曲线该重合。
 */
export function barrierTransmission(E: number, V0: number, a: number): number {
  if (E <= 0) return 0
  if (V0 === 0) return 1
  if (Math.abs(E - V0) < 1e-12) {
    const k = Math.sqrt(2 * MASS * E) / HBAR
    return 1 / (1 + (k * a) ** 2 / 4)
  }
  if (E < V0) {
    const kappa = Math.sqrt(2 * MASS * (V0 - E)) / HBAR
    const sh = Math.sinh(kappa * a)
    return 1 / (1 + (V0 * V0 * sh * sh) / (4 * E * (V0 - E)))
  }
  const k2 = Math.sqrt(2 * MASS * (E - V0)) / HBAR
  const sn = Math.sin(k2 * a)
  return 1 / (1 + (V0 * V0 * sn * sn) / (4 * E * (E - V0)))
}
