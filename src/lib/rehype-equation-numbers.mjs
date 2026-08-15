import { visit } from 'unist-util-visit'

/**
 * 给块级公式自动编号：第 2.7 节的第三个公式编成 (2.7.3)。
 *
 * 做在构建期而不是客户端脚本，有三个好处：
 *  - 没有「先无号、JS 跑完才出号」的闪烁
 *  - 关掉 JS、打印、被搜索引擎抓取时编号都在
 *  - 编号稳定，正文里可以放心写「由 (2.7.3) 可得」
 *
 * 为什么是 rehype 而不是 remark：在 MDX 管线里改 mdast 的 math 节点，
 * 改动不会传到后面的 rehype-katex（它拿到的仍是原始源码）。
 * 落在 hast 上、紧挨着 rehype-katex 之前跑，才是真正生效的位置。
 *
 * 跳过三类公式：
 *  - 已经手写了 \tag 的（作者想自己指定编号）
 *  - 写了 \notag 的（作者明确不要编号）
 *  - align / gather 等多行环境（\tag 要逐行放，交给作者自己处理）
 */
export default function rehypeEquationNumbers() {
  return (tree, file) => {
    const section = file?.data?.astro?.frontmatter?.section
    if (!section) return

    let counter = 0
    visit(tree, 'element', (node) => {
      const cls = node.properties?.className
      const classes = Array.isArray(cls) ? cls : typeof cls === 'string' ? cls.split(/\s+/) : []
      if (!classes.includes('math-display')) return

      const text = node.children?.find((c) => c.type === 'text')
      if (!text || typeof text.value !== 'string') return
      if (/\\tag|\\notag|\\begin\{(align|gather|multline|cases|split)/.test(text.value)) return

      counter += 1
      text.value = `${text.value}\\tag{${section}.${counter}}`
    })
  }
}
