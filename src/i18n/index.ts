import { DICT } from './dict'

/**
 * 双语支持。
 *
 * 设计选择：**用中文原文当 msgid**（gettext 的老办法），而不是 `scene.bloch.title`
 * 这类抽象键名。原因有二：
 *   1. 源码里读到的就是最终文案，改一句话不必在两个文件之间来回跳；
 *   2. 漏翻会原样退回中文，页面不会出现 `scene.bloch.title` 这种裸键——
 *      对一个教学站来说，退回原文远比露出键名可接受。
 * 代价是中文原文一改，字典的键要跟着改；`npm run i18n:check` 会把漏翻的列出来。
 *
 * 路由：中文在根路径（默认语言，不加前缀），英文在 /en/ 下。
 */

export const LANGS = ['zh', 'en'] as const
export type Lang = (typeof LANGS)[number]

export const DEFAULT_LANG: Lang = 'zh'

export const LANG_LABEL: Record<Lang, string> = { zh: '中文', en: 'English' }
/** <html lang> 的取值 */
export const HTML_LANG: Record<Lang, string> = { zh: 'zh-CN', en: 'en' }

/** 从 URL 路径判断语言。base 前缀已被 Astro 剥掉，这里只看 /en 开头。 */
export function getLangFromPath(pathname: string): Lang {
  const clean = pathname.replace(/^\/+/, '')
  return clean === 'en' || clean.startsWith('en/') ? 'en' : 'zh'
}

/**
 * 给一个「不带语言前缀」的站内路径加上当前语言前缀。
 * @param path 形如 `lab/05-spin/`，不要以 / 开头
 */
export function localePath(lang: Lang, path: string, base = '/'): string {
  const b = base.endsWith('/') ? base : `${base}/`
  const p = path.replace(/^\/+/, '')
  return `${b}${lang === 'zh' ? '' : 'en/'}${p}`.replace(/\/{2,}/g, '/')
}

/**
 * 翻译。找不到译文就原样返回中文——这是刻意的降级策略，见文件头的说明。
 * 支持 {0} {1} 占位符。
 */
export function tr(lang: Lang, zh: string, ...args: (string | number)[]): string {
  const raw = lang === 'zh' ? zh : (DICT[zh] ?? zh)
  if (!args.length) return raw
  return raw.replace(/\{(\d+)\}/g, (m, i) => String(args[Number(i)] ?? m))
}

/** 绑定语言之后的翻译函数，组件里用起来更短 */
export function translator(lang: Lang) {
  return (zh: string, ...args: (string | number)[]) => tr(lang, zh, ...args)
}

/** 站点级链接：博客与源码 */
export const SITE_LINKS = {
  blog: 'https://tanzhuo.xyz',
  repo: 'https://github.com/tan-zhuo/quantum-ladder',
}
