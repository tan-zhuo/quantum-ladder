import { Fragment, type ReactNode } from 'react'

/**
 * 把译文里的 `反引号片段` 渲染成 <code>。
 *
 * 模拟的引导语里夹着 L、|ψ|²、e^{−iEₙt/ħ} 这类符号，原来是直接写 JSX 的 <code>，
 * 但那样一句话会被切成好几段字符串，没法当成一条 msgid 翻译。
 * 改成「整句话是一条 msgid，代码片段用反引号标出」，中英两版的语序才能各自自然。
 */
export function rich(s: string): ReactNode {
  const parts = s.split('`')
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <code key={i}>{p}</code>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}
