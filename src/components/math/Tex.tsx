import katex from 'katex'
import { useMemo } from 'react'

/**
 * React 岛里渲染 KaTeX。宏定义必须与 astro.config.mjs 的 rehype-katex 配置一致，
 * 否则同一个 \ket 在正文里和在场景读数里会长得不一样。
 */
const MACROS = {
  '\\ket': '\\left|#1\\right\\rangle',
  '\\bra': '\\left\\langle#1\\right|',
  '\\braket': '\\left\\langle#1\\middle|#2\\right\\rangle',
  '\\dd': '\\mathrm{d}',
  '\\ii': '\\mathrm{i}',
  '\\ee': '\\mathrm{e}',
}

export default function Tex({
  children,
  display = false,
  className,
}: {
  children: string
  display?: boolean
  className?: string
}) {
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        macros: MACROS,
      }),
    [children, display],
  )
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
