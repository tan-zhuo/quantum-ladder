import { DICT_UI } from './dict.ui'
import { DICT_SCENES } from './dict.scenes'
import { DICT_SCENES_2 } from './dict.scenes2'
import { DICT_EXTRA } from './dict.extra'

/**
 * 全站英文译文。拆成三份只是为了让单个文件不至于太长，
 * 运行时是同一张表。键 = 中文原文。
 */
export const DICT: Record<string, string> = {
  ...DICT_UI,
  ...DICT_SCENES,
  ...DICT_SCENES_2,
  ...DICT_EXTRA,
}
