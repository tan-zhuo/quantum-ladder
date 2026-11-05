/** 站点框架（导航、页眉页脚、目录、首页、模块页）的英文译文。 */
export const DICT_UI: Record<string, string> = {
  // ── 站点与页眉 ──────────────────────────────────────────
  量子力学阶梯: 'Quantum Ladder',
  跳到正文: 'Skip to content',
  '从入门到前沿的量子力学教程，以交互式 3D 演示配合系统的推导。':
    'A quantum mechanics course from the basics to current research, combining interactive 3D demonstrations with systematic derivations.',
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
  '交互式量子力学 · 中英双语 · 可离线使用':
    'Interactive quantum mechanics · bilingual · works offline',
  '一套以交互演示为主线的量子力学入门与进阶材料。站内有 {0} 个 3D 场景，涵盖双缝干涉、势阱、隧穿、自旋、氢原子轨道和纠缠等内容，每个场景都可以调节参数、观察演化，并与配套教材中的推导相互对照。全部数值计算在浏览器中完成。':
    'An introductory-to-intermediate course in quantum mechanics built around interactive demonstrations. The site has {0} 3D scenes covering double-slit interference, potential wells, tunnelling, spin, hydrogen orbitals and entanglement. In each one you can adjust parameters, follow the time evolution, and compare what you see with the derivations in the accompanying textbook. All numerical work runs in the browser.',
  '从 Bloch 球开始': 'Start with the Bloch sphere',
  '全部 {0} 个模块': 'All {0} modules',
  '使用说明':
    'How to use this site',
  '继续上次：': 'Continue: ',
  '推荐场景':
    'Recommended scenes',
  '全部模块 →': 'All modules →',
  'Bloch 球': 'Bloch sphere',
  氢原子轨道: 'Hydrogen orbitals',
  势阱与谐振子: 'Wells and the oscillator',
  双缝干涉: 'Double-slit interference',
  隧道效应: 'Tunnelling',
  '在 Bloch 球上操作自旋态':
    'Manipulating spin states on the Bloch sphere',
  '球面上每一点对应一个纯态。可以施加磁场观察进动，沿任意轴测量观察投影，重复测量后比较统计频率与 Born 规则的预测。':
    'Each point on the sphere is a pure state. Apply a field to watch it precess, measure along any axis to see the projection, and compare the statistics of repeated measurements with the Born rule.',
  '氢原子的概率密度 |ψ|²':
    'The hydrogen probability density |ψ|²',
  '以六万次位置采样逐点显示概率分布。可以切换量子数 n、l、m，并对轨道做剖切以观察内部结构。':
    'The distribution is built up from sixty thousand sampled positions. Switch the quantum numbers n, l, m and clip the orbital to see its interior.',
  '定态的时间演化':
    'Time evolution of stationary states',
  '定态波函数的相位随时间旋转，|ψ|² 保持不变。图中同时给出能级、节点位置和阱壁外的指数衰减部分。':
    'The phase of a stationary state rotates in time while |ψ|² stays fixed. The same figure shows the energy levels, the nodes and the exponentially decaying tail outside the well.',
  '单粒子累积的干涉条纹':
    'Interference built up one particle at a time',
  '粒子逐个到达屏幕，起初分布看不出规律，数百个之后干涉条纹逐渐显现。在缝处加入路径探测器后，条纹消失。':
    'Particles arrive one at a time. At first the pattern looks random; after a few hundred the fringes appear. Adding a which-path detector at the slits removes them.',
  '波包穿过势垒':
    'A wave packet meeting a barrier',
  '实时数值求解含时薛定谔方程。能量低于势垒时，经典粒子被完全反射，波包则有一部分透射到势垒另一侧。':
    'The time-dependent Schrödinger equation is solved numerically in real time. Below the barrier height a classical particle is fully reflected, while part of the wave packet is transmitted.',
  '三维可视化':
    '3D visualisation',
  '适合用空间图像说明的内容尽量用三维呈现。场景支持旋转、缩放、剖切、时间演化和预设视角。':
    'Material that benefits from a spatial picture is presented in three dimensions. Scenes support rotation, zoom, clipping, time evolution and preset viewpoints.',
  '实时数值计算':
    'Live numerical computation',
  '本征值求解、split-operator 时间演化和蒙特卡洛采样均在浏览器中运行。读数区并列给出数值解与解析解，便于对照。':
    'Eigenvalue solvers, split-operator time evolution and Monte Carlo sampling run in the browser. The readout lists numerical and analytic results side by side for comparison.',
  '图像与推导对照':
    'Pictures alongside derivations',
  '每个场景附有观察指南，说明应关注的现象和可调参数，并列出初学者常见的错误理解。':
    'Each scene has an observation guide describing what to look for and which parameters to change, together with a list of common misconceptions.',
  '学习路线':
    'Learning paths',
  '初学者':
    'New to quantum mechanics',
  '按模块编号依次学习 01 → 04，建立波函数、定态和隧穿的基本图像。':
    'Work through modules 01 → 04 in order to build the basic picture of wavefunctions, stationary states and tunnelling.',
  '正在修读量子力学课程':
    'Taking a quantum mechanics course',
  '配合课程进度查看对应模块的图像，再回到推导。每个场景下方的「深入阅读」链接到相应教材小节。':
    'Follow your course and use the matching module for the picture, then return to the derivation. The "Further reading" links under each scene point to the relevant textbook sections.',
  '侧重量子信息':
    'Focusing on quantum information',
  '略过连续谱和氢原子，集中学习二能级系统：Bloch 球、测量、纠缠、退相干。':
    'Skip the continuum and hydrogen and concentrate on two-level systems: the Bloch sphere, measurement, entanglement and decoherence.',
  '配套教材':
    'The textbook',
  '完整的推导、习题和数值方法见教材部分，共 {0} 章 {1} 节，其中 {2} 节已定稿。每个模块页面底部都附有对应章节的链接。':
    'Full derivations, exercises and numerical methods are in the textbook: {0} chapters and {1} sections, {2} of them finalised. Each module page links to the corresponding chapters at the bottom.',
  你的学习进度只存在本机浏览器里: 'Your progress stays in this browser',
  '其中 {0} 处自评为「{1}」以上': 'including {0} rated "{1}" or better',
  '个 3D 场景': '3D scenes',
  个模块: 'modules',
  节教材: 'textbook sections',
  '本站为纯静态站点，所有计算在本地浏览器中完成。学习进度保存在本机 localStorage 中，不会上传。访问过的页面会被缓存，可离线浏览。':
    'This is a static site and all computation happens in your browser. Progress is stored in localStorage and is not uploaded. Visited pages are cached for offline use.',

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
