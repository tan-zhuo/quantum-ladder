import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '@/i18n/react'
import { search, type SearchDoc, type SearchHit } from '@/lib/search'

/**
 * 全站搜索对话框。索引在首次打开时才拉（/search-index.json），
 * 不打开就一个字节都不下载。
 */
export default function SearchDialog() {
  const T = useT()
  const [open, setOpen] = useState(false)
  const [docs, setDocs] = useState<SearchDoc[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const loadIndex = useCallback(async () => {
    if (docs || loading) return
    setLoading(true)
    try {
      // BASE_URL 在客户端 bundle 里也会被 Vite 静态替换，
      // 部署到 GitHub Pages 子路径时不用改代码
      const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/search-index.json`)
      setDocs((await res.json()) as SearchDoc[])
    } catch {
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [docs, loading])

  useEffect(() => {
    const onOpen = () => {
      setOpen(true)
      void loadIndex()
    }
    window.addEventListener('ql:search-open', onOpen)
    return () => window.removeEventListener('ql:search-open', onOpen)
  }, [loadIndex])

  useEffect(() => {
    if (open) {
      // 等对话框实际挂到 DOM 上再聚焦
      requestAnimationFrame(() => inputRef.current?.focus())
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const hits: SearchHit[] = useMemo(() => {
    if (!docs || !query.trim()) return []
    // 只搜当前语言的内容：索引里中英两份都在，混在一起搜会得到成对的重复结果。
    // 教材小节只有中文，所以英文界面下仍然让它们参与搜索（标题已是英文）。
    const lang = typeof document !== 'undefined' && document.documentElement.lang.startsWith('en') ? 'en' : 'zh'
    const scoped = docs.filter((d) => {
      const isLab = d.id.startsWith('lab/')
      if (!isLab) return true
      return lang === 'en' ? d.href.includes('/en/') : !d.href.includes('/en/')
    })
    return search(scoped, query, 24)
  }, [docs, query])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.children[cursor] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor, open])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      const hit = hits[cursor]
      if (hit) {
        e.preventDefault()
        window.location.href = hit.doc.href
      }
    }
  }

  if (!open) return null

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh]"
      role="dialog"
      aria-modal="true"
      aria-label={T('搜索')}
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />

      <div
        className="relative flex max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-[var(--text-faint)]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={T('搜索章节、概念、公式…（试试「隧道」「Ehrenfest」「归一化」）')}
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--text-faint)]"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-faint)]"
          >
            esc
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-8 text-center text-[13.5px] text-[var(--text-faint)]">{T('正在加载索引…')}</p>
          ) : !query.trim() ? (
            <p className="px-4 py-8 text-center text-[13.5px] text-[var(--text-faint)]">
              {T('输入关键词开始搜索。支持中文与英文，公式里的命令名（如 psi、hbar）也能搜到。')}
            </p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13.5px] text-[var(--text-faint)]">
              {T('没有匹配的内容。换个说法试试？')}
            </p>
          ) : (
            <ul ref={listRef} className="p-2">
              {hits.map((hit, i) => (
                <li key={hit.doc.id}>
                  <a
                    href={hit.doc.href}
                    onMouseEnter={() => setCursor(i)}
                    className={
                      'block rounded-lg px-3 py-2.5 transition-colors ' +
                      (i === cursor ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-subtle)]')
                    }
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 font-mono text-[11.5px] text-[var(--text-faint)]">
                        {hit.doc.label}
                      </span>
                      <span className="truncate text-[14px] font-medium text-[var(--text)]">
                        {hit.doc.title}
                      </span>
                      <span className="ml-auto shrink-0 truncate text-[11.5px] text-[var(--text-faint)]">
                        {hit.doc.chapter}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
                      <Highlight text={hit.excerpt} terms={hit.terms} />
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[11.5px] text-[var(--text-faint)]">
          <span>
            <kbd className="font-mono">↑↓</kbd> {T('选择')}
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> {T('打开')}
          </span>
          <span>
            <kbd className="font-mono">esc</kbd> {T('关闭')}
          </span>
          {docs ? <span className="ml-auto">{T('{0} 个条目已索引', docs.length)}</span> : null}
        </div>
      </div>
    </div>
  )
}

/** 把命中的子串标出来。先按长度降序，避免短词把长词切碎。 */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const sorted = [...terms].sort((a, b) => b.length - a.length).filter((t) => t.length > 1)
  if (!sorted.length) return <>{text}</>

  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'))
  const lower = new Set(sorted.map((t) => t.toLowerCase()))

  return (
    <>
      {parts.map((p, i) =>
        lower.has(p.toLowerCase()) ? (
          <mark key={i} className="rounded bg-[var(--accent-soft)] px-0.5 text-[var(--accent-text)]">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}
