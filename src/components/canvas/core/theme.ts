import { useEffect, useMemo, useState } from 'react'
import { useSceneStore } from './sceneStore'

/**
 * 3D 场景的配色。
 *
 * 原则：所有场景共用同一套语义色（实部永远是蓝、虚部永远是橙、概率密度永远是紫），
 * 学习者跨场景时不必重新学一遍图例。基础色直接从 global.css 的 CSS 变量里读，
 * 保证 3D 画面与正文、公式、2D 图表是同一套色系；场景特有的颜色在这里定义。
 *
 * 深浅色主题切换后颜色必须立刻跟着变，所以监听 <html data-theme> 的变化。
 */

export interface ScenePalette {
  bg: string
  grid: string
  axis: string
  ink: string
  muted: string
  faint: string
  accent: string

  /** ψ 实部 */
  real: string
  /** ψ 虚部 */
  imag: string
  /** |ψ|² 概率密度 */
  prob: string
  /** 势能曲线 / 势垒 */
  potential: string
  /** 能级 */
  energy: string
  /** 经典类比对象（经典粒子、经典波、局域隐变量预言） */
  classical: string
  /** 相位为正的波瓣 */
  phasePos: string
  /** 相位为负的波瓣 */
  phaseNeg: string
  /** 探测器上的粒子落点 */
  hit: string
  warn: string
  danger: string
}

const CSS_VARS = {
  bg: '--bg',
  ink: '--text',
  muted: '--text-muted',
  faint: '--text-faint',
  accent: '--accent',
  grid: '--c-grid',
  real: '--c-wave',
  imag: '--c-wave-im',
  prob: '--c-prob',
  potential: '--c-potential',
  energy: '--c-energy',
  warn: '--c-warn',
  danger: '--c-danger',
} as const

/**
 * 色盲友好替代色（deuteranopia / protanopia 下仍可区分）。
 *
 * 关键改动是把「经典 vs 量子」的对比从红/绿换成橙/蓝，把相位正负从红/蓝
 * 换成蓝/黄——后者即使在最常见的红绿色盲下也保持明显的明度差。
 */
const CB_OVERRIDE: Partial<Record<keyof ScenePalette, { light: string; dark: string }>> = {
  real: { light: '#0072b2', dark: '#56b4e9' },
  imag: { light: '#d55e00', dark: '#e69f00' },
  prob: { light: '#7048e8', dark: '#b39aff' },
  energy: { light: '#009e73', dark: '#4ecdc4' },
  classical: { light: '#d55e00', dark: '#e69f00' },
  phasePos: { light: '#0072b2', dark: '#56b4e9' },
  phaseNeg: { light: '#e69f00', dark: '#f0c05a' },
  hit: { light: '#332288', dark: '#88ccee' },
}

const FALLBACK_LIGHT: ScenePalette = {
  bg: '#fbfaf8',
  grid: '#e4e0d9',
  axis: '#8a847a',
  ink: '#1c1a17',
  muted: '#5f5a52',
  faint: '#8a847a',
  accent: '#3b5bdb',
  real: '#3b5bdb',
  imag: '#c2410c',
  prob: '#7048e8',
  potential: '#4b5563',
  energy: '#0d9488',
  classical: '#b45309',
  phasePos: '#3b5bdb',
  phaseNeg: '#c2410c',
  hit: '#1c1a17',
  warn: '#b45309',
  danger: '#b91c1c',
}

const FALLBACK_DARK: ScenePalette = {
  bg: '#14161a',
  grid: '#2a2f38',
  axis: '#7d7871',
  ink: '#e8e6e3',
  muted: '#a7a29a',
  faint: '#7d7871',
  accent: '#8ea3ff',
  real: '#7f9cff',
  imag: '#ff9d6b',
  prob: '#b39aff',
  potential: '#9aa3b2',
  energy: '#4ecdc4',
  classical: '#f0b357',
  phasePos: '#7f9cff',
  phaseNeg: '#ff9d6b',
  hit: '#e8e6e3',
  warn: '#f0b357',
  danger: '#ff8080',
}

export type ThemeMode = 'light' | 'dark'

export function readThemeMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function buildPalette(mode: ThemeMode, colorblind: boolean, highContrast: boolean): ScenePalette {
  const base: ScenePalette = { ...(mode === 'dark' ? FALLBACK_DARK : FALLBACK_LIGHT) }

  if (typeof document !== 'undefined') {
    const cs = getComputedStyle(document.documentElement)
    for (const [key, varName] of Object.entries(CSS_VARS)) {
      const v = cs.getPropertyValue(varName).trim()
      if (v) (base as Record<string, string>)[key] = v
    }
    base.axis = base.faint
    base.classical = base.warn
    base.phasePos = base.real
    base.phaseNeg = base.imag
    base.hit = base.ink
  }

  if (colorblind) {
    for (const [key, val] of Object.entries(CB_OVERRIDE)) {
      ;(base as Record<string, string>)[key] = val[mode]
    }
  }

  if (highContrast) {
    // 高对比度：背景推到纯黑/纯白，网格与坐标轴加重，其余语义色保持不变
    // ——把彩色也一起改掉会毁掉「颜色即物理量」这条约定。
    base.bg = mode === 'dark' ? '#000000' : '#ffffff'
    base.ink = mode === 'dark' ? '#ffffff' : '#000000'
    base.grid = mode === 'dark' ? '#4a5160' : '#b9b3a8'
    base.axis = mode === 'dark' ? '#cfd4dd' : '#3a3630'
    base.muted = mode === 'dark' ? '#d6d2cc' : '#2a2724'
  }

  return base
}

/** 场景配色，随主题、色盲模式、高对比度实时更新 */
export function useScenePalette(): ScenePalette {
  const palette = useSceneStore((s) => s.palette)
  const highContrast = useSceneStore((s) => s.highContrast)
  const [mode, setMode] = useState<ThemeMode>(() => readThemeMode())

  useEffect(() => {
    setMode(readThemeMode())
    const target = document.documentElement
    const obs = new MutationObserver(() => setMode(readThemeMode()))
    obs.observe(target, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  return useMemo(
    () => buildPalette(mode, palette === 'colorblind', highContrast),
    [mode, palette, highContrast],
  )
}

export function useThemeMode(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>(() => readThemeMode())
  useEffect(() => {
    setMode(readThemeMode())
    const obs = new MutationObserver(() => setMode(readThemeMode()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return mode
}

/** 是否开启了「减少动态效果」——自动播放类场景据此默认暂停 */
export function usePrefersReducedMotion(): boolean {
  const [v, setV] = useState(false)
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    setV(mq.matches)
    const on = () => setV(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return v
}
