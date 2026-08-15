import { create } from 'zustand'

/**
 * 全站 3D 场景共享的显示偏好与性能档位。
 *
 * 为什么用一个全局 store 而不是每个场景各存各的：这些是「用户对整个平台的偏好」
 * ——色盲配色、是否显示场景内标注、性能档位——在 A 场景调好之后到 B 场景应该还生效。
 * 场景自己的物理参数（波长、量子数……）留在各自组件的局部 state 里，不进这里。
 */

export type Quality = 'high' | 'medium' | 'low'
export type Palette = 'standard' | 'colorblind'

export interface QualityProfile {
  /** 点云类场景的粒子预算 */
  points: number
  /** 曲面/曲线的细分段数基准 */
  segments: number
  /** devicePixelRatio 上限 */
  dpr: [number, number]
  /** 是否允许阴影等较贵的效果 */
  rich: boolean
}

export const QUALITY_PROFILE: Record<Quality, QualityProfile> = {
  high: { points: 60000, segments: 128, dpr: [1, 2], rich: true },
  medium: { points: 26000, segments: 80, dpr: [1, 1.5], rich: true },
  low: { points: 9000, segments: 48, dpr: [0.75, 1], rich: false },
}

interface SceneState {
  quality: Quality
  /** 用户手动锁定档位后，自动降级不再插手 */
  qualityLocked: boolean
  palette: Palette
  highContrast: boolean
  /** 场景内的文字/箭头标注 */
  labels: boolean
  /** 最近一次测得的帧率，显示在性能徽章上 */
  fps: number
  setQuality: (q: Quality, lock?: boolean) => void
  setPalette: (p: Palette) => void
  setHighContrast: (v: boolean) => void
  setLabels: (v: boolean) => void
  setFps: (v: number) => void
  /** 帧率过低时由 <AdaptiveQuality> 调用 */
  degrade: () => void
}

const PREF_KEY = 'ql:scene-prefs:v1'

interface StoredPrefs {
  quality?: Quality
  qualityLocked?: boolean
  palette?: Palette
  highContrast?: boolean
  labels?: boolean
}

function readPrefs(): StoredPrefs {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(PREF_KEY) ?? '{}') as StoredPrefs
  } catch {
    return {}
  }
}

function writePrefs(p: StoredPrefs) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(p))
  } catch {
    /* 隐私模式下写不进去，忽略即可 */
  }
}

/**
 * 首次进入时按设备能力猜一个档位。
 *
 * 猜错也不要紧：AdaptiveQuality 会在真实帧率上再纠正一次。这里只是为了避免
 * 低端手机第一帧就去渲染六万个点——那一下卡顿足以让人以为页面崩了。
 */
function guessQuality(): Quality {
  if (typeof navigator === 'undefined') return 'medium'
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency ?? 4
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
  if (mem <= 2 || cores <= 2) return 'low'
  if (coarse || mem <= 4 || cores <= 4) return 'medium'
  return 'high'
}

const initial = readPrefs()

export const useSceneStore = create<SceneState>((set, get) => ({
  quality: initial.quality ?? guessQuality(),
  qualityLocked: initial.qualityLocked ?? false,
  palette: initial.palette ?? 'standard',
  highContrast: initial.highContrast ?? false,
  labels: initial.labels ?? true,
  fps: 60,

  setQuality: (quality, lock = true) => {
    set({ quality, qualityLocked: lock })
    writePrefs({ ...readPrefs(), quality, qualityLocked: lock })
  },
  setPalette: (palette) => {
    set({ palette })
    writePrefs({ ...readPrefs(), palette })
  },
  setHighContrast: (highContrast) => {
    set({ highContrast })
    writePrefs({ ...readPrefs(), highContrast })
  },
  setLabels: (labels) => {
    set({ labels })
    writePrefs({ ...readPrefs(), labels })
  },
  setFps: (fps) => set({ fps }),
  degrade: () => {
    const { quality, qualityLocked } = get()
    if (qualityLocked) return
    if (quality === 'high') set({ quality: 'medium' })
    else if (quality === 'medium') set({ quality: 'low' })
  },
}))

/** 组件里最常用的一行：拿到当前档位的具体数字 */
export function useQualityProfile(): QualityProfile {
  return QUALITY_PROFILE[useSceneStore((s) => s.quality)]
}
