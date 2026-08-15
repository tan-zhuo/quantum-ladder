import { useEffect, useMemo, useState } from 'react'
import { getSection, recordQuiz } from '@/lib/progress'

/**
 * 章末自测。两种题型：
 *  - choice：单选 / 多选，选完立刻给对错与解析
 *  - numeric：填数值，按相对误差判对（量子力学的题常有 π、√2 这类因子，
 *             要求学生手算到小数点后若干位没有意义）
 *
 * 反馈是即时的：选错当场看到为什么错，比做完整套再对答案的学习效果好得多。
 */

export interface ChoiceQuestion {
  type?: 'choice'
  id: string
  prompt: string
  options: string[]
  /** 正确选项下标；多个即为多选题 */
  answer: number | number[]
  explain: string
  /** 选错某项时的针对性提示 */
  distractors?: Record<number, string>
}

export interface NumericQuestion {
  type: 'numeric'
  id: string
  prompt: string
  answer: number
  /** 允许的相对误差，默认 2% */
  tolerance?: number
  unit?: string
  explain: string
}

export type Question = ChoiceQuestion | NumericQuestion

interface Props {
  sectionId?: string
  questions: Question[]
  title?: string
}

type Answer = { picked: number[]; text: string; checked: boolean; correct: boolean }

export default function Quiz({ questions, title = '自测', sectionId }: Props) {
  const [resolvedSection, setResolvedSection] = useState<string | undefined>(sectionId)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [best, setBest] = useState<{ score: number; total: number } | null>(null)

  useEffect(() => {
    const id = sectionId ?? document.body.dataset.sectionId
    setResolvedSection(id)
    if (id) {
      const q = getSection(id).quiz
      if (q) setBest({ score: q.score, total: q.total })
    }
  }, [sectionId])

  const checkedCount = Object.values(answers).filter((a) => a.checked).length
  const score = Object.values(answers).filter((a) => a.checked && a.correct).length
  const allChecked = checkedCount === questions.length

  useEffect(() => {
    if (!allChecked || !resolvedSection) return
    const rec = recordQuiz(resolvedSection, score, questions.length)
    setBest({ score: rec.score, total: rec.total })
  }, [allChecked, score, questions.length, resolvedSection])

  function update(id: string, patch: Partial<Answer>) {
    setAnswers((prev) => ({
      ...prev,
      [id]: { picked: [], text: '', checked: false, correct: false, ...prev[id], ...patch },
    }))
  }

  function check(q: Question) {
    const a = answers[q.id] ?? { picked: [], text: '', checked: false, correct: false }
    let correct = false
    if (q.type === 'numeric') {
      const v = Number(a.text.trim())
      if (Number.isFinite(v)) {
        const tol = q.tolerance ?? 0.02
        const scale = Math.abs(q.answer) || 1
        correct = Math.abs(v - q.answer) / scale <= tol
      }
    } else {
      const want = Array.isArray(q.answer) ? [...q.answer].sort() : [q.answer]
      const got = [...a.picked].sort()
      correct = want.length === got.length && want.every((v, i) => v === got[i])
    }
    update(q.id, { checked: true, correct })
  }

  function retry() {
    setAnswers({})
  }

  return (
    <section className="not-prose my-8 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] print-break-avoid">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold">
          <span aria-hidden className="text-[var(--c-energy)]">
            ?
          </span>
          {title}
          <span className="text-[12.5px] font-normal text-[var(--text-faint)]">
            共 {questions.length} 题
          </span>
        </h3>
        <div className="flex items-center gap-3 text-[12.5px]">
          {best ? (
            <span className="text-[var(--text-faint)]">
              最好成绩 {best.score}/{best.total}
            </span>
          ) : null}
          {checkedCount > 0 ? (
            <button
              type="button"
              onClick={retry}
              className="no-print rounded-md border border-[var(--border)] px-2 py-0.5 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              重做
            </button>
          ) : null}
        </div>
      </header>

      <ol className="divide-y divide-[var(--border)]">
        {questions.map((q, qi) => (
          <QuestionRow
            key={q.id}
            index={qi + 1}
            question={q}
            answer={answers[q.id]}
            onPick={(picked) => update(q.id, { picked })}
            onText={(text) => update(q.id, { text })}
            onCheck={() => check(q)}
          />
        ))}
      </ol>

      {allChecked ? (
        <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-[13.5px]">
          <strong>
            本次 {score} / {questions.length}
          </strong>
          <span className="ml-2 text-[var(--text-muted)]">
            {score === questions.length
              ? '全对。可以往下一节了。'
              : score >= questions.length * 0.6
                ? '基本掌握。错的那题回头看一下对应的推导。'
                : '建议重读本节的推导部分，尤其是被折叠起来的那几段。'}
          </span>
        </footer>
      ) : null}
    </section>
  )
}

function QuestionRow({
  index,
  question,
  answer,
  onPick,
  onText,
  onCheck,
}: {
  index: number
  question: Question
  answer?: Answer
  onPick: (picked: number[]) => void
  onText: (t: string) => void
  onCheck: () => void
}) {
  const a = answer ?? { picked: [], text: '', checked: false, correct: false }
  const isMulti = question.type !== 'numeric' && Array.isArray(question.answer)
  const canCheck = question.type === 'numeric' ? a.text.trim() !== '' : a.picked.length > 0

  const wrongPicks = useMemo(() => {
    if (question.type === 'numeric' || !a.checked || a.correct) return []
    const want = Array.isArray(question.answer) ? question.answer : [question.answer]
    return a.picked.filter((p) => !want.includes(p))
  }, [a, question])

  return (
    <li className="px-4 py-4">
      <div className="flex gap-2.5">
        <span className="mt-0.5 shrink-0 font-mono text-[12.5px] text-[var(--text-faint)]">
          {index}.
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] leading-relaxed text-[var(--text)]">{question.prompt}</p>
          {isMulti ? (
            <p className="mt-0.5 text-[12px] text-[var(--text-faint)]">多选题</p>
          ) : null}

          {question.type === 'numeric' ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={a.text}
                disabled={a.checked}
                onChange={(e) => onText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canCheck && !a.checked) onCheck()
                }}
                placeholder="输入数值"
                className="w-40 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 font-mono text-[14px] outline-none focus:border-[var(--accent)] disabled:opacity-70"
              />
              {question.unit ? (
                <span className="text-[13px] text-[var(--text-muted)]">{question.unit}</span>
              ) : null}
              <span className="text-[12px] text-[var(--text-faint)]">
                允许 {((question.tolerance ?? 0.02) * 100).toFixed(0)}% 相对误差
              </span>
            </div>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {question.options.map((opt, oi) => {
                const picked = a.picked.includes(oi)
                const want = Array.isArray(question.answer) ? question.answer : [question.answer]
                const isRight = want.includes(oi)
                const showState = a.checked && (picked || isRight)
                return (
                  <li key={oi}>
                    <label
                      className={
                        'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-[14px] transition-colors ' +
                        (a.checked
                          ? isRight
                            ? 'border-[var(--c-energy)] bg-[color-mix(in_srgb,var(--c-energy)_9%,transparent)]'
                            : picked
                              ? 'border-[var(--c-danger)] bg-[color-mix(in_srgb,var(--c-danger)_8%,transparent)]'
                              : 'border-[var(--border)] opacity-60'
                          : picked
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border)] hover:border-[var(--border-strong)]')
                      }
                    >
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={question.id}
                        checked={picked}
                        disabled={a.checked}
                        onChange={() => {
                          if (isMulti) {
                            onPick(picked ? a.picked.filter((p) => p !== oi) : [...a.picked, oi])
                          } else {
                            onPick([oi])
                          }
                        }}
                        className="mt-1 shrink-0"
                      />
                      <span className="min-w-0 flex-1">{opt}</span>
                      {showState ? (
                        <span
                          aria-hidden
                          className="shrink-0 text-[13px]"
                          style={{ color: isRight ? 'var(--c-energy)' : 'var(--c-danger)' }}
                        >
                          {isRight ? '✓' : '✕'}
                        </span>
                      ) : null}
                    </label>
                  </li>
                )
              })}
            </ul>
          )}

          {!a.checked ? (
            <button
              type="button"
              onClick={onCheck}
              disabled={!canCheck}
              className="no-print mt-3 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-35"
            >
              提交
            </button>
          ) : (
            <div className="mt-3 rounded-lg bg-[var(--bg-subtle)] px-3 py-2.5 text-[13.5px] leading-relaxed">
              <p
                className="mb-1 font-medium"
                style={{ color: a.correct ? 'var(--c-energy)' : 'var(--c-danger)' }}
              >
                {a.correct ? '正确' : '不对'}
                {question.type === 'numeric' && !a.correct ? (
                  <span className="ml-2 font-normal text-[var(--text-muted)]">
                    正确答案 ≈ {question.answer}
                    {question.unit ? ` ${question.unit}` : ''}
                  </span>
                ) : null}
              </p>
              {wrongPicks.map((p) =>
                question.type !== 'numeric' && question.distractors?.[p] ? (
                  <p key={p} className="mb-1 text-[var(--text-muted)]">
                    <span className="text-[var(--c-danger)]">你选的 </span>
                    {question.distractors[p]}
                  </p>
                ) : null,
              )}
              <p className="text-[var(--text-muted)]">{question.explain}</p>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
