# Quantum Ladder · 量子力学阶梯

以 **3D 交互为主要教学语言**的量子力学学习平台。纯前端、可静态部署、支持离线、中英双语。

*A quantum-mechanics learning platform where interactive 3D scenes do the teaching. Static, offline-capable, bilingual (中文 / English).*

- 博客 Blog：<https://tanzhuo.xyz>
- 源码 Source：<https://github.com/tan-zhuo/quantum-ladder>

> 这不是电子书。12 个 3D 场景是这里的主讲人——每一个重要原理都尽可能用三维把物理图像讲透，
> 让人先「看见」量子世界在发生什么，再谈公式。所有计算都在浏览器里实时进行。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 产出 dist/，可直接扔到任何静态托管
npm run preview  # 本地预览构建结果
```

部署在子路径（如 GitHub Pages 的 `/quantum-ladder/`）时，把 `astro.config.mjs` 里的 `base` 打开。

## 双语

中文在根路径，英文在 `/en/` 下，页眉右侧的 `EN` / `中` 按钮在两者之间对折当前页面。

| 部分 | 中文 | English |
| --- | --- | --- |
| 12 个 3D 场景（标题、控件、观察指南、误解卡、思考题、读数） | ✅ | ✅ |
| 16 个模块正文 | ✅ | ✅ |
| 站点框架（导航、首页、目录、搜索、页脚） | ✅ | ✅ |
| 教材 106 节的**正文** | ✅ | ❌ 仍是中文（标题与目录已英译，入口处有标注） |

翻译机制是 gettext 式的：**中文原文即 msgid**，译文放在 `src/i18n/dict.*.ts`。
漏翻会原样退回中文而不是露出裸键名；`npm run i18n:check` 会把漏掉的列出来。

```bash
npm run i18n:check   # 648 msgids, all translated
```

## 两条内容轴

| 轴 | 路由 | 组织方式 | 源码位置 |
| --- | --- | --- | --- |
| **3D 实验室**（主轴） | `/lab/<module>/` | 按「必须用三维讲透的核心原理」组织，16 个模块 | `src/lab/*.mdx` |
| 教材（深入阅读） | `/ch/<chapter>/<section>/` | 按传统章节组织，18 章 106 节 | `src/content/**/*.mdx` |

两者通过模块 frontmatter 里的 `related` 字段互相指路：3D 建立图像，教材负责把它算清楚。

## 12 个 3D 场景

| 场景 | 模块 | 三维在这里解决了什么 |
| --- | --- | --- |
| `bloch-sphere` | 05 自旋 | 纯态 = 球面上一个点；进动 = 绕磁场转圈；测量 = 投影到轴上 |
| `wavefunction` | 02 波函数 | ψ 是复平面里的一条曲线，实部/虚部只是它的两个影子 |
| `potential-well` | 03 束缚态 | 管子在转而影子不动——「定态」的准确图像 |
| `double-slit` | 01 双缝 | 条纹是一颗颗粒子累积出来的，路径探测器一开就没 |
| `tunneling` | 04 隧道效应 | 实时解含时薛定谔方程；经典小球与波包并排跑 |
| `hydrogen-orbital` | 06 氢原子 | 概率云逐点显影；剖切看内部；径向节点是真实的球面 |
| `stern-gerlach` | 05 / 07 | 串联三台分析器，看被筛掉的成分重新出现 |
| `superposition` | 09 时间演化 | 第三维用作时间：\|ψ(x,t)\|² 堆成时空曲面 |
| `entanglement` | 08 纠缠 | 真实抽样累积 CHSH 值；量子 vs 局域隐变量两套抽样规则 |
| `decoherence` | 12 退相干 | 单位球被信道压成椭球；纯态掉进球里 |
| `identical-particles` | 10 全同粒子 | 位形空间曲面；交换 = 沿对角线翻 180° |
| `path-integral` | 13 路径积分 | 上百条真实路径 + 相量链；ħ 滑块直通经典极限 |

## 技术栈

- **Astro 7**（静态输出）+ React 19 岛屿
- **React Three Fiber 9 / drei 10 / three.js 0.185** —— 3D 场景
- Tailwind CSS 4 · KaTeX · Zustand
- 无后端、无账号、无追踪。学习进度只写 `localStorage`

## 源码结构

```
src/
├── components/canvas/          # 全部 3D 场景
│   ├── core/                   # 场景引擎：画布、外壳、图元、控件、配色、性能档位
│   │   ├── SceneCanvas.tsx     #   相机 / 预设视角 / 轨道控制 / 剖切 / 帧率自动降级 / 截图
│   │   ├── SceneShell.tsx      #   标题 / 控制面板 / 读数 / 观察指南 / 误解卡 / 反思题 / 全屏
│   │   ├── primitives.tsx      #   管、幕布、折线、点云、箭头（几何体只建一次，逐帧改缓冲区）
│   │   ├── widgets.tsx         #   时间控制条、图例、能级尺、迷你折线图、概率条
│   │   ├── theme.ts            #   与正文共用的语义配色 + 色盲友好 + 高对比度
│   │   └── sceneStore.ts       #   全局显示偏好与性能档位（zustand）
│   ├── Scene.astro             # MDX 里嵌入场景的唯一入口：<Scene name="…" />
│   └── <每个场景一个目录>/
├── lab/                        # 3D 模块内容（MDX）
├── content/                    # 教材章节内容（MDX）
├── lib/
│   ├── quantum3d.ts            # 三维场景的物理与数值：三对角本征问题、氢原子采样、球谐、惠更斯求和
│   ├── numerics.ts             # 一维演化与解析解：FFT、split-operator、谐振子/方阱本征态
│   ├── lab.ts / toc.ts         # 两条内容轴的目录与导航
│   └── progress.ts             # 本地学习进度（localStorage，框架无关）
└── pages/
```

## 数值方法与精度

场景里的每个数字都是当场算的，并且都做过对照：

| 场景 | 方法 | 校验 |
| --- | --- | --- |
| 一维势阱 | 三点差分 + QL 求本征值 + 反迭代求本征矢 | 无限深阱 / 谐振子能级与解析解吻合到 4 位有效数字，本征矢正交性 ~1e-11 |
| 隧道效应 | split-operator（对称分裂，严格幺正） | 数值 T 与平面波解析式在 σ 较大时相差 < 3%；跑上万步范数不掉 |
| 氢原子 | 径向逆 CDF + 角向拒绝采样 | ⟨r⟩ 与解析值吻合；四万点采样约 80 ms（分帧填充，不阻塞主线程） |
| 双缝 | 惠更斯子波直接求和（非远场近似） | 条纹间距与 λL/d 吻合到 0.2%；近场的条纹弯曲会如实出现 |
| 全同粒子 | 位形空间网格 | ⟨(x₁−x₂)²⟩ 三种对称性的数值与交换积分解析值一致 |
| Bell | 逐对真实抽样 | 量子模式收敛到 2√2，局域隐变量模式恰好卡在 2 |

## 性能

- 每个场景 `client:visible` 懒加载，滚到哪个才建 WebGL 上下文
- 帧率连续两秒低于 35 fps 自动降一档（点数、细分、DPR），也可在「显示设置」里手动锁定
- 几何体只建一次，逐帧原地更新缓冲区；点云用分帧填充避免长任务

## 无障碍

- 色盲友好配色（把红/绿对比换成蓝/橙）与高对比度模式，全站生效并记忆
- 场景内标注可整体关闭
- 所有 3D 场景都有等价的文字读数与观察指南，不依赖颜色单独传达信息
- 深色 / 浅色主题跟随系统，可手动切换（快捷键 <kbd>t</kbd>）

## 许可

内容与代码用于教学目的。
