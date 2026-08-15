import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_LANG, translator, type Lang } from './index'

/**
 * React 侧的语言获取，分两种场合：
 *
 * 1. **会被服务端渲染的部分**（场景外壳、控制面板）——走 Context。
 *    Context 按渲染树位置生效，所以 SceneShell 里的 Provider 能覆盖
 *    由场景组件创建、再作为 props 传进来的控件；语言在首帧就是对的。
 *
 * 2. **只在客户端渲染的部分**（3D 画布内部）——走 useLang()，直接读
 *    <html lang>。R3F 的 <Canvas> 自建一个 reconciler 根，父树的 Context
 *    不会穿过去；而画布本来就不参与 SSR，读 DOM 不会有水合不一致。
 */

export const LangContext = createContext<Lang>(DEFAULT_LANG)

export function useUiLang(): Lang {
  return useContext(LangContext)
}

/** 控件里最常用的一行 */
export function useUiT() {
  return translator(useContext(LangContext))
}

/** 画布内组件：从 <html lang> 读语言 */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG)
  useEffect(() => {
    const v = document.documentElement.lang
    setLang(v && v.startsWith('en') ? 'en' : 'zh')
  }, [])
  return lang
}

/** 画布内组件的翻译函数 */
export function useT() {
  return translator(useLang())
}
