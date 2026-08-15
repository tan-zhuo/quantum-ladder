/** 3D 场景文案英文译文（续）：Stern-Gerlach、纠缠、叠加、退相干、全同粒子、路径积分。 */
export const DICT_SCENES_2: Record<string, string> = {
  // ── Stern-Gerlach ───────────────────────────────────────
  '串联 Stern-Gerlach：测量不是「看一眼」':
    'Stern-Gerlach in series: measurement is not "having a look"',
  '每个飞过的点都是一个真实抽样。把第二台换成 X 轴，再用第三台测 Z——你会看到第一台明明筛干净的那一束又回来了。':
    'Every dot that flies past is a real random draw. Set the second analyser to X, measure Z again with the third, and the beam that the first analyser had cleanly filtered out comes back.',
  装置: 'Apparatus',
  分析器台数: 'Number of analysers',
  '1 台': '1',
  '2 台': '2',
  '3 台': '3',
  '第 {0} 台': 'Analyser {0}',
  'Z 轴': 'Z axis',
  'X 轴': 'X axis',
  都通过: 'Pass both',
  挡下束: 'Block lower',
  挡上束: 'Block upper',
  束流: 'Beam',
  发射速率: 'Emission rate',
  清空计数: 'Clear counts',
  末端计数: 'Counts at the screen',
  '上束 / 下束': 'Upper / lower',
  上: 'up',
  下: 'down',
  '被挡板吸收 {0} 个。': '{0} absorbed by the blockers. ',
  '与前一台同轴：结果必然重复，只有一束':
    'Same axis as the previous stage: the result simply repeats, so only one beam',
  '与前一台正交：五五开——前面筛掉的成分又回来了':
    'Orthogonal to the previous stage: fifty-fifty — the component filtered out earlier is back',
  '已发射 {0}': 'Emitted {0}',
  '到达屏 {0}': 'Reached screen {0}',
  '上束比例 {0}': 'Upper fraction {0}',
  尚未被测量: 'not measured yet',
  '自旋 +（沿该台的轴）': 'spin + (along that analyser\'s axis)',
  '自旋 −': 'spin −',
  磁铁与挡板: 'Magnets and blockers',
  '炉源（无偏自旋）': 'Oven (unpolarised spins)',
  探测屏: 'Detector screen',
  '{0}. {1} 分析器': '{0}. {1} analyser',
  '到达 {0}': 'reached {0}',
  '默认配置就是那个经典实验：Z（挡下束）→ X（挡下束）→ Z。注意最后一台仍然分成两束——第一台明明只放行了「上」。':
    'The default is the classic experiment: Z (block lower) → X (block lower) → Z. Note that the last analyser still splits the beam in two, even though the first one passed only "up".',
  '把第二台也改成 Z 轴：最后一台只剩一束。测量是可重复的，同一个轴测多少次结果都不变。':
    'Set the second analyser to Z as well: only one beam leaves the last one. Measurement is repeatable — along the same axis you can measure as often as you like without changing anything.',
  '把第二台改回 X 轴：下束立刻回来了。X 测量不是读取属性，它真的改变了态。':
    'Switch the second analyser back to X and the lower beam returns at once. An X measurement does not read off a property; it genuinely changes the state.',
  '只留一台、都不挡：入射是完全无偏的银原子，两束各占一半——这是 1922 年 Stern 与 Gerlach 看到的原始现象，也是「自旋只有两个值」的第一个直接证据。':
    'Keep a single analyser and block nothing: unpolarised silver atoms split half and half. That is what Stern and Gerlach saw in 1922, and it was the first direct evidence that spin takes only two values.',
  '“第一台已经把下束筛掉了，后面不该再出现”':
    '"The first analyser already removed the lower beam, so it should not return"',
  '「下束」是相对于 Z 轴说的。经过 X 分析器之后，态变成了 X 的本征态，它在 Z 基下重新是叠加态——不是筛子漏了，是属性本身被重新定义了。':
    '"Lower" is defined relative to Z. After the X analyser the state is an eigenstate of X, which is once again a superposition in the Z basis. Nothing leaked through the filter; the property itself was redefined.',
  '“磁场把自旋掰到了新方向”': '"The magnetic field bends the spin into a new direction"',
  '非均匀磁场提供的是位置相关的力，把不同自旋分量在空间上分开；真正改变态的是「挡掉一束」这个选择动作（投影）。':
    'The inhomogeneous field supplies a position-dependent force that separates the spin components in space. What actually changes the state is blocking one beam — that is the projection.',
  '如果第二台 X 分析器不挡任何一束，而是把两束重新合并（不去看是哪一束），第三台的 Z 结果会是什么？（这就是量子擦除的雏形。）':
    'Suppose the X analyser blocks nothing and instead recombines both beams without looking at which is which. What does the third Z analyser give? (This is the germ of the quantum eraser.)',
  '把三台都设成 Z 轴、都不挡，屏上会看到几束？为什么？':
    'Set all three analysers to Z and block nothing. How many beams reach the screen, and why?',
  '银原子有 47 个电子，为什么整体表现得像一个自旋 1/2？':
    'A silver atom has 47 electrons. Why does the whole thing behave like a single spin-1/2?',

  // ── 纠缠与 Bell ─────────────────────────────────────────
  '纠缠与 Bell：把「测量前就定好了」这个假设做掉':
    'Entanglement and Bell: killing the assumption that outcomes were fixed in advance',
  '每一对粒子飞向两端，各自给出 ±1。单边看完全随机，合起来看却严格相关。CHSH 的 S 越过 2，局域实在论就出局了。':
    'Each pair flies to the two ends and each side records ±1. Either side alone is pure randomness; together they are strictly correlated. Once the CHSH value S climbs past 2, local realism is out.',
  模型: 'Model',
  量子力学: 'Quantum mechanics',
  局域隐变量: 'Local hidden variables',
  '按量子力学抽样：P(B|A) = (1 − A·â·b̂)/2':
    'Sampling by quantum mechanics: P(B|A) = (1 − A·â·b̂)/2',
  '每对粒子携带一个共同的隐变量 λ，两端各自按 sign(λ·n̂) 独立决定结果':
    'Each pair carries a shared hidden variable λ; each side independently returns sign(λ·n̂)',
  测量角度: 'Measurement angles',
  '默认给的是让 S 最大的那组角度（0°, 90°, 45°, 135°）。自旋的关联是 −cos θ，所以最优角度间隔是 45°。':
    'The defaults are the angles that maximise S (0°, 90°, 45°, 135°). Spin correlations go as −cos θ, so the optimal spacing is 45°.',
  最优角度: 'Optimal angles',
  全部同向: 'All parallel',
  '全部同向：S = 0，这组角度检验不出任何非经典性':
    'All parallel: S = 0 — these angles test nothing non-classical',
  运行: 'Run',
  显示两端的约化态球: 'Show the reduced-state spheres',
  '关联 E(θ)': 'Correlation E(θ)',
  关联随夹角变化: 'Correlation versus angle',
  '蓝色是量子预言 −cos θ，橙虚线是局域隐变量模型能给出的折线，绿点是当前四组设置的实测值。 两条曲线在 0°、90°、180° 重合，在 45° 附近差得最多——CHSH 的四个角度就挑在这里。':
    'Blue is the quantum prediction −cos θ; the dashed orange line is the best a local hidden-variable model can do; the green dots are the measured values for the four current settings. The two agree at 0°, 90° and 180° and differ most near 45° — which is exactly where the four CHSH angles sit.',
  'CHSH 值 |S|': 'CHSH value |S|',
  经典可解释部分: 'classically explainable part',
  超出经典上界: 'beyond the classical bound',
  余量: 'headroom',
  '经典上界 2　·　量子上界 2√2 ≈ 2.828　·　理论预期 {0}':
    'Classical bound 2 · quantum bound 2√2 ≈ 2.828 · predicted {0}',
  '样本数 {0}': 'Samples {0}',
  'Alice 单边 +1 比例 {0}': 'Alice, fraction of +1: {0}',
  'Bob 单边 +1 比例 {0}': 'Bob, fraction of +1: {0}',
  '|S| > 2：这组数据无法用任何「测量前结果已确定 + 定域」的模型解释。':
    '|S| > 2: no model in which outcomes are fixed before measurement and influences stay local can produce this data.',
  '结果 +1': 'outcome +1',
  '结果 −1': 'outcome −1',
  纠缠源: 'Entangled source',
  '先看两端的球：两个约化态都缩在球心（最大混合），说明单看任何一边都是纯粹的随机噪声，一点信息也没有。信息全在关联里。':
    'Look at the two spheres first: both reduced states sit at the centre (maximally mixed), so either side on its own is pure noise carrying no information. All of it lives in the correlation.',
  '默认角度下让它跑几百对，|S| 会稳定在 2.8 附近，明显越过经典上界 2。':
    'Let a few hundred pairs go through at the default angles: |S| settles near 2.8, comfortably past the classical bound of 2.',
  '切到「局域隐变量」模式：同样的角度，|S| 卡在 2 以下上不去。这不是模型没调好——任何局域隐变量模型都过不去，这正是 Bell 的定理。':
    'Switch to the local hidden-variable model: at the same angles |S| sticks below 2 and refuses to climb. That is not a badly tuned model — no local hidden-variable model can get past it, and that is Bell\'s theorem.',
  '点「全部同向」：S 掉到 0。角度选错的话，这个实验什么也检验不出来——这解释了为什么 Bell 实验的角度必须精心设计。':
    'Press "All parallel" and S drops to zero. With the wrong angles the experiment tests nothing at all — which is why the angles in a Bell test have to be chosen with care.',
  '把关联曲线里的两条对照看：量子是 cos，局域隐变量最多是折线，两者在 45° 附近差得最多——这正是四个测量角度都相隔 45° 的原因。':
    'Compare the two curves: quantum mechanics gives a cosine, local hidden variables at best a straight-line kink, and they differ most near 45° — which is exactly why the four angles are spaced 45° apart.',
  '“纠缠可以超光速传信息”': '"Entanglement transmits information faster than light"',
  'Alice 无法控制自己得到 +1 还是 −1，Bob 单边看永远是 50/50。要看到关联必须把两边的记录用经典信道送到一起比对。无信号定理保证了这一点。':
    'Alice cannot choose whether she gets +1 or −1, and Bob\'s side is always 50/50 on its own. Seeing the correlation requires bringing both records together over a classical channel. The no-signalling theorem guarantees this.',
  '“Alice 的测量改变了 Bob 的粒子”': '"Alice\'s measurement changes Bob\'s particle"',
  '换个惯性系，两次测量的先后顺序会反过来。「谁导致谁」在类空间隔的事件之间没有不变的含义。可靠的说法只是：联合分布不能被分解成两个独立的定域分布。':
    'Change inertial frame and the order of the two measurements reverses. "Which caused which" has no invariant meaning between space-like separated events. The safe statement is only this: the joint distribution does not factorise into two independent local ones.',
  '“纠缠就是很强的关联”': '"Entanglement is just a very strong correlation"',
  '经典关联可以很强（两只手套分装两地，看一只就知道另一只）。区别在于：经典关联的强度随角度是折线，量子是 cos，而这个差别是可以测出来的。':
    'Classical correlations can be perfect too — post one glove to each of two cities and looking at one tells you the other. The difference is that classical correlation strength versus angle is a kinked line while the quantum one is a cosine, and that difference is measurable.',
  '手套的例子里，若两端都只测「左还是右」，关联同样是 100%。要区分「手套」和「纠缠」，为什么必须测量至少两组不同的方向？':
    'In the glove story, measuring only "left or right" at both ends also gives 100% correlation. Why must you measure along at least two different directions to tell gloves from entanglement?',
  '量子上界是 2√2（Tsirelson 界），代数上界是 4。存在既不能超光速通信、又能达到 4 的理论吗？（关键词：PR box。）':
    'The quantum bound is 2√2 (the Tsirelson bound) while the algebraic maximum is 4. Is there a theory that reaches 4 yet still forbids faster-than-light signalling? (Keyword: PR box.)',
  '若探测效率只有 50%，且丢失的样本与隐变量相关，局域模型能否伪造出 |S| > 2？这就是「探测漏洞」，2015 年的实验才彻底封上。':
    'If only 50% of pairs are detected and the losses are correlated with the hidden variable, can a local model fake |S| > 2? That is the detection loophole, closed for good only in 2015.',

  // ── 叠加态 ──────────────────────────────────────────────
  '叠加态：为什么本征态不动，而叠加会晃':
    'Superposition: why eigenstates stand still and superpositions slosh',
  '第三个维度是时间。当前的 |ψ|² 在最前面，它的历史往后堆成一张时空曲面——本征态是笔直的沟壑，叠加态是荡开的波纹。':
    'The third dimension here is time. The present |ψ|² is at the front and its history stacks up behind it into a space-time surface: eigenstates carve straight grooves, superpositions ripple.',
  '叠加系数 cₙ': 'Superposition coefficients cₙ',
  '只有一个非零系数时画面完全静止；两个及以上才开始晃。':
    'With a single non-zero coefficient nothing moves; two or more and it starts to slosh.',
  基态: 'Ground state',
  相干态: 'Coherent state',
  '谐振子的相干态：波包形状不变，整体来回振荡':
    'The oscillator coherent state: the packet keeps its shape and swings as a whole',
  '显示时间历史（瀑布图）': 'Show the time history (waterfall)',
  '⟨x⟩ 随时间': '⟨x⟩ versus time',
  位置期望值随时间: 'Expectation value of position versus time',
  '这条曲线就是「原子这根天线」的摆动。只留一个能级时它是一条死平的直线—— 本征态不辐射，所以原子稳定。':
    'This curve is the swing of the atom as an antenna. Leave only one level and it flatlines — eigenstates do not radiate, which is why atoms are stable.',
  '拍频周期 T = 2πħ/ΔE = {0}': 'Beat period T = 2πħ/ΔE = {0}',
  '单一能级：无振荡': 'Single level: no oscillation',
  定态: 'stationary',
  '先只留 c₀（点「基态」）：管子在转，但 |ψ|² 完全不动，历史曲面是一条条笔直的沟。这就是「定态」。':
    'Start with only c₀ (press "Ground state"): the tube turns but |ψ|² does not move at all, and the history surface is a set of straight grooves. That is what "stationary" means.',
  '点「0+1」：概率密度开始左右晃，历史曲面变成斜向的波纹。晃动周期由能级差决定——读数里的 T = 2πħ/ΔE 可以拿秒表核对。':
    'Press "0+1": the density starts swinging left and right and the history surface turns into slanted ripples. The period is set by the level spacing — you can check the T = 2πħ/ΔE in the readout with a stopwatch.',
  '点「0+2」：晃动频率变了（因为 ΔE 变了），而且形状是「呼吸」而不是「左右晃」——奇偶宇称决定了它怎么动。':
    'Press "0+2": the frequency changes (ΔE changed) and the motion becomes a breathing rather than a swing — parity decides how it moves.',
  '切到谐振子并点「相干态」：波包形状保持不变、像经典小球一样来回振荡。这是谐振子能级等间距的特权，换成方阱就会散架。':
    'Switch to the oscillator and press "Coherent state": the packet keeps its shape and swings like a classical ball. That is a privilege of evenly spaced levels; in a square well it falls apart.',
  '切到「看历史」视角俯视瀑布图：整段时间演化被压成一张静止的图，比盯着动画更容易看清周期。':
    'Switch to the history view and look down on the waterfall: the whole evolution is flattened into one still image, and the period is easier to read there than in the animation.',
  '“叠加态的能量是各能级的平均”':
    '"The energy of a superposition is the average of the levels"',
  '能量期望值确实是加权平均，但单次测量只会得到某个 Eₙ，永远测不到那个平均值。':
    'The expectation value is indeed a weighted average, but any single measurement returns some Eₙ. The average itself is never a measurement outcome.',
  '“本征态不随时间变化”': '"An eigenstate does not change with time"',
  '态矢量一直在变（相位在转），不变的是所有可观测量。区别在于整体相位不可观测。':
    'The state vector changes constantly — the phase turns. What stays fixed is every observable. The difference is that a global phase is unobservable.',
  '“晃动频率是 E/ħ”': '"The sloshing frequency is E/ħ"',
  '是能级**差**除以 ħ。绝对能量零点可以任意平移而不影响任何观测——这也是为什么只有能级差有物理意义。':
    'It is the level *difference* over ħ. The zero of energy can be shifted at will without affecting any observation, which is exactly why only differences carry physical meaning.',
  '把 c₀ 设为 0.99、c₁ 设为 0.14，晃动的频率变不变？幅度变不变？先猜再试。':
    'Set c₀ = 0.99 and c₁ = 0.14. Does the frequency change? Does the amplitude? Guess first, then try.',
  '无限深阱里 E ∝ n²，所以叠加 0+1 与叠加 2+3 的晃动频率不同。哪个更快？':
    'In the infinite well E ∝ n², so 0+1 and 2+3 slosh at different rates. Which is faster?',
  '如果叠加的两个态宇称相同（比如 0 和 2），⟨x⟩ 会振荡吗？看看 ⟨x⟩ 曲线，再想想矩阵元 ⟨0|x|2⟩ 的宇称。':
    'If the two superposed states have the same parity (say 0 and 2), does ⟨x⟩ oscillate? Look at the curve, then think about the parity of the matrix element ⟨0|x|2⟩.',

  // ── 退相干 ──────────────────────────────────────────────
  '退相干：球面上的点如何掉进球里':
    'Decoherence: how a point on the sphere falls inside it',
  '纯态在球面上，混合态在球内。打开与环境的耦合，看着箭头一点点缩短——以及整个单位球被压成一个椭球。':
    'Pure states live on the sphere, mixed states inside it. Switch on the coupling to the environment and watch the arrow shrink — and the whole unit sphere squash into an ellipsoid.',
  初态: 'Initial state',
  与环境的耦合: 'Coupling to the environment',
  '相位阻尼只吃掉相干项（赤道方向），能量弛豫还会把布居拽向基态（北极）。':
    'Phase damping eats only the coherences (the equatorial directions); energy relaxation also drags the populations towards the ground state (the north pole).',
  '相位阻尼 γφ': 'Phase damping γφ',
  '能量弛豫 γ₁': 'Energy relaxation γ₁',
  '信道椭球（整个球的像）': 'Channel ellipsoid (image of the whole sphere)',
  '信道椭球（单位球的像）': 'Channel ellipsoid (image of the unit sphere)',
  时间常数: 'Time constants',
  'T₁（能量弛豫）': 'T₁ (energy relaxation)',
  'T₂（退相干）': 'T₂ (decoherence)',
  'Bloch 矢量 r⃗': 'Bloch vector r⃗',
  '纯度 Tr(ρ²) = {0}': 'Purity Tr(ρ²) = {0}',
  '相干项 |ρ₀₁| = {0}': 'Coherence |ρ₀₁| = {0}',
  '布居 ρ₁₁ = {0}': 'Population ρ₁₁ = {0}',
  '球面 = 纯态　球内 = 混合态': 'on the sphere = pure · inside = mixed',
  纯度: 'purity',
  '先把两个耦合都设为 0：箭头在球面上匀速进动，永远不缩短。这是封闭系统的幺正演化。':
    'Set both couplings to zero first: the arrow precesses steadily on the sphere and never shortens. That is unitary evolution of a closed system.',
  '只开「相位阻尼」：箭头的水平分量迅速缩短，竖直分量一动不动。椭球被压成一根竖直的针——相干性没了，但「上还是下」的概率一点没变。':
    'Switch on phase damping alone: the horizontal component collapses fast while the vertical one does not move. The ellipsoid is squashed into a vertical needle — coherence is gone, yet the probability of "up or down" is untouched.',
  '只开「能量弛豫」：椭球整体向北极（基态）收缩并平移。系统在向环境放能。':
    'Switch on energy relaxation alone: the whole ellipsoid shrinks and drifts towards the north pole. The system is dumping energy into the environment.',
  '把初态设成 θ = 0（正好在北极）、只开相位阻尼：什么都不会发生。基态本来就没有相干项可丢——「退相干」只对叠加态有意义。':
    'Set θ = 0 (exactly at the north pole) with phase damping only: nothing happens. The ground state has no coherence to lose — decoherence only means something for superpositions.',
  '把 γφ 拉到最大：相干项在一两个进动周期内就没了。真实的宏观物体上，这个时间是 10⁻³¹ 秒量级。':
    'Push γφ to its maximum: the coherence is gone within a precession cycle or two. For a real macroscopic object that time is of order 10⁻³¹ seconds.',
  '“退相干 = 波函数坍缩”': '"Decoherence is wavefunction collapse"',
  '不是。退相干把叠加态变成看起来像经典概率混合的东西（密度矩阵变对角），但它不解释为什么每次只出现一个结果。测量问题被压缩了，没有被消灭。':
    'It is not. Decoherence turns a superposition into something that looks like a classical mixture (the density matrix goes diagonal), but it does not explain why a single outcome occurs each time. The measurement problem is compressed, not removed.',
  '“环境把能量抽走了，所以相干消失”':
    '"The environment drains the energy, so coherence disappears"',
  '未必。纯相位阻尼不交换任何能量（布居完全不变），照样彻底摧毁相干。丢失的是相位信息，不是能量。':
    'Not necessarily. Pure phase damping exchanges no energy at all — the populations do not move — and still destroys coherence completely. What is lost is phase information, not energy.',
  '“混合态就是我们不知道它是哪个纯态”':
    '"A mixed state just means we do not know which pure state it is"',
  '同一个密度矩阵可以由无穷多种不同的纯态系综给出，它们在物理上完全不可区分。「其实是某个纯态，只是我们不知道」这句话没有可操作的含义。':
    'The same density matrix arises from infinitely many different ensembles of pure states, and they are physically indistinguishable. "It really is some pure state, we just do not know which" has no operational content.',
  '把整体（系统 + 环境）算进来时演化是幺正的、纯态始终是纯态。那么系统的熵是从哪冒出来的？':
    'Taken together, system plus environment evolve unitarily and a pure state stays pure. Where, then, does the entropy of the system come from?',
  'T₂ ≤ 2T₁ 这条不等式在几何上意味着什么？（提示：想想椭球在赤道方向与竖直方向的收缩速率。）':
    'What does the inequality T₂ ≤ 2T₁ mean geometrically? (Hint: compare how fast the ellipsoid shrinks equatorially and vertically.)',
  '量子计算需要在 T₂ 之内完成足够多的门操作。若单门耗时 20 ns、T₂ = 100 μs，粗算一下能做多少次操作？够跑一个需要 10⁶ 次门的算法吗？':
    'A quantum computer must finish enough gates within T₂. With 20 ns per gate and T₂ = 100 μs, roughly how many operations fit? Enough for an algorithm needing 10⁶ gates?',

  // ── 全同粒子 ────────────────────────────────────────────
  '全同粒子：交换 = 沿对角线翻一次面':
    'Identical particles: exchange is one flip about the diagonal',
  '水平面是位形空间 (x₁, x₂)，高度是波函数 Ψ。点「交换两个粒子」——玻色子的曲面纹丝不动，费米子的整张曲面翻到地面以下。':
    'The horizontal plane is configuration space (x₁, x₂) and the height is the wavefunction Ψ. Press "Swap the two particles": the bosonic surface does not budge, while the fermionic one flips entirely below the floor.',
  单粒子态: 'Single-particle states',
  '量子数 a': 'Quantum number a',
  '量子数 b': 'Quantum number b',
  对称性: 'Symmetry',
  可分辨: 'Distinguishable',
  可分辨粒子: 'Distinguishable particles',
  玻色子: 'Bosons',
  费米子: 'Fermions',
  '玻色子（对称）': 'Bosons (symmetric)',
  '费米子（反对称）': 'Fermions (antisymmetric)',
  '玻色子（聚集）': 'Bosons (bunching)',
  '费米子（回避）': 'Fermions (antibunching)',
  交换两个粒子: 'Swap the two particles',
  '显示 |Ψ|² 而不是 Ψ': 'Show |Ψ|² instead of Ψ',
  '高亮 x₁ = x₂ 对角线': 'Highlight the x₁ = x₂ diagonal',
  'x₁ = x₂ 对角线': 'the x₁ = x₂ diagonal',
  '⟨(x₁−x₂)²⟩ 对照': '⟨(x₁−x₂)²⟩ compared',
  '哈密顿量里没有任何相互作用势，差别纯粹来自对称性。':
    'There is no interaction potential anywhere in the Hamiltonian; the difference comes entirely from symmetry.',
  'Ψ > 0': 'Ψ > 0',
  'Ψ < 0': 'Ψ < 0',
  '交换后 Ψ → ': 'After exchange Ψ → ',
  '另一个态（可分辨粒子不要求对称性）':
    'a different state (distinguishable particles carry no symmetry requirement)',
  'Ψ ≡ 0（泡利不相容）': 'Ψ ≡ 0 (Pauli exclusion)',
  'Ψ ≡ 0：两个费米子不能占据同一个态':
    'Ψ ≡ 0: two fermions cannot occupy the same state',
  '先选「可分辨」：曲面在对角线两侧不对称——「1 号在左、2 号在右」和反过来是两个不同的状态。':
    'Start with "Distinguishable": the surface is not symmetric about the diagonal — "particle 1 left, particle 2 right" and the reverse are two different states.',
  '切到「玻色子」：曲面关于对角线镜像对称，而且在对角线上（两粒子重合处）取值最大。玻色子喜欢聚在一起。':
    'Switch to "Bosons": the surface becomes mirror-symmetric about the diagonal and peaks *on* it, where the particles coincide. Bosons like to bunch.',
  '切到「费米子」：曲面在对角线上**严格为零**，而且对角线两侧一正一负。两个费米子不可能出现在同一点。':
    'Switch to "Fermions": the surface is exactly zero along the diagonal, positive on one side and negative on the other. Two fermions can never be at the same point.',
  '点「交换两个粒子」：这个动画就是把曲面沿对角线翻 180°。玻色子看不出变化，费米子整个翻到了地面下——差别只有一个负号，后果是整张元素周期表。':
    'Press "Swap the two particles": the animation is literally a 180° flip about the diagonal. Bosons show no change; fermions end up entirely below the floor. The difference is a single minus sign, and its consequence is the whole periodic table.',
  '把两个量子数调成相同、选费米子：曲面直接消失。泡利不相容不需要额外规则，反对称化自己就把它算没了。':
    'Set the two quantum numbers equal and choose fermions: the surface simply vanishes. Pauli exclusion needs no extra rule — antisymmetrisation does the arithmetic itself.',
  '“交换对称性是一种作用力”': '"Exchange symmetry is a kind of force"',
  '哈密顿量里没有任何相互作用项。粒子的聚集或回避完全来自波函数必须（反）对称这个约束。习惯上叫「交换力」，但它不是力。':
    'There is no interaction term in the Hamiltonian. The bunching or avoidance comes entirely from the requirement that the wavefunction be (anti)symmetric. It is traditionally called an "exchange force", but it is not a force.',
  '“波函数画的是两个粒子在空间中的位置”':
    '"The wavefunction shows where the two particles are in space"',
  '这张曲面画在**位形空间**上：横轴是 1 号的位置，纵轴是 2 号的位置。两个粒子的真实空间是一维的，位形空间才是二维的。三个粒子就是三维，十个粒子就是十维——这也是多体问题难的根源。':
    'This surface lives in *configuration space*: one axis is the position of particle 1, the other of particle 2. Real space here is one-dimensional; it is configuration space that is two-dimensional. Three particles make it three-dimensional, ten make it ten — which is the root of the many-body problem.',
  '“泡利不相容说的是费米子之间有排斥力”':
    '"Pauli exclusion means fermions repel each other"',
  '不相容是波函数结构的后果，不是相互作用。它不传递能量、不随距离衰减，也没有对应的场。':
    'Exclusion is a consequence of the structure of the wavefunction, not an interaction. It carries no energy, falls off with no distance law and has no field.',
  '两个电子的总波函数 = 空间部分 × 自旋部分，整体必须反对称。若自旋处于三重态（对称），空间部分必须反对称——这对它们的平均间距意味着什么？这就是铁磁性的起源之一。':
    'For two electrons the total wavefunction is spatial × spin and must be antisymmetric overall. If the spin part is a triplet (symmetric), the spatial part must be antisymmetric — what does that do to their average separation? This is one origin of ferromagnetism.',
  '把 a、b 调得很远（比如 1 和 5），三种情形的 ⟨(x₁−x₂)²⟩ 差别会怎么变？为什么两个态的空间重叠越小，交换效应越弱？':
    'Push a and b far apart (say 1 and 5). How does the spread of ⟨(x₁−x₂)²⟩ across the three cases change? Why does less spatial overlap mean a weaker exchange effect?',
  '二维体系里交换两次不一定回到原状态，于是允许「任意子」（分数统计）。这与三维有什么本质区别？':
    'In two dimensions, exchanging twice need not return the original state, which allows anyons and fractional statistics. What is essentially different about three dimensions?',

  // ── 路径积分 ────────────────────────────────────────────
  '路径积分：所有路径都在贡献，经典路径只是活下来的那条':
    'The path integral: every path contributes, the classical one is merely the survivor',
  '每条路径带一个相位 e^{iS/ħ}，颜色就是相位。把所有振幅首尾相接得到右上角那条链——它卷成螺旋的地方，就是路径互相抵消的地方。':
    'Each path carries a phase e^{iS/ħ}, and the colour *is* that phase. Chaining all the amplitudes head to tail gives the strand at the top — wherever it curls into a spiral, paths are cancelling each other.',
  '普朗克常数 ħ': 'Planck constant ħ',
  '这是整个场景唯一的开关。ħ 越小，同样的 ΔS 对应的相位差越大，抵消越彻底，能活下来的路径束越窄。':
    'This is the only switch in the scene. The smaller ħ, the larger the phase difference for the same ΔS, the more complete the cancellation, and the narrower the bundle of surviving paths.',
  '量子（大 ħ）': 'Quantum (large ħ)',
  中间: 'In between',
  经典极限: 'Classical limit',
  '经典极限：只剩经典路径附近的一小束':
    'Classical limit: only a thin bundle around the classical path survives',
  路径样本: 'Path sample',
  路径条数: 'Number of paths',
  路径粗糙度: 'Path roughness',
  控制随机路径偏离直线的幅度: 'How far the random paths wander from the straight line',
  换一批路径: 'Draw a new batch',
  '相量链（振幅求和）': 'Phasor chain (sum of amplitudes)',
  相量链: 'Phasor chain',
  高亮经典路径: 'Highlight the classical path',
  '经典路径（S 取极值）': 'classical path (S stationary)',
  '路径颜色 = 相位（色环）': 'path colour = phase (colour wheel)',
  '颜色 = 相位 S/ħ（转一圈 = 2π）': 'colour = phase S/ħ (one turn = 2π)',
  总振幅: 'total amplitude',
  '经典作用量 S_cl = {0}': 'Classical action S_cl = {0}',
  '相位灵敏度 S_cl/ħ = {0} rad': 'Phase sensitivity S_cl/ħ = {0} rad',
  '|ΔS| < πħ 的路径占 {0}%': '{0}% of paths have |ΔS| < πħ',
  '总振幅 |ΣA|/N = {0}': 'Total amplitude |ΣA|/N = {0}',
  '路径 {0}': '{0} paths',
  '先把 ħ 设成 3（量子）：路径的颜色变化很缓和，说明相邻路径的相位差不大，它们都在有效地贡献。相量链几乎是一条直线——同相叠加。':
    'Start with ħ = 3 (quantum): the colours change gently, meaning neighbouring paths differ little in phase and all of them contribute effectively. The phasor chain is nearly straight — everything adds in phase.',
  '把 ħ 拖到 0.1（经典极限）：颜色开始高速旋转，相量链立刻卷成一个小螺旋并原地打转。只有紧贴经典路径的那几条还在同相叠加。':
    'Drag ħ down to 0.1 (the classical limit): the colours start spinning fast and the chain immediately curls into a tight spiral going nowhere. Only the paths hugging the classical one still add in phase.',
  '注意读数里的「|ΔS| < πħ 的路径占比」：ħ 越小，这个比例越低。存活的路径束就是经典轨迹的宽度。':
    'Watch the fraction of paths with |ΔS| < πħ in the readout: the smaller ħ, the lower it goes. That surviving bundle *is* the width of the classical trajectory.',
  '把「路径粗糙度」调大：偏离更远的路径出现，它们的相位更混乱，对总和几乎没有净贡献——但它们确实参与了。':
    'Increase the path roughness: wilder paths appear, their phases are more scrambled and their net contribution is almost nothing — but they do take part.',
  '切到「看相量链」视角正对螺旋：这条链的**端点到起点的连线**就是总振幅。链越直，振幅越大。':
    'Switch to the phasor view and face the spiral: the straight line from the start of the chain to its end is the total amplitude. The straighter the chain, the larger it is.',
  '“粒子真的同时走了所有路径”': '"The particle really does travel every path at once"',
  '路径积分是一种计算振幅的方法，不是对「粒子做了什么」的字面描述。可靠的说法是：不指定路径时，必须把所有路径的振幅相加。':
    'The path integral is a way of computing an amplitude, not a literal account of what the particle did. The safe statement is: when the path is not specified, all path amplitudes must be summed.',
  '“远离经典的路径贡献小”': '"Paths far from the classical one contribute little"',
  '每条路径的振幅**模长完全相同**。差别只在相位。远处的路径不是贡献小，而是彼此抵消。这两种说法给出的直觉完全不同。':
    'Every path has exactly the same amplitude *magnitude*. Only the phases differ. Distant paths do not contribute little — they cancel each other. The two statements build completely different intuitions.',
  '“典型路径是光滑的”': '"Typical paths are smooth"',
  '路径积分里占主导的路径处处连续但处处不可微（⟨Δx²⟩ ∝ Δt，和布朗运动一样）。「速度」在这个框架里不是良定义的量。':
    'The dominant paths are continuous everywhere and differentiable nowhere (⟨Δx²⟩ ∝ Δt, exactly as in Brownian motion). "Velocity" is not a well-defined quantity in this framework.',
  '最小作用量原理在经典力学里是一条基本假设。在路径积分里它是什么？（提示：看 ħ → 0 时相量链发生了什么。）':
    'In classical mechanics the principle of least action is a postulate. What is it in the path integral? (Hint: watch what the phasor chain does as ħ → 0.)',
  '双缝实验在这套语言里怎么说？（提示：挡板杀掉了绝大多数路径，只留下两类。）':
    'How would you describe the double slit in this language? (Hint: the barrier kills almost every path and leaves two families.)',
  '若某条路径的 S 比经典路径大 100ħ，它「被抵消」的意思是：总有另一条路径与它反相。这个配对在 ħ 很大时还存在吗？':
    'If a path has S larger than the classical value by 100ħ, "being cancelled" means some other path is exactly out of phase with it. Does that pairing still exist when ħ is large?',
}
