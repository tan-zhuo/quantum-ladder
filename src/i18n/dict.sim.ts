/**
 * 2D 交互模拟、自测题、公式速查、章节壳层的译文。
 *
 * 和其他 dict 一样：**键是中文原文**，漏翻退回中文。
 * 引导语里的 `反引号片段` 由 src/components/sim/rich.tsx 渲染成 <code>，
 * 译文里保留同样的反引号即可。
 */
export const DICT_SIM: Record<string, string> = {
  // ── 无限深势阱模拟 ──
  '一维无限深势阱': 'The infinite square well',
  '拖动宽度 `L` 与量子数 `n`，看能量、波形与概率分布怎么一起变。单位取 ħ = m = 1。':
    'Drag the width `L` and the quantum number `n` and watch the energy, the waveform and the probability distribution move together. Units: ħ = m = 1.',
  'x  （势阱宽度 L 为单位长度）': 'x  (in units of the well width L)',
  '纵轴按 √E 均匀': 'vertical axis linear in √E',
  '能级图': 'Energy levels',
  '无限深势阱波函数，阱宽 {0}，量子数 {1}':
    'Infinite-well wavefunction, well width {0}, quantum number {1}',
  '能量 Eₙ (n={0})': 'Energy Eₙ (n={0})',
  '平均能量 ⟨E⟩': 'Mean energy ⟨E⟩',
  '相对 E₁(L=1)': 'relative to E₁(L=1)',
  '阱宽 `L`': 'Well width `L`',
  '缩小盒子，所有能级一起被顶上去：E ∝ 1/L²':
    'Shrink the box and every level is pushed up together: E ∝ 1/L²',
  '量子数 `n`': 'Quantum number `n`',
  '节点数 = n − 1 = {0}（不含两端）': 'nodes = n − 1 = {0} (endpoints excluded)',
  '叠加系数 c₁…c₄（自动归一化）': 'Superposition coefficients c₁…c₄ (auto-normalised)',
  '状态': 'State',
  '定态 ψₙ': 'Stationary ψₙ',
  '单个能量本征态': 'A single energy eigenstate',
  '叠加态': 'Superposition',
  '多个本征态的线性组合，随时间演化':
    'A linear combination of several eigenstates, evolving in time',
  '显示 ψ': 'Show ψ',
  '显示 |ψ|²': 'Show |ψ|²',
  '把 `L` 从 2.5 拖到 0.6，盯住能级图上那条虚线（固定在 E₁(L=1) 的参考能量）：它会一路沉到图的底部，也就是说所有能级都远远升到了它上面。读数区的「相对 E₁(L=1)」会从 0.16 涨到 2.78 ——「把粒子关得越紧，它的动能越大」，这就是 `ΔxΔp ≥ ħ/2` 的一个直接后果。':
    'Drag `L` from 2.5 down to 0.6 and keep your eye on the dashed line in the level diagram (pinned at the reference energy E₁(L=1)): it sinks all the way to the bottom, meaning every level has risen far above it. The "relative to E₁(L=1)" readout climbs from 0.16 to 2.78 — "the tighter you confine a particle, the more kinetic energy it has", a direct consequence of `ΔxΔp ≥ ħ/2`.',
  '在定态下改变 `n`，注意 `|ψ|²` 始终不随时间变化（曲线是静止的）；切到叠加态并播放，`|ψ|²` 立刻开始左右晃。「定态」定的就是这件事。':
    'Change `n` in the stationary mode and note that `|ψ|²` never changes with time (the curve stands still); switch to a superposition, press play, and `|ψ|²` immediately starts sloshing. That is exactly what "stationary" refers to.',
  '叠加态里只留 c₁（其余拖到 0），播放——概率密度又不动了。单个本征态无论怎么演化都只是整体乘一个相位 `e^(−iEₙt/ħ)`，观测量看不见它。':
    'Leave only c₁ in the superposition (drag the rest to 0) and press play — the probability density stops moving again. However long a single eigenstate evolves, it only picks up an overall phase `e^(−iEₙt/ħ)`, which no observable can see.',
  '让 n 取 10 以上再看 `|ψ|²`：条纹密到接近均匀分布，正是经典粒子在盒子里「哪儿都可能」的图像——对应原理在这里现身。':
    'Push n above 10 and look at `|ψ|²`: the fringes get so fine that the distribution is nearly uniform — the classical picture of a particle equally likely to be anywhere in the box. The correspondence principle, in view.',

  // ── 谐振子模拟 ──
  '一维谐振子': 'The one-dimensional harmonic oscillator',
  '等间距能级、零点能、渗进经典禁区的尾巴，以及唯一一种「像经典粒子」的量子态。单位取 ħ = m = 1。':
    'Equally spaced levels, zero-point energy, tails reaching into the classically forbidden region, and the one quantum state that really does behave like a classical particle. Units: ħ = m = 1.',
  'x  （√(ħ/mω) 为单位）': 'x  (in units of √(ħ/mω))',
  '经典禁区 →': 'classically forbidden →',
  '经典 P(x)': 'classical P(x)',
  't = {0}   经典周期 T = {1}': 't = {0}   classical period T = {1}',
  '能级间距 ħω': 'Level spacing ħω',
  '经典转折点 ±A': 'Classical turning point ±A',
  '零点能 E₀': 'Zero-point energy E₀',
  '角频率 `ω`': 'Angular frequency `ω`',
  '势阱变陡 → 能级间距 ħω 变大，波函数被压窄':
    'A steeper well → larger spacing ħω and a narrower wavefunction',
  '相干态振幅 `α`': 'Coherent-state amplitude `α`',
  '平均光子数 |α|² = {0}；α → 0 就是基态':
    'mean photon number |α|² = {0}; α → 0 is the ground state',
  '节点数 = n = {0}': 'nodes = n = {0}',
  '视图': 'View',
  '能级阶梯': 'Level ladder',
  '教科书式：每条 ψₙ 画在自己的能级上':
    'Textbook style: each ψₙ drawn on its own energy level',
  '单个本征态': 'Single eigenstate',
  '放大看一个 ψₙ 的细节': 'Zoom in on the detail of one ψₙ',
  '不弥散的振荡波包': 'An oscillating wave packet that never spreads',
  '对照经典分布': 'Compare with classical',
  '谐振子，视图 {0}，量子数 {1}，角频率 {2}':
    'Harmonic oscillator, view {0}, quantum number {1}, angular frequency {2}',
  '在「能级阶梯」下把 `n` 拉到 8：能级之间永远等距 `ħω`。这是谐振子独有的——回头看无限深势阱，那里的间距是越往上越大的。':
    'In the "level ladder" view, push `n` up to 8: the levels stay exactly `ħω` apart. This is unique to the oscillator — look back at the infinite well, where the spacing grows as you climb.',
  '把 `ω` 调小到 0.4，注意基态能 `E₀ = ħω/2` 变小但绝不为零。想让 E₀ = 0 就得让粒子精确停在 x = 0 且 p = 0，`ΔxΔp ≥ ħ/2` 不允许。':
    'Turn `ω` down to 0.4 and note that the ground-state energy `E₀ = ħω/2` shrinks but never reaches zero. Making E₀ = 0 would require the particle to sit exactly at x = 0 with p = 0, and `ΔxΔp ≥ ħ/2` forbids it.',
  '切到「单个本征态」+ 显示 ψ，看 n = 0 的曲线在两条虚线（经典转折点）之外并没有归零——粒子有确定的概率出现在经典能量禁止的区域。这就是隧道效应的同一个根源。':
    'Switch to "single eigenstate" with ψ shown and look at the n = 0 curve beyond the two dashed lines (the classical turning points): it has not gone to zero. The particle has a definite probability of being where classical energy conservation forbids — the very same root as tunnelling.',
  '显示 |ψ|² 并打开「对照经典分布」，把 n 从 0 加到 20：量子概率密度的振荡包络越来越贴合经典曲线（两端概率大，因为经典粒子在转折点最慢）。':
    'Show |ψ|², turn on "compare with classical", and take n from 0 to 20: the envelope of the quantum oscillation hugs the classical curve ever more closely (the ends are favoured because a classical particle moves slowest at the turning points).',
  '切到「相干态」播放：波包整体来回振荡、形状不变、周期恰好是经典周期 `T = 2π/ω`。这是薛定谔 1926 年就找出来的「最像经典粒子」的量子态，也是激光的理论描述。':
    'Switch to "coherent state" and press play: the packet oscillates back and forth as a whole, keeps its shape, and its period is exactly the classical `T = 2π/ω`. Schrödinger found this most classical of quantum states back in 1926; it is also the theoretical description of laser light.',

  // ── 波包散射模拟 ──
  '波包演化与散射': 'Wave-packet evolution and scattering',
  '高斯波包撞上矩形势垒。用分步算符法实时求解含时薛定谔方程，ħ = m = 1。':
    'A Gaussian packet hits a rectangular barrier. The time-dependent Schrödinger equation is solved live by the split-operator method, with ħ = m = 1.',
  '势垒 V(x)': 'barrier V(x)',
  '势阱 V(x)': 'well V(x)',
  '入射能量 E': 'incident energy E',
  '平面波解析解 T(E)': 'plane-wave analytic T(E)',
  '当前 E 的解析值': 'analytic value at current E',
  '本次模拟测得 T': 'T measured in this run',
  '经典：完全反射': 'Classically: total reflection',
  '经典：完全透射': 'Classically: total transmission',
  '反射 R': 'Reflection R',
  '反射 R（已锁定）': 'Reflection R (locked)',
  '透射 T': 'Transmission T',
  '透射 T（已锁定）': 'Transmission T (locked)',
  '波包宽度 Δx': 'Packet width Δx',
  '散射结束：`R + T = {0}`。{1}，量子给出 T = {2}、R = {3}。解析平面波在 E = {4} 处给出 T = {5}（波包有能量展宽，两者会有几个百分点的差别）。':
    'Scattering finished: `R + T = {0}`. {1}; quantum mechanics gives T = {2} and R = {3}. The analytic plane wave at E = {4} gives T = {5} (the packet has an energy spread, so the two differ by a few percent).',
  '点「播放」让波包撞上势垒。波包完全离开势垒区后 R、T 会自动锁定。势垒在网格上的实际宽度 a = {0}。':
    'Press play to send the packet into the barrier. R and T lock automatically once the packet has completely left the barrier region. The barrier width on the grid is a = {0}.',
  '入射动量 `k₀`': 'Incident momentum `k₀`',
  '势垒高度 `V₀`': 'Barrier height `V₀`',
  '负值 = 势阱': 'negative = a well',
  '正值 = 势垒': 'positive = a barrier',
  '势垒宽度 `a`': 'Barrier width `a`',
  'T 随 a 指数衰减：T ~ e^(−2κa)': 'T decays exponentially with a: T ~ e^(−2κa)',
  '初始波包宽度 `σ`': 'Initial packet width `σ`',
  'σ 越大动量越确定，越接近平面波':
    'larger σ means better-defined momentum, closer to a plane wave',
  '实时演化': 'Live evolution',
  '透射率曲线 T(E)': 'Transmission curve T(E)',
  '显示 Re ψ': 'Show Re ψ',
  '重放': 'Replay',
  '回到 t = 0': 'Back to t = 0',
  '波包散射实时演化': 'Live wave-packet scattering',
  '矩形势垒透射率随能量的变化':
    'Transmission through a rectangular barrier as a function of energy',
  '默认参数下 `E ≈ 2.0 < V₀ = 2.5`，经典粒子 100% 被弹回。播放看看：有一部分波包穿过去了。这就是隧道效应，也是扫描隧道显微镜与 α 衰变的原理。':
    'At the default parameters `E ≈ 2.0 < V₀ = 2.5`, a classical particle bounces back 100% of the time. Press play: part of the packet gets through. That is tunnelling — the principle behind the scanning tunnelling microscope and alpha decay.',
  '把 `a` 从 1.5 加到 4，重放。透射率暴跌——`T ~ e^(−2κa)` 是指数衰减，势垒稍微加宽一点，隧穿概率就掉几个数量级。':
    'Take `a` from 1.5 to 4 and replay. The transmission collapses — `T ~ e^(−2κa)` is exponential, so widening the barrier a little costs several orders of magnitude.',
  '把 `V₀` 调到 1.0（此时 E > V₀，经典应当 100% 透射），重放：仍然有明显的反射峰跑回左边。波遇到势的突变就会部分反射，跟光在玻璃表面一样。':
    'Set `V₀` to 1.0 (now E > V₀, so classically transmission should be 100%) and replay: a clear reflected peak still runs back to the left. A wave partially reflects at any abrupt change of potential, exactly as light does at a glass surface.',
  '切到「透射率曲线」，把 `V₀` 设成负值（势阱）：曲线在某些能量处回到 T = 1。这是共振透射，历史上表现为惰性气体对慢电子近乎透明的 Ramsauer–Townsend 效应。':
    'Switch to the transmission curve and make `V₀` negative (a well): at certain energies the curve returns to T = 1. That is resonant transmission, historically seen as the Ramsauer–Townsend effect, where noble gases are almost transparent to slow electrons.',
  '把 `σ` 调到 8 再散射，测得的 T 会更贴近解析曲线上的空心圆点——波包越接近平面波，「单一能量」的近似就越好。':
    'Set `σ` to 8 and scatter again: the measured T lands much closer to the open circle on the analytic curve — the nearer the packet is to a plane wave, the better the single-energy approximation.',

  // ── 模拟外壳 ──
  '重置参数': 'Reset parameters',
  '试试看': 'Try this',
  '✓ 已完成探究': '✓ Explored',
  '标记为已探究': 'Mark as explored',
  '这里是一个交互模拟（{0}），需要启用 JavaScript 才能运行。正文的推导与结论不依赖它，可以继续往下读。':
    'This is an interactive simulation ({0}) and needs JavaScript to run. The derivations and conclusions in the text do not depend on it, so feel free to read on.',
  '这里是一个 3D 交互场景（{0}），需要启用 JavaScript 与 WebGL 才能运行。':
    'This is an interactive 3D scene ({0}) and needs JavaScript and WebGL to run.',

  // ── 自测题 ──
  '自测': 'Self-check',
  '共 {0} 题': '{0} questions',
  '最好成绩 {0}/{1}': 'best {0}/{1}',
  '重做': 'Retry',
  '本次 {0} / {1}': 'This attempt: {0} / {1}',
  '全对。可以往下一节了。': 'All correct. On to the next section.',
  '基本掌握。错的那题回头看一下对应的推导。':
    'Mostly there. Go back to the derivation behind the one you missed.',
  '建议重读本节的推导部分，尤其是被折叠起来的那几段。':
    'Worth rereading the derivations in this section, especially the collapsed ones.',
  '多选题': 'Select all that apply',
  '输入数值': 'enter a value',
  '允许 {0}% 相对误差': '{0}% relative tolerance',
  '提交': 'Submit',
  '正确': 'Correct',
  '不对': 'Not quite',
  '正确答案 ≈ {0}': 'correct answer ≈ {0}',
  '你选的': 'You chose:',

  // ── 章节壳层 ──
  '本页内容': 'On this page',
  '全站第 {0} / {1} 节 · 用 {2} {3} 翻页':
    'Section {0} of {1} · use {2} {3} to turn the page',
  '{0} 个模拟': '{0} sim(s)',
  '待撰写': 'to be written',
  '从 {0} 开始 →': 'Start with {0} →',
  '往 src/content/{0}/ 里添加 mdx 文件即可，目录树会自动收录。':
    'Add mdx files under src/content/{0}/ and the table of contents will pick them up automatically.',

  // ── 公式速查 ──
  '公式速查': 'Formula reference',
  '完整版 →': 'Full table →',
  '出处': 'source',
  '基本方程': 'Basic equations',
  '含时薛定谔方程': 'Time-dependent Schrödinger equation',
  '量子力学的运动方程，一阶时间导数':
    'The equation of motion of quantum mechanics; first order in time',
  '定态薛定谔方程': 'Time-independent Schrödinger equation',
  '本征值问题；解出 E 与 ψ': 'An eigenvalue problem; solve for E and ψ',
  '哈密顿算符': 'Hamiltonian operator',
  '定态的时间演化': 'Time evolution of a stationary state',
  '只多一个整体相位，|Ψ|² 不随时间变':
    'Only an overall phase is added; |Ψ|² does not change with time',
  '概率与期望值': 'Probability and expectation values',
  'Born 规则': 'Born rule',
  '归一化条件': 'Normalisation condition',
  '概率流密度': 'Probability current density',
  '满足连续性方程 ∂ρ/∂t + ∂j/∂x = 0':
    'Satisfies the continuity equation ∂ρ/∂t + ∂j/∂x = 0',
  '期望值': 'Expectation value',
  '不确定性原理': 'Uncertainty principle',
  'Ehrenfest 定理': "Ehrenfest's theorem",
  '期望值遵守牛顿方程': "Expectation values obey Newton's equations",
  '一维精确解': 'Exact solutions in one dimension',
  '无限深势阱': 'Infinite square well',
  '谐振子能级': 'Harmonic-oscillator levels',
  '谐振子基态': 'Harmonic-oscillator ground state',
  '升降算符': 'Ladder operators',
  '高斯波包': 'Gaussian wave packet',
  '自由粒子色散关系': 'Free-particle dispersion relation',
  '群速度是相速度的两倍': 'The group velocity is twice the phase velocity',
  '矩形势垒透射率（E < V₀）': 'Rectangular-barrier transmission (E < V₀)',
  '厚垒近似': 'Thick-barrier approximation',
  'κa ≫ 1 时用；指数因子是主导项':
    'For κa ≫ 1; the exponential factor dominates',
  '常数与换算': 'Constants and conversions',
  '约化普朗克常数': 'Reduced Planck constant',
  '电子质量': 'Electron mass',
  '玻尔半径': 'Bohr radius',
  '氢原子基态能': 'Hydrogen ground-state energy',
  '精细结构常数': 'Fine-structure constant',
  '常用换算': 'Handy conversions',
}
