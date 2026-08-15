/**
 * 公式速查面板的数据源（对应附录 B）。
 * 新增条目直接往下加即可，面板与附录 B 页面共用这份数据。
 */

export interface FormulaItem {
  /** 名称 */
  name: string
  latex: string
  /** 一句话说明何时用它 */
  note?: string
  /** 出处小节 id，可点进去 */
  ref?: string
}

export interface FormulaGroup {
  id: string
  title: string
  items: FormulaItem[]
}

export const FORMULA_GROUPS: FormulaGroup[] = [
  {
    id: 'basics',
    title: '基本方程',
    items: [
      {
        name: '含时薛定谔方程',
        latex: '\\ii\\hbar\\frac{\\partial}{\\partial t}\\Psi(x,t)=\\hat H\\,\\Psi(x,t)',
        note: '量子力学的运动方程，一阶时间导数',
        ref: '02-wavefunction/04-time-dependent-schrodinger',
      },
      {
        name: '定态薛定谔方程',
        latex: '-\\frac{\\hbar^2}{2m}\\frac{\\dd^2\\psi}{\\dd x^2}+V(x)\\psi=E\\psi',
        note: '本征值问题；解出 E 与 ψ',
        ref: '02-wavefunction/03-time-independent-schrodinger',
      },
      {
        name: '哈密顿算符',
        latex: '\\hat H=\\frac{\\hat p^2}{2m}+V(\\hat x),\\qquad \\hat p=-\\ii\\hbar\\frac{\\partial}{\\partial x}',
        ref: '02-wavefunction/03-time-independent-schrodinger',
      },
      {
        name: '定态的时间演化',
        latex: '\\Psi(x,t)=\\psi(x)\\,\\ee^{-\\ii Et/\\hbar}',
        note: '只多一个整体相位，|Ψ|² 不随时间变',
        ref: '02-wavefunction/05-stationary-states',
      },
    ],
  },
  {
    id: 'probability',
    title: '概率与期望值',
    items: [
      {
        name: 'Born 规则',
        latex: 'P(a\\le x\\le b)=\\int_a^b|\\Psi(x,t)|^2\\,\\dd x',
        ref: '02-wavefunction/01-born-rule',
      },
      {
        name: '归一化条件',
        latex: '\\int_{-\\infty}^{\\infty}|\\Psi(x,t)|^2\\,\\dd x=1',
        ref: '02-wavefunction/02-normalization-and-current',
      },
      {
        name: '概率流密度',
        latex:
          'j=\\frac{\\hbar}{2m\\ii}\\left(\\Psi^*\\frac{\\partial\\Psi}{\\partial x}-\\Psi\\frac{\\partial\\Psi^*}{\\partial x}\\right)',
        note: '满足连续性方程 ∂ρ/∂t + ∂j/∂x = 0',
        ref: '02-wavefunction/02-normalization-and-current',
      },
      {
        name: '期望值',
        latex: '\\langle \\hat A\\rangle=\\int \\Psi^*\\hat A\\,\\Psi\\,\\dd x',
        ref: '02-wavefunction/06-expectation-and-uncertainty',
      },
      {
        name: '不确定性原理',
        latex: '\\sigma_x\\sigma_p\\ge\\frac{\\hbar}{2}',
        ref: '02-wavefunction/06-expectation-and-uncertainty',
      },
      {
        name: 'Ehrenfest 定理',
        latex:
          '\\frac{\\dd\\langle x\\rangle}{\\dd t}=\\frac{\\langle p\\rangle}{m},\\qquad \\frac{\\dd\\langle p\\rangle}{\\dd t}=\\left\\langle-\\frac{\\partial V}{\\partial x}\\right\\rangle',
        note: '期望值遵守牛顿方程',
        ref: '02-wavefunction/06-expectation-and-uncertainty',
      },
    ],
  },
  {
    id: 'solutions',
    title: '一维精确解',
    items: [
      {
        name: '无限深势阱',
        latex:
          '\\psi_n=\\sqrt{\\tfrac{2}{L}}\\sin\\frac{n\\pi x}{L},\\qquad E_n=\\frac{n^2\\pi^2\\hbar^2}{2mL^2}',
        ref: '02-wavefunction/07-infinite-well',
      },
      {
        name: '谐振子能级',
        latex: 'E_n=\\left(n+\\tfrac12\\right)\\hbar\\omega,\\qquad n=0,1,2,\\dots',
        ref: '02-wavefunction/09-harmonic-oscillator',
      },
      {
        name: '谐振子基态',
        latex: '\\psi_0=\\left(\\frac{m\\omega}{\\pi\\hbar}\\right)^{1/4}\\ee^{-m\\omega x^2/2\\hbar}',
        ref: '02-wavefunction/09-harmonic-oscillator',
      },
      {
        name: '升降算符',
        latex:
          '\\hat a_\\pm=\\frac{1}{\\sqrt{2\\hbar m\\omega}}(\\mp \\ii\\hat p+m\\omega\\hat x),\\qquad [\\hat a_-,\\hat a_+]=1',
        ref: '02-wavefunction/09-harmonic-oscillator',
      },
      {
        name: '高斯波包',
        latex: '\\Psi(x,0)=(2\\pi\\sigma^2)^{-1/4}\\ee^{-(x-x_0)^2/4\\sigma^2}\\ee^{\\ii k_0x}',
        ref: '02-wavefunction/10-free-particle',
      },
      {
        name: '自由粒子色散关系',
        latex: '\\omega(k)=\\frac{\\hbar k^2}{2m},\\qquad v_g=\\frac{\\dd\\omega}{\\dd k}=\\frac{\\hbar k}{m}',
        note: '群速度是相速度的两倍',
        ref: '02-wavefunction/10-free-particle',
      },
      {
        name: '矩形势垒透射率（E < V₀）',
        latex: 'T=\\left[1+\\frac{V_0^2\\sinh^2(\\kappa a)}{4E(V_0-E)}\\right]^{-1},\\quad \\kappa=\\frac{\\sqrt{2m(V_0-E)}}{\\hbar}',
        ref: '02-wavefunction/11-tunneling',
      },
      {
        name: '厚垒近似',
        latex: 'T\\approx\\frac{16E(V_0-E)}{V_0^2}\\ee^{-2\\kappa a}',
        note: 'κa ≫ 1 时用；指数因子是主导项',
        ref: '02-wavefunction/11-tunneling',
      },
    ],
  },
  {
    id: 'constants',
    title: '常数与换算',
    items: [
      { name: '约化普朗克常数', latex: '\\hbar=1.054\\,571\\times10^{-34}\\ \\text{J·s}=6.582\\times10^{-16}\\ \\text{eV·s}' },
      { name: '电子质量', latex: 'm_e=9.109\\times10^{-31}\\ \\text{kg}=511\\ \\text{keV}/c^2' },
      { name: '玻尔半径', latex: 'a_0=\\frac{4\\pi\\varepsilon_0\\hbar^2}{m_ee^2}=0.529\\ \\text{Å}' },
      { name: '氢原子基态能', latex: 'E_1=-13.606\\ \\text{eV}' },
      { name: '精细结构常数', latex: '\\alpha=\\frac{e^2}{4\\pi\\varepsilon_0\\hbar c}\\approx\\frac{1}{137.036}' },
      {
        name: '常用换算',
        latex: '\\hbar c=197.3\\ \\text{eV·nm},\\qquad k_BT\\big|_{300\\text{K}}=25.9\\ \\text{meV}',
      },
    ],
  },
]
