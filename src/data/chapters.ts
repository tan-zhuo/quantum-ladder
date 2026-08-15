/**
 * 全站章节元数据 —— 目录树、路由、依赖图谱、搜索索引的单一事实来源。
 *
 * 小节不在这里声明：小节由 src/content/<chapter.id>/*.mdx 的 frontmatter 提供，
 * 由 src/lib/toc.ts 在构建期归并成完整目录树。新增一节 = 新增一个 mdx 文件。
 */

export type Track = 'main' | 'branch' | 'appendix'

export interface Chapter {
  /** 目录名，同时是路由段：/ch/<id> */
  id: string
  /** 章号，附录用字母 */
  num: string
  title: string
  /** 一句话说明这一章在解决什么问题 */
  blurb: string
  track: Track
  /** 建议先修的章 id */
  prereqs: string[]
  /** 预计阅读时长（分钟），用于目录树与学习路线 */
  minutes: number
}

export const CHAPTERS: Chapter[] = [
  {
    id: '00-guide',
    num: '00',
    title: '使用指南与学习路线',
    blurb: '三条学习路径、符号约定，以及怎么用交互模拟才不浪费时间。',
    track: 'main',
    prereqs: [],
    minutes: 20,
  },
  {
    id: '01-history',
    num: '01',
    title: '历史与物理图像',
    blurb: '从黑体辐射到延迟选择实验：先建立直觉，再谈形式体系。',
    track: 'main',
    prereqs: [],
    minutes: 90,
  },
  {
    id: '02-wavefunction',
    num: '02',
    title: '波函数与薛定谔方程',
    blurb: '量子力学的第一套可计算工具：波函数、本征值问题与一维精确解。',
    track: 'main',
    prereqs: ['01-history'],
    minutes: 240,
  },
  {
    id: '03-formalism',
    num: '03',
    title: '形式体系：Dirac 符号与公设',
    blurb: '把波函数抽象成 Hilbert 空间中的矢量，量子力学才真正成型。',
    track: 'main',
    prereqs: ['02-wavefunction'],
    minutes: 200,
  },
  {
    id: '04-1d-problems',
    num: '04',
    title: '一维问题精讲与数值方法',
    blurb: '宇称、散射相移、传递矩阵，以及自己写一个薛定谔方程求解器。',
    track: 'main',
    prereqs: ['02-wavefunction', '03-formalism'],
    minutes: 150,
  },
  {
    id: '05-angular-momentum',
    num: '05',
    title: '角动量与自旋',
    blurb: '纯代数就能定出全部本征值——量子力学最漂亮的一段推导。',
    track: 'main',
    prereqs: ['03-formalism'],
    minutes: 220,
  },
  {
    id: '06-hydrogen',
    num: '06',
    title: '氢原子与中心力场',
    blurb: '第一个真实的三维体系，也是整个化学的起点。',
    track: 'main',
    prereqs: ['05-angular-momentum'],
    minutes: 200,
  },
  {
    id: '07-approximation',
    num: '07',
    title: '近似方法',
    blurb: '真实体系几乎都解不出来。微扰、变分、WKB、黄金规则、Berry 相位。',
    track: 'main',
    prereqs: ['06-hydrogen'],
    minutes: 240,
  },
  {
    id: '08-identical-particles',
    num: '08',
    title: '全同粒子与多体初步',
    blurb: '交换对称性如何撑起元素周期表、金属与白矮星。',
    track: 'main',
    prereqs: ['05-angular-momentum', '07-approximation'],
    minutes: 180,
  },
  {
    id: '09-quantum-information',
    num: '09',
    title: '量子信息与量子计算基础',
    blurb: '把量子力学当资源用：纠缠、Bell 不等式、算法与纠错。',
    track: 'main',
    prereqs: ['03-formalism', '05-angular-momentum'],
    minutes: 260,
  },
  {
    id: '10-open-systems',
    num: '10',
    title: '开放系统与退相干',
    blurb: '为什么现实世界看起来是经典的：密度矩阵、CPTP 映射、Lindblad。',
    track: 'main',
    prereqs: ['09-quantum-information'],
    minutes: 160,
  },
  {
    id: '11-path-integral',
    num: '11',
    title: '路径积分与进阶表述',
    blurb: '第三种等价表述：对所有历史求和，经典极限自动浮现。',
    track: 'branch',
    prereqs: ['03-formalism'],
    minutes: 140,
  },
  {
    id: '12-relativistic',
    num: '12',
    title: '相对论性量子力学入门',
    blurb: 'Klein-Gordon 与 Dirac 方程，以及自旋为什么是相对论的必然结果。',
    track: 'branch',
    prereqs: ['05-angular-momentum', '06-hydrogen'],
    minutes: 140,
  },
  {
    id: '13-frontier',
    num: '13',
    title: '前沿专题',
    blurb: '拓扑物态、超冷原子、超导量子比特、量子基础——可独立进入的扩展模块。',
    track: 'branch',
    prereqs: ['09-quantum-information'],
    minutes: 300,
  },
  {
    id: 'appendix-a-math',
    num: 'A',
    title: '数学工具速查',
    blurb: '线性代数、傅里叶分析、特殊函数——用到时再回来查。',
    track: 'appendix',
    prereqs: [],
    minutes: 60,
  },
  {
    id: 'appendix-b-formulas',
    num: 'B',
    title: '常用公式与常数表',
    blurb: '全站公式速查面板的数据来源。',
    track: 'appendix',
    prereqs: [],
    minutes: 20,
  },
  {
    id: 'appendix-c-numerics',
    num: 'C',
    title: '数值方法实现笔记',
    blurb: '本站每一个模拟背后的算法：有限差分、精确对角化、split-operator。',
    track: 'appendix',
    prereqs: ['04-1d-problems'],
    minutes: 90,
  },
  {
    id: 'appendix-d-resources',
    num: 'D',
    title: '推荐文献与进一步学习',
    blurb: '教材、讲义、论文、开源项目与视频课。',
    track: 'appendix',
    prereqs: [],
    minutes: 15,
  },
]

export const CHAPTER_BY_ID = new Map(CHAPTERS.map((c) => [c.id, c]))

export const TRACK_LABEL: Record<Track, string> = {
  main: '主路径',
  branch: '扩展模块',
  appendix: '附录',
}
