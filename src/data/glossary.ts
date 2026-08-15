/**
 * 术语表：正文里 <Term id="..."> 的悬浮解释来源。
 * 一个术语只在这里定义一次，全站复用；也是将来做「术语索引」页的数据源。
 */

export interface GlossaryEntry {
  term: string
  /** 英文原名，帮读者对上外文教材；英文页面直接拿它当词条名 */
  en?: string
  definition: string
  /** 英文释义。缺省时英文页面退回中文释义，与全站 i18n 的降级策略一致 */
  definitionEn?: string
  /** 首次系统讲解的小节 id */
  ref?: string
  refLabel?: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  wavefunction: {
    term: '波函数',
    en: 'wave function',
    definition:
      '描述量子体系状态的复值函数 Ψ(x,t)。它本身不是可观测量，但 |Ψ|² 给出粒子出现在各处的概率密度。',
    definitionEn:
      'The complex-valued function Ψ(x,t) describing the state of a quantum system. It is not itself observable, but |Ψ|² gives the probability density for finding the particle at each point.',
    ref: '02-wavefunction/01-born-rule',
    refLabel: '2.1',
  },
  bornRule: {
    term: 'Born 规则',
    en: 'Born rule',
    definition:
      '把波函数与实验联系起来的公设：在 [a,b] 内找到粒子的概率等于 ∫|Ψ|²dx。1926 年由 Max Born 提出，也是他唯一因之获诺奖的工作。',
    definitionEn:
      'The postulate connecting the wavefunction to experiment: the probability of finding the particle in [a,b] equals ∫|Ψ|²dx. Proposed by Max Born in 1926, and the sole work for which he received the Nobel Prize.',
    ref: '02-wavefunction/01-born-rule',
    refLabel: '2.1',
  },
  normalization: {
    term: '归一化',
    en: 'normalization',
    definition: '要求 ∫|Ψ|²dx = 1，即「粒子一定在某处」。薛定谔方程保证一旦归一化就永远归一化。',
    definitionEn:
      'The requirement ∫|Ψ|²dx = 1, i.e. “the particle is definitely somewhere”. The Schrödinger equation guarantees that once normalised, always normalised.',
    ref: '02-wavefunction/02-normalization-and-current',
    refLabel: '2.2',
  },
  stationaryState: {
    term: '定态',
    en: 'stationary state',
    definition:
      '能量本征态。时间演化只贡献一个整体相位 e^{−iEt/ħ}，因此所有可观测量的期望值都不随时间变化——「定」的是概率分布，不是粒子静止。',
    definitionEn:
      'An energy eigenstate. Time evolution contributes only a global phase e^{−iEt/ħ}, so every expectation value is constant in time — what is stationary is the probability distribution, not the particle.',
    ref: '02-wavefunction/05-stationary-states',
    refLabel: '2.5',
  },
  eigenvalue: {
    term: '本征值',
    en: 'eigenvalue',
    definition: '满足 Âψ = aψ 的常数 a。厄米算符的本征值必为实数，对应可以测到的数值。',
    definitionEn:
      'The constant a in Âψ = aψ. Eigenvalues of a Hermitian operator are necessarily real, and are the values a measurement can return.',
    ref: '03-formalism/04-linear-operators',
    refLabel: '3.4',
  },
  hamiltonian: {
    term: '哈密顿算符',
    en: 'Hamiltonian',
    definition:
      '体系的总能量算符 Ĥ = p̂²/2m + V(x̂)。它既决定能级（定态方程的本征值），也决定时间演化。',
    definitionEn:
      'The total-energy operator Ĥ = p̂²/2m + V(x̂). It fixes both the energy levels (as eigenvalues of the stationary equation) and the time evolution.',
    ref: '02-wavefunction/03-time-independent-schrodinger',
    refLabel: '2.3',
  },
  expectation: {
    term: '期望值',
    en: 'expectation value',
    definition:
      '对同一个态制备的大量拷贝重复测量所得的平均值 ⟨Â⟩ = ∫Ψ*ÂΨdx。它不是「单次测量最可能的结果」。',
    definitionEn:
      'The average ⟨Â⟩ = ∫Ψ*ÂΨdx over repeated measurements on many identically prepared copies. It is not “the most likely result of a single measurement”.',
    ref: '02-wavefunction/06-expectation-and-uncertainty',
    refLabel: '2.6',
  },
  uncertainty: {
    term: '不确定性原理',
    en: 'uncertainty principle',
    definition:
      'σₓσ_p ≥ ħ/2。它是关于「态本身」的陈述——位置分布窄的态必然动量分布宽，与测量仪器精度无关。',
    definitionEn:
      'σₓσ_p ≥ ħ/2. A statement about the state itself — a state narrow in position is necessarily broad in momentum, independently of instrument precision.',
    ref: '02-wavefunction/06-expectation-and-uncertainty',
    refLabel: '2.6',
  },
  tunneling: {
    term: '隧道效应',
    en: 'quantum tunneling',
    definition:
      '粒子以非零概率穿过能量上本不该穿过的势垒。α 衰变、扫描隧道显微镜、闪存的读写都依赖它。',
    definitionEn:
      'A particle passing, with non-zero probability, through a barrier it does not have the energy to cross. Alpha decay, the scanning tunnelling microscope and flash memory all depend on it.',
    ref: '02-wavefunction/11-tunneling',
    refLabel: '2.11',
  },
  wavePacket: {
    term: '波包',
    en: 'wave packet',
    definition:
      '一群不同波数的平面波叠加成的局域化波形。它以群速度 v_g = dω/dk 移动，并因色散而随时间展宽。',
    definitionEn:
      'A localised waveform built by superposing plane waves of different wave numbers. It travels at the group velocity v_g = dω/dk and spreads in time because of dispersion.',
    ref: '02-wavefunction/10-free-particle',
    refLabel: '2.10',
  },
  superposition: {
    term: '叠加态',
    en: 'superposition',
    definition:
      '若 ψ₁ 与 ψ₂ 都是允许的状态，则 c₁ψ₁ + c₂ψ₂ 也是。这是薛定谔方程线性性的直接结果，也是量子计算并行性的来源。',
    definitionEn:
      'If ψ₁ and ψ₂ are allowed states, so is c₁ψ₁ + c₂ψ₂. A direct consequence of the linearity of the Schrödinger equation, and the source of parallelism in quantum computing.',
    ref: '02-wavefunction/05-stationary-states',
    refLabel: '2.5',
  },
  hermitian: {
    term: '厄米算符',
    en: 'Hermitian operator',
    definition: '满足 ⟨f|Âg⟩ = ⟨Âf|g⟩ 的算符。可观测量必须由厄米算符表示，因为它保证测量结果是实数。',
    definitionEn:
      'An operator satisfying ⟨f|Âg⟩ = ⟨Âf|g⟩. Observables must be represented by Hermitian operators, because that guarantees real measurement outcomes.',
    ref: '03-formalism/05-hermitian-operators',
    refLabel: '3.5',
  },
  correspondence: {
    term: '对应原理',
    en: 'correspondence principle',
    definition:
      '量子数很大时，量子力学的预言应当回到经典结果。Bohr 用它作为构造早期量子论的指导原则。',
    definitionEn:
      'At large quantum numbers, quantum predictions should reduce to the classical result. Bohr used it as the guiding principle for building the old quantum theory.',
    ref: '01-history/04-bohr-model',
    refLabel: '1.4',
  },
  degeneracy: {
    term: '简并',
    en: 'degeneracy',
    definition: '同一个能量本征值对应多个线性无关本征态。简并总是与某种对称性相联系。',
    definitionEn:
      'Several linearly independent eigenstates sharing one energy eigenvalue. Degeneracy is always tied to some symmetry.',
    ref: '06-hydrogen/04-energy-levels',
    refLabel: '6.4',
  },
  zeroPoint: {
    term: '零点能',
    en: 'zero-point energy',
    definition:
      '基态能量不为零的现象，如谐振子的 ħω/2。它是不确定性原理的直接后果：粒子无法同时静止且定位。',
    definitionEn:
      'The fact that the ground-state energy is non-zero, such as ħω/2 for the harmonic oscillator. A direct consequence of the uncertainty principle: a particle cannot be at rest and localised at once.',
    ref: '02-wavefunction/09-harmonic-oscillator',
    refLabel: '2.9',
  },
}
