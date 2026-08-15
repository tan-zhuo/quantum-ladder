import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

/**
 * 一个 mdx 文件 = 一小节。id 形如 `02-wavefunction/07-infinite-well`，
 * 直接对应路由 /ch/02-wavefunction/07-infinite-well。
 */
const sections = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content' }),
  schema: z.object({
    /** 小节标题，不含节号 */
    title: z.string(),
    /** 节号，如 "2.7"；章导言页留空 */
    section: z.string().optional(),
    /** 章内排序，章导言用 0 */
    order: z.number(),
    /** 目录树与搜索结果里的一句话摘要 */
    summary: z.string().default(''),
    /** 前置知识：可写小节 id，也可写自由文本 */
    prereqs: z.array(z.string()).default([]),
    /** 学完本节你应该能做什么 —— 验收标准第 4 条 */
    objectives: z.array(z.string()).default([]),
    /**
     * done  = 正文与推导完整，已通过验收标准
     * draft = 有内容但未定稿
     * stub  = 仅占位，等待撰写
     */
    status: z.enum(['done', 'draft', 'stub']).default('stub'),
    /** 本节嵌入的交互模拟名，用于目录树打标与「模拟索引」页 */
    sims: z.array(z.string()).default([]),
  }),
})

/**
 * 3D 场景模块：平台的主轴。
 *
 * 与 sections 的关系：sections 是按教材章节展开的文字体系（深入阅读），
 * lab 是按「必须用三维讲透的核心原理」重新组织的入口，一个模块 = 一个 mdx 文件。
 * 两者用 related 字段互相指路。放在 src/lab/ 而不是 src/content/lab/ 是为了
 * 让上面 sections 那条递归 glob 不必再写排除规则。
 */
const lab = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/lab' }),
  schema: z.object({
    /** 模块号，如 "05" */
    num: z.string(),
    title: z.string(),
    /** 一句话物理目标 */
    goal: z.string(),
    /** 「你将看见什么」——进入模块前先给出画面预期 */
    youWillSee: z.array(z.string()).default([]),
    /** 前置知识（自由文本） */
    prereqs: z.array(z.string()).default([]),
    /** 本模块包含的 3D 场景名，须在 src/components/canvas/Scene.astro 中登记 */
    scenes: z.array(z.string()).default([]),
    /** 对应的教材小节 id，供「深入阅读」 */
    related: z.array(z.string()).default([]),
    /** 实现优先级，对应规格里的 Phase 1/2/3 */
    phase: z.number().default(3),
    status: z.enum(['done', 'draft', 'stub']).default('stub'),
  }),
})

export const collections = { sections, lab }
