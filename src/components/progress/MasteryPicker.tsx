import { useEffect, useState } from 'react'
import { MASTERY_LABEL, getSection, markRead, setMastery, type Mastery } from '@/lib/progress'

/**
 * 小节末尾的「掌握程度」自评 + 已读标记。
 * 只写 localStorage，没有账号也没有上传——这也是本站能纯静态部署的前提。
 */
export default function MasteryPicker({ sectionId }: { sectionId: string }) {
  const [level, setLevel] = useState<Mastery>(0)
  const [read, setRead] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const p = getSection(sectionId)
    setLevel(p.mastery ?? 0)
    setRead(!!p.read)
    setReady(true)
  }, [sectionId])

  // 未读到 localStorage 之前不渲染，避免「未学」闪一下再跳成「已掌握」
  if (!ready) return <div className="h-[86px]" aria-hidden />

  function pick(l: Mastery) {
    const next = l === level ? 0 : l
    setLevel(next)
    setMastery(sectionId, next)
    if (next > 0 && !read) {
      setRead(true)
      markRead(sectionId, true)
    }
  }

  function toggleRead() {
    const next = !read
    setRead(next)
    markRead(sectionId, next)
  }

  return (
    <div className="no-print rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[var(--text)]">这一节你掌握到什么程度？</p>
          <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
            记录只保存在这台设备上，用于目录树标记与学习进度页
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label="掌握程度"
            className="inline-flex gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5"
          >
            {([1, 2, 3] as Mastery[]).map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={level === l}
                onClick={() => pick(l)}
                className={
                  'rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors ' +
                  (level === l
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]')
                }
              >
                {MASTERY_LABEL[l]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleRead}
            className={
              'rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ' +
              (read
                ? 'border-transparent bg-[var(--accent-soft)] text-[var(--accent-text)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]')
            }
          >
            {read ? '✓ 已读' : '标记已读'}
          </button>
        </div>
      </div>
    </div>
  )
}
