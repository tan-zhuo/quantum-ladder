/**
 * 检查有没有漏翻的字符串。
 *
 * 做法：扫出源码里所有 T('…') / t('…') 的 msgid（以及模块级预设视角的 label/title），
 * 与 src/i18n/dict.*.ts 的键求差集。漏翻不会让页面崩掉（会退回中文），
 * 所以必须有个东西专门盯着，否则英文页面会悄悄混进中文。
 *
 *   node scripts/i18n-check.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const CJK = /[一-鿿]/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(tsx?|astro)$/.test(name)) out.push(p)
  }
  return out
}

const files = walk('src')

const msgids = new Set()
const callRe = /\b[tT]\(\s*'((?:[^'\\]|\\.)*)'/gs
const presetRe = /(?:label|title):\s*'((?:[^'\\]|\\.)*)'/g

for (const f of files) {
  if (f.includes('/i18n/')) continue
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(callRe)) if (CJK.test(m[1])) msgids.add(m[1])
  // 预设视角的文案由 SceneCanvas 统一翻译，也要算进来
  if (f.includes('/canvas/')) {
    for (const m of src.matchAll(presetRe)) if (CJK.test(m[1])) msgids.add(m[1])
  }
}

const keys = new Set()
for (const name of readdirSync('src/i18n')) {
  if (!/^dict\..*\.ts$/.test(name)) continue
  const src = readFileSync(join('src/i18n', name), 'utf8')
  for (const m of src.matchAll(/^\s*(?:'((?:[^'\\]|\\.)*)'|([^\s:,'"{}()[\]]+)):/gm)) {
    const k = m[1] ?? m[2]
    if (k) keys.add(k)
  }
}

const missing = [...msgids].filter((k) => !keys.has(k)).sort()
if (missing.length === 0) {
  console.log(`i18n: ok — ${msgids.size} msgids, all translated`)
  process.exit(0)
}
console.error(`i18n: ${missing.length} untranslated msgid(s) of ${msgids.size}:`)
for (const m of missing) console.error('  ' + m)
process.exit(1)
