/** 站点框架（导航、页眉页脚、目录、首页、模块页）的英文译文。 */
export const DICT_UI: Record<string, string> = {
  // ── 站点与页眉 ──────────────────────────────────────────
  量子力学阶梯: 'Quantum Ladder',
  跳到正文: 'Skip to content',
  '从零基础到前沿的量子力学系统教程，以 3D 交互场景为主讲。':
    'Quantum mechanics from scratch to the research frontier, taught mainly through interactive 3D scenes.',
  打开目录: 'Open contents',
  搜索: 'Search',
  '公式速查（快捷键 f）': 'Formula reference (press f)',
  公式速查: 'Formula reference',
  '切换深浅色（快捷键 t）': 'Toggle light / dark (press t)',
  切换深浅色主题: 'Toggle light / dark theme',
  切换语言: 'Switch language',
  首页: 'Home',
  '3D 实验室': '3D Lab',
  '教材（深入阅读）': 'Textbook (go deeper)',
  目录: 'Contents',
  章节目录: 'Chapter contents',

  // ── 侧栏 ────────────────────────────────────────────────
  主路径: 'Main track',
  扩展模块: 'Branches',
  附录: 'Appendices',
  含交互模拟: 'includes an interactive simulation',
  待写: 'to write',
  待撰写: 'Not written yet',
  '{0} 个 3D 场景': '{0} 3D scenes',
  '{0} / {1} 节已定稿': '{0} / {1} sections finalised',

  // ── 模块页 ──────────────────────────────────────────────
  '模块 {0}': 'Module {0}',
  你将看见什么: 'What you will see',
  前置知识: 'Assumed background',
  建议先掌握: 'Recommended first',
  本页大纲: 'On this page',
  '深入阅读 · 教材对应小节': 'Go deeper · matching textbook sections',
  '3D 场景负责建立图像，完整的推导与习题在教材部分。':
    'The 3D scenes build the picture; the full derivations and exercises live in the textbook.',
  学完这一模块: 'Having finished this module',
  上一模块: 'Previous module',
  下一模块: 'Next module',
  '本模块的 3D 场景尚在建设中，当前页面给出的是场景规格与要点。':
    'The 3D scene for this module is still being built. What follows is the specification and the key points.',
  '本模块为草稿：场景可用，文字与观察指南还在打磨。':
    'Draft: the scene works, but the text and the observation guide are still being polished.',

  // ── 实验室目录页 ────────────────────────────────────────
  '{0} 个模块、{1} 个 3D 场景。每个场景都在你的浏览器里实时求解—— 波函数、能级、透射率、Bell 关联都是当场算出来的，拖动参数立刻重算，不是预渲染的动画。':
    '{0} modules, {1} 3D scenes. Every scene is solved live in your browser — wavefunctions, energy levels, transmission coefficients and Bell correlations are all computed on the spot and recomputed the instant you move a slider. None of it is pre-rendered.',
  '第一次来？先看': 'First time here? Start with',
  '模块 00：如何使用这个平台': 'Module 00: how to use this platform',
  '，两分钟。': ' — two minutes.',
  核心: 'Core',
  扩展: 'Extended',
  补充: 'Supplementary',
  无场景: 'no scene',
  '{0} 个 3D 场景。': '{0} 3D scenes.',
  '{0} 个模块、{1} 个 3D 场景。': '{0} modules and {1} 3D scenes.',
  想要完整的推导与习题: 'Looking for the full derivations and exercises',
  '想要完整的推导与习题？': 'Looking for the full derivations and exercises?',
  '3D 模块负责建立物理图像，教材部分负责把它算清楚。每个模块页面底部都有对应章节的直达链接， 也可以直接从侧栏的「教材」进入。':
    'The 3D modules build the physical picture; the textbook does the calculation properly. Every module page links directly to the matching chapters, and the sidebar has the whole textbook under "Textbook".',

  // ── 首页 ────────────────────────────────────────────────
  'ψ · 3D 优先 · 纯前端 · 无需注册 · 可离线使用':
    'ψ · 3D first · front-end only · no sign-up · works offline',
  '这不是电子书。{0} 个 3D 交互场景是这里的主讲人——每一个重要原理都尽可能用三维把物理图像讲透， 让你先「看见」量子世界在发生什么，再谈公式。所有计算都在你的浏览器里实时进行。':
    'This is not an e-book. {0} interactive 3D scenes do the teaching here: every important principle is pushed as far as three dimensions can take it, so that you *see* what is happening before anyone shows you a formula. Every calculation runs live in your browser.',
  '从 Bloch 球开始': 'Start with the Bloch sphere',
  '全部 {0} 个模块': 'All {0} modules',
  '怎么用这个平台？': 'How do I use this?',
  '继续上次：': 'Continue: ',
  先看这五个: 'Start with these five',
  '全部模块 →': 'All modules →',
  'Bloch 球': 'Bloch sphere',
  氢原子轨道: 'Hydrogen orbitals',
  势阱与谐振子: 'Wells and the oscillator',
  双缝干涉: 'Double-slit interference',
  隧道效应: 'Tunnelling',
  把自旋态变成可以用手拖的球: 'A spin state you can drag around a sphere',
  '球面上每个点都是一个纯态。加磁场看它进动，选一个轴测量看它塌缩，重复两百次看频率收敛到 Born 规则。':
    'Every point on the sphere is a pure state. Add a field and watch it precess, pick an axis and watch it collapse, repeat two hundred times and watch the frequencies converge on the Born rule.',
  '真正看见 |ψ|² 长什么样': 'Actually see what |ψ|² looks like',
  '六万个点一个个显影出来，每个点是一次位置测量的可能结果。切换 n、l、m，剖开 3d 轨道看里面。':
    'Sixty thousand dots develop one by one, each a possible outcome of a position measurement. Change n, l, m, and slice a 3d orbital open to see inside.',
  '定态为什么被称为「静止」': 'Why a stationary state is called "stationary"',
  'ψ 在复平面里转个不停，而它的影子 |ψ|² 一动不动。能级、节点、渗出阱壁的指数尾巴都在同一张图里。':
    'ψ spins endlessly in the complex plane while its shadow |ψ|² does not move at all. Levels, nodes and the exponential tail leaking through the wall are all in one picture.',
  条纹是一颗颗粒子累积出来的: 'The fringes are built one particle at a time',
  '前几十个点毫无规律，几百个之后条纹自己浮现。在缝口放上探测器，条纹当场消失。':
    'The first few dozen dots look random; after a few hundred the fringes surface by themselves. Put a detector at the slits and they vanish on the spot.',
  波包撞上一堵它翻不过的墙: 'A wave packet hits a wall it cannot climb',
  '浏览器里实时解含时薛定谔方程。经典小球原路弹回，波包却有一部分出现在了另一侧。':
    'The time-dependent Schrödinger equation, solved live in your browser. The classical ball bounces straight back; part of the wave packet turns up on the far side.',
  '3D 是主讲人': '3D does the teaching',
  '能用三维讲清楚的，绝不只用二维图或纯文字。每个场景都支持旋转、缩放、剖切、时间演化与预设视角。':
    'Anything three dimensions can explain never gets reduced to a flat figure or a paragraph. Every scene rotates, zooms, clips, evolves in time and offers preset viewpoints.',
  数字是算出来的: 'The numbers are computed',
  '本征值问题、split-operator 演化、蒙特卡洛采样全在浏览器里跑。读数区会把数值解与解析解并排放着让你对照。':
    'Eigenvalue problems, split-operator evolution and Monte Carlo sampling all run in the browser. The readout puts the numerical and analytic answers side by side so you can check them.',
  '先图像，后数学': 'Picture first, mathematics second',
  '每个场景配一份观察指南（该看什么、调什么），以及一组「常见错误直觉」——那些几乎每个人都会踩一次的坑。':
    'Every scene comes with a guide to what to look at and what to change, plus a set of common wrong intuitions — the traps almost everybody falls into once.',
  '三条路线，看你从哪来': 'Three routes, depending on where you are coming from',
  第一次接触量子力学: 'First encounter with quantum mechanics',
  '按模块编号顺序走：01 → 02 → 03 → 04，四个模块之后你已经能读懂大多数科普里说错的地方。':
    'Take the modules in order: 01 → 02 → 03 → 04. Four modules in, you will already spot most of what popular accounts get wrong.',
  正在上量子力学课: 'Currently taking a course',
  '课上讲到哪，就来对应模块看一眼图像，再回去看推导。场景下方的「深入阅读」直达教材小节。':
    'Whatever the lecture covers, come and look at the matching picture, then go back to the derivation. Each scene links straight to the relevant textbook section.',
  目标是量子信息: 'Heading for quantum information',
  '跳过连续谱与氢原子，主攻二能级系统：Bloch 球 → 测量 → 纠缠 → 退相干。':
    'Skip the continuum and hydrogen and go straight for two-level systems: Bloch sphere → measurement → entanglement → decoherence.',
  还有一整本教材: 'There is a whole textbook as well',
  '3D 模块负责建立图像，完整的推导、习题与数值方法在教材部分： {0} 章、{1} 节，其中 {2} 节已定稿。 每个模块页面底部都有对应章节的直达链接。':
    'The 3D modules build the picture; the derivations, exercises and numerical methods live in the textbook: {0} chapters, {1} sections, {2} of them finalised. Every module page links straight to the matching chapters.',
  你的学习进度只存在本机浏览器里: 'Your progress stays in this browser',
  '其中 {0} 处自评为「{1}」以上': 'including {0} rated "{1}" or better',
  '个 3D 场景': '3D scenes',
  个模块: 'modules',
  节教材: 'textbook sections',
  '纯静态站点，全部计算在你的浏览器里完成。学习进度只存在本机 localStorage，不上传任何数据。 支持离线访问：访问过的页面会被缓存下来。':
    'A fully static site: every calculation happens in your browser. Progress is kept in localStorage and never uploaded. Pages you have visited are cached, so the site keeps working offline.',

  // ── 教材小节页 ──────────────────────────────────────────
  面包屑: 'Breadcrumb',
  '上一节 / 下一节': 'Previous / next section',
  本页目录: 'On this page',
  上一节: 'Previous section',
  下一节: 'Next section',
  学完本节你应该能: 'After this section you should be able to',
  '本节尚未撰写，当前只有大纲。内容结构与交互模拟的规格见下方。':
    'This section has not been written yet; only the outline exists. The planned structure and simulations are listed below.',
  '本节为草稿，推导与措辞可能还会调整。':
    'Draft: the derivations and wording may still change.',
  '第 {0} 章': 'Chapter {0}',
  '{0} 小节': '{0} sections',
  '{0} 已定稿': '{0} finalised',
  '{0} 个交互模拟': '{0} interactive simulations',
  预计用时: 'Estimated time',
  小节: 'Sections',
  已定稿: 'Finalised',
  交互模拟: 'Simulations',
  小时: 'hours',
  建议先读: 'Read first',
  '本章内容尚未撰写。': 'This chapter has not been written yet.',
  开始阅读: 'Start reading',

  // ── 搜索 ────────────────────────────────────────────────
  '搜索章节、概念、公式…（试试「隧道」「Ehrenfest」「归一化」）':
    'Search sections, concepts, formulas… (try "tunnelling", "Ehrenfest", "normalisation")',
  '正在加载索引…': 'Loading the index…',
  '输入关键词开始搜索。支持中文与英文，公式里的命令名（如 psi、hbar）也能搜到。':
    'Type to search. Chinese and English both work, and so do LaTeX command names such as psi or hbar.',
  '没有匹配的内容。换个说法试试？': 'Nothing matched. Try different words?',
  选择: 'select',
  打开: 'open',
  关闭: 'close',
  '{0} 个条目已索引': '{0} entries indexed',

  // ── MDX 组件的固定标签 ──────────────────────────────────
  注意: 'Note',
  物理图像: 'The picture',
  数学形式: 'The mathematics',
  常见误解: 'Common misconception',
  容易踩坑: 'Easy to get wrong',
  历史: 'History',
  自检: 'Check yourself',
  本节关键公式: 'Key formulas',
  展开: 'expand',
  基础: 'basic',
  进阶: 'advanced',
  选读: 'optional',

  // ── 页脚 ────────────────────────────────────────────────
  博客: 'Blog',
  源码: 'Source',
  开源地址: 'Source code',
  '本站开源，欢迎提 issue 与 PR。': 'The site is open source — issues and pull requests welcome.',
  '关于作者': 'About the author',

  '这一节你掌握到什么程度？': 'How well do you know this?',
  '记录只保存在这台设备上，用于目录树标记与学习进度页':
    'Kept on this device only, used for the contents markers and your progress page',
  掌握程度: 'Level of mastery',
  '✓ 已读': '✓ Read',
  标记已读: 'Mark as read',

  // ── 进度自评 ────────────────────────────────────────────
  未学: 'Not started',
  了解: 'Familiar',
  掌握: 'Solid',
  精通: 'Fluent',
}
