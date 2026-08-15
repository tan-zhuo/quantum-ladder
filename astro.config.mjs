// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeEquationNumbers from './src/lib/rehype-equation-numbers.mjs'

// 纯静态站点：`astro build` 产出可直接扔到 GitHub Pages / Cloudflare Pages / Vercel 的 dist/。
// 若部署在子路径（如 GitHub Pages 的 /quantum-ladder/），把 base 改成该路径即可。
export default defineConfig({
  site: 'https://example.com',
  // base: '/quantum-ladder',
  output: 'static',
  integrations: [react(), mdx()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      // 顺序要紧：编号插件必须排在 rehype-katex 之前，给公式源码补上 \tag
      rehypeEquationNumbers,
      [
        rehypeKatex,
        {
          // throwOnError:false —— 单个公式写错不应该炸掉整站构建
          throwOnError: false,
          strict: false,
          // 这几个宏与 src/components/math/Katex.astro 里的保持一致，
          // 正文里的 \ket 和组件里手写的 \ket 必须是同一个东西
          macros: {
            '\\ket': '\\left|#1\\right\\rangle',
            '\\bra': '\\left\\langle#1\\right|',
            '\\braket': '\\left\\langle#1\\middle|#2\\right\\rangle',
            '\\dd': '\\mathrm{d}',
            '\\ii': '\\mathrm{i}',
            '\\ee': '\\mathrm{e}',
          },
        },
      ],
    ],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
