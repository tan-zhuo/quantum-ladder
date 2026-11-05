/**
 * 3D 场景文案的英文译文。键是中文原文（见 src/i18n/index.ts 里为什么这么选）。
 *
 * 翻译原则与中文版一致：讲物理图像，不讲套话；宁可句子长一点，也不把
 * 「为什么」省掉。术语一律用教科书里的标准英文（stationary state、
 * decoherence、which-path information…），不自创。
 */
export const DICT_SCENES: Record<string, string> = {
  // ── 通用控件与外壳 ───────────────────────────────────────
  播放: 'Play',
  暂停: 'Pause',
  继续: 'Resume',
  '回到 t = 0': 'Back to t = 0',
  速度: 'Speed',
  演化进度: 'Evolution progress',
  显示: 'Display',
  显示设置: 'Display settings',
  渲染精度: 'Render quality',
  高: 'High',
  中: 'Medium',
  低: 'Low',
  '已手动锁定，不再自动降级。': 'Locked manually — auto-downgrade is off.',
  '帧率过低时会自动降一档。': 'Drops one tier automatically if the frame rate falls too low.',
  色盲友好配色: 'Colour-blind safe palette',
  高对比度: 'High contrast',
  场景内标注: 'In-scene labels',
  重置视角: 'Reset view',
  '保存当前画面为 PNG': 'Save the current frame as PNG',
  全屏: 'Full screen',
  退出全屏: 'Exit full screen',
  观察指南: 'What to look for',
  想一想: 'Think it through',
  '标记为已探究': 'Mark as explored',
  '✓ 已探究': '✓ Explored',
  '3D 场景加载中…': 'Loading 3D scene…',

  // ── 视角与通用标签 ──────────────────────────────────────
  等轴: 'Isometric',
  正视: 'Front',
  侧视: 'Side',
  俯视: 'Top',
  近观: 'Close-up',
  贴面: 'Edge-on',
  '沿 x 看': 'Along x',
  '沿 x 轴看': 'Along the x axis',
  沿对角线: 'Along the diagonal',
  看屏: 'At the screen',
  看历史: 'At the history',
  看实部: 'At the real part',
  看虚部: 'At the imaginary part',
  看路径: 'At the paths',
  看相量链: 'At the phasor chain',
  看势垒: 'At the barrier',
  看整套装置: 'The whole apparatus',
  看整条装置: 'The whole apparatus',
  看整张曲面: 'The whole surface',
  看相干项被压扁: 'Watch the coherences get squashed',
  '正面 xz': 'Front (xz)',
  '俯视 xy': 'Top (xy)',
  默认视角: 'Default view',
  '默认视角：三条轴都能看清': 'Default view: all three axes visible',
  教科书视角: 'Textbook view',
  '标准教科书视角：横轴 x，纵轴能量': 'The standard textbook view: x across, energy up',
  低角度看曲面起伏: 'A low angle across the surface',
  正对复平面: 'Facing the complex plane',
  '正对复平面：ψ 在每一点上是一个复数':
    'Facing the complex plane: ψ is one complex number at every x',
  '正对复平面：看 ψ 在复平面上转圈': 'Facing the complex plane: watch ψ spin',
  '正对复平面：看 ψ 的相位怎么转': 'Facing the complex plane: watch the phase turn',
  '正对实部墙：这就是教科书上画的那条曲线':
    'Facing the real-part wall: this is the curve textbooks draw',
  '正对屏数点': 'Facing the screen to count hits',
  '正对屏看条纹': 'Facing the screen to see the fringes',
  '正对相量链：看螺旋怎么卷起来': 'Facing the phasor chain: watch the spiral curl up',
  正对路径束: 'Facing the bundle of paths',
  '正对 Z 方向的分束': 'Facing the Z-direction split',
  '正对 x₁ = x₂ 这条线': 'Facing the x₁ = x₂ line',
  正对两个测量平面: 'Facing both measurement planes',
  '沿 y 轴看：θ 就是与竖直方向的夹角':
    'Along the y axis: θ is just the angle from vertical',
  '沿 y 轴看：看清 z 方向的波瓣分布': 'Along the y axis: the lobes along z',
  '沿 z 轴俯视：φ 就是赤道面上的方位角':
    'Down the z axis: φ is the azimuth in the equatorial plane',
  '沿 z 轴俯视：看清 m 带来的方位角结构':
    'Down the z axis: the azimuthal structure that m controls',
  '俯视：干涉扇形最清楚': 'From above: the interference fan is clearest',
  '俯视：看 X 方向的分束': 'From above: the X-direction split',
  '俯视：看概率在 (x₁,x₂) 平面上的分布':
    'From above: how probability spreads over the (x₁, x₂) plane',
  '俯视：看概率密度的分布宽度': 'From above: the width of the probability density',
  '俯视：看虚部的影子': 'From above: the imaginary-part shadow',
  '俯视瀑布图：时间从近到远': 'The waterfall from above: time runs away from you',
  俯视赤道: 'Looking down at the equator',
  '俯视赤道：相干项就是这个圆的半径':
    'Down at the equator: the coherence is the radius of this circle',
  同时看到当前波函数与它的历史: 'Both the current wavefunction and its history',
  同时看到波场与屏: 'Both the wave field and the screen',
  同时看到相位与概率密度: 'Both the phase and the probability density',
  同时看到相位转动与概率密度: 'Both the turning phase and the probability density',
  同时看到管子与两面墙上的影子: 'The tube plus both shadows on the walls',
  同时看到路径与相量链: 'Both the paths and the phasor chain',
  只看当前时刻: 'Only the present moment',
  侧面看整条光路: 'The whole beam path from the side',
  拉近看势垒内部的指数衰减: 'Zoom in on the exponential decay inside the barrier',
  拉近看矢量与投影: 'Zoom in on the vector and its projection',

  // ── 通用图例与读数 ──────────────────────────────────────
  'ψ（复数管）': 'ψ (complex tube)',
  'ψ（复数管）与实部影子': 'ψ (complex tube) and its real-part shadow',
  'ψ（复数管，扭转即相位）': 'ψ (complex tube — the twist is the phase)',
  'ψ（复数，随时间转动）': 'ψ (complex, turning in time)',
  'ψ（复平面里的管）': 'ψ (tube in the complex plane)',
  '|ψ|²': '|ψ|²',
  '|ψ|²（不随时间变）': '|ψ|² (time-independent)',
  '|ψ|²（概率密度幕布）': '|ψ|² (probability-density curtain)',
  '当前 |ψ|²': 'current |ψ|²',
  '|ψ|² 的历史（时间往后）': 'history of |ψ|² (time recedes)',
  概率密度: 'Probability density',
  '概率密度 |ψ|²': 'Probability density |ψ|²',
  实部影子: 'Real-part shadow',
  ' 实部影子 Re ψ': 'Real-part shadow Re ψ',
  '实部影子 Re ψ': 'Real-part shadow Re ψ',
  虚部影子: 'Imaginary-part shadow',
  '虚部影子 Im ψ': 'Imaginary-part shadow Im ψ',
  '势能 V(x)': 'Potential V(x)',
  '势垒 V(x)': 'Barrier V(x)',
  '能级 Eₙ': 'Energy levels Eₙ',
  经典粒子: 'Classical particle',
  经典粒子对照: 'Classical particle for comparison',
  经典概率分布: 'Classical probability distribution',
  经典概率分布对比: 'Compare with the classical distribution',
  轨迹: 'Trajectory',
  束缚态: 'bound',
  '非束缚（受计算窗口限制）': 'unbound (limited by the computational window)',
  节点数: 'nodes',

  // ── Bloch 球 ────────────────────────────────────────────
  'Bloch 球：把一个自旋态变成可以用手拖的几何对象':
    'The Bloch sphere: a spin state you can grab with your hand',
  '球面上的每一个点都是一个纯态。拖动箭头尖端改变状态，加上磁场看它进动，选一个轴测量看它塌缩。':
    'Every point on the sphere is one pure state. Drag the arrowhead to change it, switch on a magnetic field to watch it precess, pick an axis and measure to watch it collapse.',
  状态制备: 'Prepare a state',
  磁场与进动: 'Magnetic field and precession',
  '磁场不会把自旋「拉过去」，只会让它绕着磁场方向转圈——夹角始终不变。':
    'A magnetic field never "pulls" the spin towards itself. It makes the spin circle around the field direction, and the angle between them never changes.',
  磁场方向: 'Field direction',
  'Larmor 频率 ω': 'Larmor frequency ω',
  显示进动锥: 'Show the precession cone',
  测量: 'Measurement',
  测量轴: 'Measurement axis',
  '测量轴 n̂': 'Measurement axis n̂',
  显示投影辅助线: 'Show the projection line',
  测量一次: 'Measure once',
  '重复制备 ×200': 'Re-prepare ×200',
  '每次都重新制备成当前 |ψ⟩ 再测':
    'Each round re-prepares the same |ψ⟩ before measuring',
  清空统计: 'Clear statistics',
  '理论 P₊': 'Theory P₊',
  '实测频率（{0} 次）': 'Measured frequency ({0} runs)',
  状态矢量: 'State vector',
  ' 状态矢量 r⃗': 'State vector r⃗',
  '状态矢量 r⃗': 'State vector r⃗',
  进动锥: 'Precession cone',
  到测量轴的投影: 'Projection onto the measurement axis',
  '点一下：在球上画出 θ': 'Click: draw θ on the sphere',
  '点一下：在球上画出 θ（与 +z 轴的夹角）':
    'Click: draw θ on the sphere (the angle from +z)',
  '点一下：在赤道面上画出 φ（相对相位）':
    'Click: draw φ in the equatorial plane (the relative phase)',
  '读数区的公式是可以点的：点 cos(θ/2) 那一项，球上会画出 θ 这个夹角；点 e^{iφ} 那一项，赤道面上会画出 φ。公式里的每个符号在球上都有一个对应的几何量。':
    'The formula in the readout is clickable. Click the cos(θ/2) term and θ appears on the sphere; click e^{iφ} and φ appears in the equatorial plane. Every symbol in the formula is some geometric quantity on the sphere.',
  '先把 θ 拖到 90°：状态落在赤道上，此时沿 z 测量得到 0 和 1 的概率各一半——「等概率叠加」在球面上就是「站在赤道」。':
    'Start by dragging θ to 90°. The state lands on the equator, and measuring along z gives 0 and 1 with equal probability. On the sphere, "equal superposition" simply means "standing on the equator".',
  '保持 θ 不变、只拖 φ：沿 z 测量的概率完全不变。φ 是相对相位，它在 z 基下不可见，却决定了沿 x、y 测量的结果。切到 σx 再拖一次 φ，看读数怎么变。':
    'Now hold θ fixed and drag only φ: the probabilities along z do not budge. φ is the relative phase — invisible in the z basis, yet it fixes the outcome along x and y. Switch to σx and drag φ again to see the readout move.',
  '打开磁场按播放：注意矢量与磁场方向的夹角始终不变，只有 φ 在匀速变化，这就是 Larmor 进动。':
    'Switch on the field and press play. The angle between the vector and the field never changes; only φ changes at a steady rate. That is Larmor precession.',
  '点「测量一次」十几次，观察单次结果是随机的；再点「重复制备 ×200」，看实测频率如何逼近理论 P₊。':
    'Hit "Measure once" a dozen times and watch how random single outcomes are. Then hit "Re-prepare ×200" and watch the measured frequency close in on the theoretical P₊.',
  '“Bloch 球上的点就是粒子在空间中的方向”':
    '"A point on the Bloch sphere is the direction the particle points in space"',
  '不是。球面是态空间，不是真实空间。θ = 90° 并不代表自旋「躺在水平面上」，而是代表沿 z 测量时上下各一半。':
    'It is not. The sphere is state space, not real space. θ = 90° does not mean the spin "lies flat"; it means that measuring along z gives up and down half the time each.',
  '“测量后再测一次会得到不同结果”': '"Measuring again gives a different answer"',
  '不会。测量把态投影到本征态上，紧接着沿同一轴再测必得同样结果。要看到统计规律，必须每次重新制备——这正是「重复制备 ×200」在做的事。':
    'It does not. Measurement projects the state onto an eigenstate, so an immediate second measurement along the same axis repeats the first result. To see the statistics you must re-prepare every time — which is exactly what "Re-prepare ×200" does.',
  '两个只差一个整体相位的态（|ψ⟩ 与 e^{iα}|ψ⟩）在球面上是同一个点吗？如果是，为什么说相对相位 φ 却是可观测的？':
    'Are |ψ⟩ and e^{iα}|ψ⟩ the same point on the sphere? If so, why is the relative phase φ observable while the global phase is not?',
  '若磁场沿 z、初态恰好是 |0⟩，播放后画面上什么都没发生。用「本征态不随时间改变（除整体相位）」解释这件事。':
    'With the field along z and the initial state exactly |0⟩, pressing play changes nothing on screen. Explain that using "an eigenstate only picks up a global phase".',
  '把测量轴设成 σx、状态设成 |0⟩，理论 P₊ = 0.5。测量一次后状态停在 ±x 上，此时若改回 σz 测量，概率是多少？这说明连续测不同方向意味着什么？':
    'Set the measurement axis to σx with the state at |0⟩, so P₊ = 0.5. After one measurement the state sits on ±x. Switch back to σz — what are the probabilities now? What does that say about measuring different directions in sequence?',

  // ── 波函数 ──────────────────────────────────────────────
  '波函数：一条在复平面里扭动的曲线':
    'The wavefunction: a curve writhing in the complex plane',
  '中间那根管子是 ψ 本身。两面墙上的曲线是它的实部与虚部影子，右侧的幕布是 |ψ|²——唯一能直接对应实验的量。':
    'The tube in the middle is ψ itself. The curves on the two walls are its real and imaginary shadows; the curtain on the right is |ψ|², the only one of the three that maps directly onto an experiment.',
  制备波包: 'Prepare a wave packet',
  '中心位置 x₀': 'Centre x₀',
  '宽度 σ': 'Width σ',
  '平均动量 k₀': 'Mean momentum k₀',
  '加一个反向波包（看干涉）': 'Add a counter-propagating packet (to see interference)',
  归一化: 'Normalise',
  整体幅度: 'Overall amplitude',
  重新制备: 'Re-prepare',
  '拖动整体幅度，形状完全不变，只有高度在缩放。点「归一化」把 ∫|ψ|²dx 拉回 1——这就是「粒子总在某处」。':
    'Drag the overall amplitude: the shape never changes, only the height scales. Press "Normalise" to pull ∫|ψ|²dx back to 1 — that equation is just "the particle is somewhere".',
  测量位置: 'Measure position',
  '仪器分辨率 δ': 'Instrument resolution δ',
  测量一次位置: 'Measure the position once',
  '测量后波包被压到宽度 δ，然后立刻开始迅速展开——δ 越小，展开越快。这不是仪器的毛病，是 Δx·Δp ≥ ħ/2。':
    'After the measurement the packet is squeezed to width δ and immediately starts spreading — the smaller δ, the faster it spreads. That is not an instrument defect, it is Δx·Δp ≥ ħ/2.',
  演化与显示: 'Evolution and display',
  '先切到「沿 x 看」视角：你正对复平面，每个 x 上的 ψ 就是一个复数（一个箭头）。管子的扭转就是相位沿 x 的变化。':
    'Start with the "Along x" view. You are facing the complex plane, and at each x the value of ψ is one complex number — one little arrow. The twist of the tube is how the phase changes along x.',
  '再切到「看实部」：得到的正是教科书上那条上下振荡的曲线。它只是三维曲线的一个影子——虚部的信息在这个视角下完全丢失了。':
    'Now switch to "At the real part": you get exactly the oscillating curve textbooks print. It is only one shadow of the 3D curve — from this angle the imaginary part is entirely lost.',
  '把 k₀ 拖到 0：管子不再扭转（相位处处相同），实部还在、虚部变成零。此时波包不再整体移动，只是原地展开。':
    'Drag k₀ to zero: the tube stops twisting (the phase is the same everywhere), the real part survives and the imaginary part vanishes. The packet no longer travels — it just spreads where it stands.',
  '拖动「整体幅度」：形状不变，∫|ψ|² 偏离 1 并变红。点「归一化」，高度被拉回来——这就是归一化的全部内容。':
    'Drag "Overall amplitude": the shape is untouched while ∫|ψ|² drifts away from 1 and turns red. Press "Normalise" and the height snaps back. That is all normalisation ever does.',
  '按几次「测量一次位置」：落点每次不同，但集中在 |ψ|² 大的地方；测完波包被压窄，然后迅速展开。把分辨率 δ 调到最小再测，展开会快得多。':
    'Press "Measure the position once" a few times: the outcome differs each time but clusters where |ψ|² is large. After each measurement the packet is narrow, then spreads fast. Set δ to its smallest value and measure again — it spreads much faster.',
  '“实部是波函数，虚部是数学技巧”':
    '"The real part is the wavefunction; the imaginary part is a mathematical trick"',
  '两者地位完全对等。只看实部会丢掉相位信息，而相位决定概率流与一切干涉。场景里把视角切到「看实部」时，虚部影子的存在就是提醒。':
    'The two are on exactly equal footing. Keeping only the real part throws away the phase, and the phase determines the probability current and every interference effect. That is why the imaginary shadow stays visible even in the "real part" view.',
  '“|ψ(x)|² 是粒子在 x 处的概率”': '"|ψ(x)|² is the probability of the particle being at x"',
  '是概率**密度**。单点概率为零，只有在区间上积分才是概率。量纲上 |ψ|² 是 1/长度。':
    'It is a probability **density**. The probability at a single point is zero; only an integral over an interval is a probability. Dimensionally |ψ|² is 1/length.',
  '“测量把波函数变成一个点”': '"Measurement turns the wavefunction into a point"',
  '真实测量的分辨率有限，波包被压到分辨率宽度而不是 δ 函数。压得越窄，动量越不确定，展开越快。':
    'Real measurements have finite resolution, so the packet is squeezed to that width, not to a delta function. The tighter the squeeze, the more uncertain the momentum and the faster it spreads.',
  '把 k₀ 设为正、σ 设得很小，观察 Δp 的读数。为什么波包越窄、动量越不确定？（提示：窄高斯的傅里叶变换是宽高斯。）':
    'Set k₀ positive and σ very small, then watch the Δp readout. Why does a narrower packet mean a more uncertain momentum? (Hint: the Fourier transform of a narrow Gaussian is a wide Gaussian.)',
  '打开「加一个反向波包」：两团概率相遇时中间出现条纹。这些条纹会不会出现在「两个经典粒子概率分布之和」里？':
    'Switch on the counter-propagating packet: fringes appear where the two blobs of probability meet. Could those fringes ever appear in a *sum* of two classical probability distributions?',
  '自由粒子的 |ψ|² 一直在展开，永不收缩。这与「时间反演对称」矛盾吗？（提示：把时间倒过来放，看到的是什么？）':
    'A free particle\'s |ψ|² spreads forever and never contracts. Does that contradict time-reversal symmetry? (Hint: what do you see if you run the film backwards?)',

  // ── 一维束缚态 ──────────────────────────────────────────
  '一维束缚态：能级、波函数与「定态为什么是静止的」':
    'Bound states in one dimension: levels, wavefunctions, and why a stationary state is "stationary"',
  '蓝色的管子是 ψ 在复平面里的样子，它随时间转动；紫色幕布是 |ψ|²，它一动不动。这就是「定态」的全部含义。':
    'The blue tube is ψ drawn in the complex plane, and it turns as time passes. The purple curtain is |ψ|², and it never moves. That contrast is the entire meaning of the word "stationary".',
  势阱: 'Potential well',
  无限深: 'Infinite',
  有限深: 'Finite',
  谐振子: 'Harmonic',
  无限深阱: 'Infinite well',
  无限深方阱: 'Infinite square well',
  有限深方阱: 'Finite square well',
  '阱宽 L': 'Width L',
  '阱深 V₀': 'Depth V₀',
  '角频率 ω': 'Angular frequency ω',
  能级: 'Energy levels',
  '点能级尺或 3D 里的曲线都能切换量子数。':
    'Click the level ruler or any curve in the 3D view to switch quantum number.',
  '量子数 n': 'Quantum number n',
  'ψ（复平面里的管）': 'ψ (tube in the complex plane)',
  其余本征态轮廓: 'Outlines of the other eigenstates',
  时间演化: 'Time evolution',
  '相位 {0}°': 'Phase {0}°',
  '先按播放，然后切到「沿 x 看」视角：你正对着复平面，会看到 ψ 在原地转圈。转的是相位，不是概率——紫色幕布始终不动。':
    'Press play, then switch to the "Along x" view. Facing the complex plane you see ψ spinning on the spot. What spins is the phase, not the probability — the purple curtain never moves.',
  '把量子数 n 从 0 调到 5：数一数波函数穿过零点的次数，应当恰好等于 n。同时注意能级间距怎么变——无限深阱是 n²，谐振子是等间距。':
    'Take n from 0 up to 5 and count the zero crossings: there are exactly n of them. Watch the level spacing at the same time — n² for the infinite well, evenly spaced for the oscillator.',
  '切到有限深阱，把 V₀ 调小：能级一条条被「挤出」阱口，束缚态越来越少。同时注意波函数在阱壁外并不为零——它指数衰减地渗出去，这正是隧道效应的根。':
    'Switch to the finite well and lower V₀: levels get squeezed out of the well one by one. Notice that the wavefunction is not zero outside the walls — it leaks out with exponential decay, and that leak is the root of tunnelling.',
  '选谐振子、把 n 调到最大，打开「经典概率分布对比」：量子分布的包络开始贴近经典结果，两端最大、中间最小。这就是对应原理。':
    'Pick the oscillator, push n to its maximum and switch on the classical comparison: the envelope of the quantum distribution hugs the classical one, largest at the turning points and smallest in the middle. That is the correspondence principle.',
  '打开「其余本征态轮廓」并旋转视角：能级图与波函数图其实是同一张图的两个投影方向。':
    'Switch on the other eigenstates and rotate: the level diagram and the wavefunction plot turn out to be two projections of a single picture.',
  '“波函数是粒子在空间中的形状”': '"The wavefunction is the shape of the particle in space"',
  'ψ 不是物质分布。它是复振幅；有物理意义的是 |ψ|²（概率密度）以及不同态之间的相对相位。':
    'ψ is not a distribution of stuff. It is a complex amplitude; what carries physical meaning is |ψ|² (a probability density) and the relative phase between states.',
  '“定态里粒子在阱中来回运动”': '"In a stationary state the particle rattles back and forth"',
  '定态的概率密度完全不随时间变化，也没有概率流。会「流动」的只有叠加态——那是模块 09 的内容。':
    'The probability density of a stationary state does not change at all, and there is no probability current. Only superpositions flow — that is module 09.',
  '“无限深阱里 ψ 在墙外为零，所以有限深阱也一样”':
    '"ψ vanishes outside an infinite well, so it must vanish outside a finite one too"',
  '恰恰相反。有限深阱里波函数以 e^{−κ|x|} 渗入经典禁区，这是纯量子效应，也是隧道效应的直接来源。':
    'The opposite. In a finite well the wavefunction penetrates the classically forbidden region as e^{−κ|x|}. That is a purely quantum effect, and it is where tunnelling comes from.',
  '为什么基态能量不是零？把阱宽调窄时基态能量怎么变？用不确定性原理估一估 E ~ ħ²/(2mL²) 并与读数对照。':
    'Why is the ground-state energy not zero? What happens to it as you narrow the well? Estimate E ~ ħ²/(2mL²) from the uncertainty principle and compare with the readout.',
  '无限深阱 E_n ∝ n²，谐振子 E_n ∝ (n + ½) 等间距。从「波必须在阱内装下整数个半波长」和「势能是二次的」两条出发，解释这个差别。':
    'The infinite well gives E_n ∝ n², the oscillator gives evenly spaced E_n ∝ (n + ½). Explain the difference starting from "an integer number of half-wavelengths must fit" and "the potential is quadratic".',
  '有限深阱无论多浅，都至少有一个束缚态（一维特有）。把 V₀ 调到 0.5 试试。这在三维中不成立——为什么维度会有影响？':
    'However shallow it is, a one-dimensional finite well always holds at least one bound state. Try V₀ = 0.5. This fails in three dimensions — why should dimensionality matter?',

  // ── 双缝 ────────────────────────────────────────────────
  '双缝：一个一个打上去的粒子，怎么会长出条纹':
    'The double slit: how do particles arriving one at a time grow fringes?',
  '屏上每一个亮点都是一次独立的探测。看着它们一颗颗落下，条纹是自己浮现出来的——没有任何一个粒子「知道」条纹在哪。':
    'Every bright dot on the screen is one independent detection. Watch them land one by one: the fringes emerge on their own, and no single particle ever "knew" where they would be.',
  实验模式: 'Experiment mode',
  单粒子累积: 'One particle at a time',
  经典波: 'Classical wave',
  经典波场: 'Classical wave field',
  开着的缝: 'Open slits',
  双缝: 'Both slits',
  只开左: 'Left only',
  只开右: 'Right only',
  '在缝口安放探测器（知道走哪条）':
    'Put a detector at the slits (learn which path)',
  参数: 'Parameters',
  '波长 λ': 'Wavelength λ',
  '缝间距 d': 'Slit separation d',
  '单缝宽 a': 'Slit width a',
  '缝到屏距离 L': 'Slit-to-screen distance L',
  '改变 L 只改变条纹的疏密，不改变干涉本身':
    'Changing L only stretches the fringes; it does not touch the interference itself',
  '条纹间距 Δy = λL/d ≈ {0}': 'Fringe spacing Δy = λL/d ≈ {0}',
  发射: 'Emission',
  '{0} 个': '{0} so far',
  清空屏幕: 'Clear the screen',
  缝后的波场: 'Wave field behind the slits',
  屏上分布: 'Distribution on the screen',
  屏上的强度分布与实测直方图: 'Intensity on the screen and the measured histogram',
  '细线是理论强度 I(y)，填充是实测落点直方图。粒子数越多，两者越贴合。':
    'The thin line is the predicted intensity I(y); the filled area is the histogram of actual hits. The more particles, the closer they get.',
  '波场强度 / 理论 I(y)': 'Field intensity / predicted I(y)',
  单个粒子的落点: 'Individual particle hits',
  挡板与屏: 'Barrier and screen',
  路径探测器: 'Which-path detector',
  挡板: 'Barrier',
  屏: 'Screen',
  源: 'Source',
  '已探测 {0} 个粒子': '{0} particles detected',
  '路径探测器：开': 'Which-path detector: ON',
  '已探测 {0} 个': '{0} detected',
  '0（无条纹）': '0 (no fringes)',
  单缝包络: 'single-slit envelope',
  可见度: 'Visibility',
  '先什么都别动，盯着屏看 10 秒：前几十个点看上去毫无规律，几百个之后条纹开始浮现。这就是「概率」两个字的实际含义。':
    'Change nothing at first — just watch the screen for ten seconds. The first few dozen dots look completely random; after a few hundred the fringes surface. That is what the word "probability" actually means here.',
  '切到「只开左」：条纹消失，只剩一个宽包络（单缝衍射）。再切回双缝——注意双缝的暗纹位置，恰恰是单缝时有粒子到达的地方。「多开一条缝反而让某些地方没有粒子」，经典粒子图像在这里彻底失效。':
    'Switch to "Left only": the fringes vanish and a broad envelope remains (single-slit diffraction). Now switch back and look at where the dark fringes fall — exactly where particles did arrive with one slit open. Opening a second slit removes particles from places they used to reach; the classical particle picture dies right there.',
  '打开「在缝口安放探测器」：条纹当场消失，分布变成两条缝各自贡献的简单叠加。关掉它，条纹回来。获取路径信息与看到干涉，二者不可兼得。':
    'Switch on the which-path detector: the fringes disappear on the spot and the distribution becomes a plain sum of the two single-slit patterns. Switch it off and they come back. You can have the path information or the interference, never both.',
  '拖动波长 λ 与缝距 d，验证 Δy = λL/d：λ 变大条纹变疏，d 变大条纹变密。':
    'Drag λ and d to check Δy = λL/d: larger λ spreads the fringes, larger d packs them together.',
  '切到「经典波」并用俯视视角：看缝后的波场如何从两个点源扩散、交叠、形成放射状的亮暗扇形。屏上的条纹只是这个扇形与屏的交线。':
    'Switch to "Classical wave" and look from above: two point sources spread, overlap and build a radiating fan of bright and dark. The fringes on the screen are just where that fan meets the screen.',
  '“粒子分裂了，一半走一条缝”': '"The particle splits, half through each slit"',
  '不会。每次探测到的都是一个完整的粒子，从不是半个。干涉的是概率幅，不是粒子本身。':
    'It does not. Every detection registers one whole particle, never half of one. What interferes is the probability amplitude, not the particle.',
  '“粒子之间互相干涉”': '"The particles interfere with each other"',
  '把发射速率降到每秒一个、粒子在装置里绝不相遇，条纹照样出现。干涉发生在单个粒子的两条可能路径之间。':
    'Drop the rate to one particle per second so that no two are ever inside the apparatus together: the fringes still appear. The interference is between the two possible paths of a single particle.',
  '“探测器把粒子撞歪了，所以条纹没了”':
    '"The detector knocks the particle sideways, so the fringes die"',
  '这个解释在某些具体装置里成立，但不是本质。即使用不交换动量的方式获取路径信息，条纹同样消失。真正的原因是路径信息被环境记录后，两条路径不再相干。':
    'That story holds in some particular set-ups but it is not the reason. Even schemes that extract which-path information without exchanging momentum destroy the fringes. The real cause is that once the environment records the path, the two paths are no longer coherent.',
  '把 λ 调到最小、d 调到最大，条纹密到几乎看不见。宏观物体（比如一颗子弹）的德布罗意波长约 10⁻³⁴ m，估算一下它的条纹间距，说明为什么我们从未在日常生活中见过干涉。':
    'Set λ to its smallest and d to its largest: the fringes get too fine to see. A bullet has a de Broglie wavelength of about 10⁻³⁴ m — estimate its fringe spacing and explain why nobody has ever bumped into interference in daily life.',
  '若在两条缝后各放一个可以事后擦除的路径标记（量子擦除），条纹能否恢复？这对「测量在什么时刻发生」意味着什么？':
    'Suppose the path markers behind the slits can be erased afterwards (a quantum eraser). Can the fringes come back? What does that say about *when* a measurement happens?',
  '单缝包络的宽度由 a 决定，条纹间距由 d 决定。为什么这两个长度控制的是完全不同的两件事？':
    'The envelope width is set by a, the fringe spacing by d. Why do these two lengths control completely different things?',

  // ── 隧道效应 ────────────────────────────────────────────
  '隧道效应：波包撞上一堵它「翻不过」的墙':
    'Tunnelling: a wave packet hits a wall it cannot climb',
  '经典小球在 E < V₀ 时必然弹回。看着波包撞上势垒——一部分反射，一部分渗进墙里指数衰减，还有一部分真的出现在了另一侧。':
    'A classical ball with E < V₀ always bounces back. Watch the wave packet hit the barrier instead: part reflects, part decays exponentially inside the wall, and part genuinely turns up on the far side.',
  势垒: 'Barrier',
  '高度 V₀': 'Height V₀',
  '宽度 a': 'Width a',
  入射波包: 'Incident wave packet',
  '平均能量 E': 'Mean energy E',
  '波包宽度 σ': 'Packet width σ',
  'σ 越大动量越确定，透射率越接近平面波的解析值':
    'A wider σ means a sharper momentum, and a transmission closer to the plane-wave formula',
  'E < V₀：经典上完全禁止穿透': 'E < V₀: classically forbidden',
  'E > V₀：经典上必定穿过，但量子仍有反射':
    'E > V₀: classically certain to pass, yet quantum mechanics still reflects some of it',
  演化: 'Evolution',
  '显示 ψ（复数管）': 'Show ψ (complex tube)',
  纵向放大: 'Vertical magnification',
  '纵向尺度固定在初始波包上，所以透射出来的那一小团是真的小。放大只是为了看清它的形状。':
    'The vertical scale is pinned to the initial packet, so the transmitted blob really is that small. Magnifying only helps you see its shape.',
  '透射率 T(E)': 'Transmission T(E)',
  透射率随能量变化: 'Transmission versus energy',
  '蓝线是当前能量，灰线是势垒高度。注意 E > V₀ 之后 T 并不等于 1，而是振荡着逼近 1—— 那是势垒两端反射波的干涉（共振透射）。':
    'The blue line is the current energy, the grey line the barrier height. Note that T does not equal 1 once E > V₀: it oscillates towards 1, because the waves reflected at the two faces interfere (resonant transmission).',
  '数值：反射 R / 透射 T': 'Numerical: reflected R / transmitted T',
  反射: 'reflected',
  透射: 'transmitted',
  仍在势垒附近: 'still near the barrier',
  '解析（平面波）T = {0}': 'Analytic (plane wave) T = {0}',
  '剩余归一化 {0}': 'Remaining norm {0}',
  '默认参数下 E < V₀。按播放，盯住势垒右侧：会有一小团概率密度从墙里钻出来继续向右跑。它的面积就是透射率 T。':
    'With the default settings E < V₀. Press play and keep your eyes on the right of the barrier: a small blob of probability density emerges from the wall and keeps travelling. Its area is the transmission T.',
  '暂停在波包刚好压在势垒上的时刻，切到「看势垒」视角：墙内部的 |ψ|² 不是零，而是指数衰减 e^{−2κx}。墙越宽，钻出来的越少——这就是 T ≈ e^{−2κa} 的来历。':
    'Pause the moment the packet is pressed against the barrier and switch to the barrier close-up. Inside the wall |ψ|² is not zero but decays as e^{−2κx}. The wider the wall, the less gets through — that is where T ≈ e^{−2κa} comes from.',
  '把势垒宽度 a 从 1.6 调到 3.2（只翻一倍），看 T 掉了多少个数量级。指数依赖意味着扫描隧道显微镜能分辨单个原子台阶。':
    'Take the width from 1.6 to 3.2 — merely doubling it — and see how many orders of magnitude T loses. That exponential sensitivity is why a scanning tunnelling microscope can resolve a single atomic step.',
  '把 E 调到略大于 V₀：经典上应当 100% 通过，但你会看到仍有一部分被反射回去。「量子反射」是波动性的另一面。':
    'Push E just above V₀. Classically everything should pass, yet some of the packet still bounces back. "Quantum reflection" is the other face of wave behaviour.',
  '打开经典粒子对照：小球撞墙原路弹回，永远不会出现在右侧。两者并排跑一次，差别一目了然。':
    'Switch on the classical particle: the ball rebounds along its own path and never appears on the right. Run the two side by side once and the difference speaks for itself.',
  '“粒子从墙里借了能量翻过去”': '"The particle borrows energy from the wall and climbs over"',
  '不需要借。定态里能量是确定的，波函数本来就在经典禁区有非零值——它是指数衰减的实指数解，不是「翻越」。把「借能量」当成正式解释会在计算里立刻出错。':
    'Nothing is borrowed. In a stationary state the energy is definite, and the wavefunction is simply non-zero in the forbidden region — a decaying real exponential, not a climb. Treating "borrowed energy" as a real mechanism makes calculations go wrong immediately.',
  '“势垒里的粒子速度是虚数”': '"Inside the barrier the particle has imaginary velocity"',
  '势垒内部没有定义良好的经典速度。那里的波数 k = i κ 是纯虚的，对应的是衰减而不是传播，谈「速度」已经越界了。':
    'There is no well-defined classical velocity inside the barrier. The wave number k = iκ is purely imaginary, which means decay, not propagation; talking about "velocity" there has already left the domain of the theory.',
  '“透射率随宽度线性下降”': '"Transmission falls off linearly with width"',
  '是指数下降。宽度翻倍，T 平方级地掉。这个差别是隧道效应一切应用（STM、α 衰变、核聚变）的关键。':
    'It falls exponentially. Double the width and T is squared. That distinction is the basis of every application of tunnelling — STM, α decay, stellar fusion.',
  '把 σ 调大（动量更确定），数值 T 会更接近平面波解析值；σ 小的时候两者偏离。为什么？（提示：波包是很多不同 k 的叠加，每个 k 有自己的 T。）':
    'A larger σ (sharper momentum) brings the numerical T closer to the plane-wave formula; a small σ pulls them apart. Why? (Hint: a packet is a superposition of many k, each with its own T.)',
  'α 衰变的半衰期能从 10⁻⁷ 秒跨到 10¹⁷ 年，跨了 30 多个数量级，而对应的能量只差几个 MeV。用 T ≈ e^{−2κa} 解释这个夸张的敏感性。':
    'Half-lives for α decay run from 10⁻⁷ seconds to 10¹⁷ years — more than thirty orders of magnitude — while the energies differ by only a few MeV. Explain that ferocious sensitivity with T ≈ e^{−2κa}.',
  '如果势垒高度是无穷大，T 严格为零吗？把 V₀ 拉到最大试试，再想想「无限深方阱」的边界条件是怎么来的。':
    'Is T exactly zero for an infinitely high barrier? Push V₀ to its maximum, then reconsider where the boundary condition of the infinite square well comes from.',

  // ── 氢原子轨道 ──────────────────────────────────────────
  '氢原子轨道：真正看见 |ψ(r)|² 长什么样':
    'Hydrogen orbitals: actually seeing what |ψ(r)|² looks like',
  '每个点是一次位置测量的可能结果，点的疏密就是概率密度。切换量子数，看波瓣、节点与尺度如何随 n、l、m 变化。':
    'Each dot is one possible outcome of a position measurement, and their density is the probability density. Change the quantum numbers and watch the lobes, the nodes and the sheer size respond to n, l and m.',
  量子数: 'Quantum numbers',
  '主量子数 n': 'Principal quantum number n',
  '角量子数 l': 'Angular quantum number l',
  '磁量子数 m': 'Magnetic quantum number m',
  '当前：{0}　l < n，|m| ≤ l': 'Current: {0} · l < n, |m| ≤ l',
  表示方式: 'Representation',
  实轨道: 'Real orbitals',
  '复轨道 |Y_lm|²': 'Complex |Y_lm|²',
  '化学课上画的哑铃、四叶草是「实球谐」；复球谐的 |ψ|² 关于 z 轴旋转对称，看不出方位角结构。两者都对，只是基底选得不同。':
    'The dumbbells and cloverleaves of chemistry class are the *real* spherical harmonics. For the complex ones, |ψ|² is symmetric about z and shows no azimuthal structure at all. Both are correct — they are just different choices of basis.',
  点云不透明度: 'Point-cloud opacity',
  结构与剖切: 'Structure and clipping',
  '径向节点球面（{0} 个）': 'Radial node spheres ({0})',
  半径刻度环: 'Radius rings',
  剖切平面: 'Clipping plane',
  剖切位置: 'Clip position',
  '径向概率 P(r) = r²|R(r)|²': 'Radial probability P(r) = r²|R(r)|²',
  径向概率分布: 'Radial probability distribution',
  '竖虚线是径向节点。注意峰值位置随 n 迅速外移——这就是原子「变大」的含义。':
    'The dashed verticals are radial nodes. Watch how fast the peak moves outward with n — that is what it means for an atom to "grow".',
  'ψ > 0 的波瓣': 'lobes with ψ > 0',
  'ψ < 0 的波瓣': 'lobes with ψ < 0',
  径向节点球面: 'radial node spheres',
  径向节点: 'Radial nodes',
  角向节点: 'Angular nodes',
  总节点: 'Total nodes',
  采样点: 'Sampled points',
  显影中: 'developing',
  'z（量子化轴）': 'z (quantisation axis)',
  '先看 1s → 2s → 3s：形状都是球，但半径迅速变大，中间多出一层层的节点球面。原子的「大小」就是这么来的。':
    'Start with 1s → 2s → 3s. All three are spherical, but the radius grows fast and node spheres appear inside. That is where the "size" of an atom comes from.',
  '固定 n = 2，把 l 从 0 调到 1：球变成哑铃。再调 m，哑铃换方向——这就是 p_z、p_x、p_y 的来历。':
    'Hold n = 2 and take l from 0 to 1: the sphere becomes a dumbbell. Now change m and the dumbbell swings to a new direction — that is all p_z, p_x and p_y are.',
  '选 3d、m = ±2，打开剖切平面并拖动它：从外面看是四叶草，剖开才看得到中间是空的。':
    'Choose 3d with m = ±2, switch on the clipping plane and drag it. From outside it is a cloverleaf; only a cut reveals that the middle is empty.',
  '把「实轨道」切到「复轨道」：形状立刻变成绕 z 轴旋转对称的圆环。两种画法描述同一组本征态，只是基底不同——化学里习惯用实的，做角动量代数时习惯用复的。':
    'Switch from real to complex orbitals: the shape immediately becomes a ring, symmetric about z. Both describe the same set of eigenstates in different bases — chemists prefer the real ones, angular-momentum algebra prefers the complex ones.',
  '打开径向节点球面，数一数：球面数应当恰好是 n − l − 1。':
    'Switch on the node spheres and count them: there are exactly n − l − 1.',
  '“电子在轨道上绕着核转”': '"The electron orbits the nucleus"',
  '定态里没有轨迹。点云不是电子走过的路线，而是「如果现在测量位置，结果落在这里的概率」。定态的概率密度完全不随时间变化。':
    'A stationary state has no trajectory. The cloud is not a path the electron traced out; it is "the probability that a position measurement lands here". The density does not change with time at all.',
  '“轨道有明确的边界”': '"Orbitals have a definite boundary"',
  '|ψ|² 在任何有限半径外都不为零，只是指数衰减。图上看到的「边缘」是采样点稀疏到画不出来而已，不是墙。':
    '|ψ|² is non-zero beyond any finite radius; it merely decays exponentially. The "edge" you see is where the sampled points thin out, not a wall.',
  '“节点是电子不能通过的地方”': '"Nodes are places the electron cannot cross"',
  '节点面上概率密度为零，但这不构成「屏障」。在束缚态里问「电子怎么穿过节点」本身就预设了轨迹，而轨迹并不存在。':
    'The density is zero on a nodal surface, but that is not a barrier. Asking how the electron "gets across" a node already presupposes a trajectory, and there is none.',
  '为什么氢原子的能量只依赖 n，与 l、m 无关？（提示：这是库仑势特有的额外简并，别的中心力场没有。）':
    'Why does the hydrogen energy depend only on n and not on l or m? (Hint: this extra degeneracy is peculiar to the Coulomb potential; other central forces do not have it.)',
  '2p_z 与 2p_x 的能量相同、形状只差一个转动。那么「电子处在 2p_z 上」这句话有绝对意义吗？':
    '2p_z and 2p_x have the same energy and differ only by a rotation. Does "the electron is in 2p_z" have any absolute meaning?',
  '总节点数恒等于 n − 1。回想一维势阱里第 n 个态有 n 个节点——两件事之间是什么关系？':
    'The total node count is always n − 1. Recall that the nth state of a one-dimensional well has n nodes — how are the two facts related?',
}
