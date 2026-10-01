'use client'

import { isValidElement, useMemo, useState } from 'react'

// "Spot the error" drill from an ```errors fence. One sentence per line; mark the faulty word or
// phrase as [wrong=>right] (at most one per line), optional explanation after "::". A line with no
// brackets is a correct sentence, answered with the "No error" button:
//   One of the boys [are=>is] absent today. :: The subject is "one", which is singular.
//   She has been here for three years. :: "For" goes with a period of time.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-errors' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

// Every word is its own button (so a multi-word error doesn't stand out); tapping any word of the
// faulty phrase counts as finding it.
type Token = { text: string; err: boolean }
type Item = { tokens: Token[]; hasError: boolean; wrong: string; fix: string; note: string }

function parse(line: string): Item {
  const [body, note = ''] = line.split('::').map(s => s.trim())
  const m = /^(.*?)\[(.+?)=>(.*?)\](.*)$/.exec(body)
  const words = (s: string, err = false) => s.split(/\s+/).filter(Boolean).map(text => ({ text, err }))
  if (!m) return { tokens: words(body), hasError: false, wrong: '', fix: '', note }
  // Keep punctuation glued to the error phrase (e.g. "[are=>is]," → "are,").
  const after = m[4]
  const glue = /^[^\s]*/.exec(after)?.[0] ?? ''
  const tokens = [...words(m[1]), ...words(m[2] + glue, true), ...words(after.slice(glue.length))]
  return { tokens, hasError: true, wrong: m[2], fix: m[3] + glue, note }
}

export default function ErrorSpotter({ title, children }: { title?: string; children?: React.ReactNode }) {
  const items = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    return out
      .join('\n')
      .replace(/\r/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(parse)
  }, [children])

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const isRight = (it: Item, a: number | undefined) => a !== undefined && (it.hasError ? a >= 0 && it.tokens[a].err : a === -1)
  const right = items.filter((it, i) => isRight(it, answers[i])).length
  const done = Object.keys(answers).length

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔍 {title ?? 'Spot the error'}</p>
        <span className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
          {right} / {done} correct · {items.length - done} left{' '}
          {done > 0 && (
            <button onClick={() => setAnswers({})} className="ml-1 underline">
              Reset
            </button>
          )}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-[12px] text-brand-navy/65 dark:text-white/65">Tap the word or phrase that is wrong — or <b>No error</b> if the sentence is correct.</p>
        {items.map((it, i) => {
          const a = answers[i]
          const answered = a !== undefined
          const ok = isRight(it, a)
          const lastErr = it.tokens.map(t => t.err).lastIndexOf(true)
          return (
            <div key={i} className="rounded-xl border border-brand-navy/10 dark:border-white/15 px-3 py-2">
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[14px]">
                <span className="mr-1 text-[11px] font-bold text-brand-navy/50 dark:text-white/50">{i + 1}.</span>
                {it.tokens.map((t, k) => {
                  const isErr = t.err
                  const cls = !answered
                    ? 'hover:bg-brand-sky/20 cursor-pointer'
                    : isErr
                      ? 'bg-rose-100 text-rose-900 line-through decoration-2 dark:bg-rose-900/40 dark:text-rose-100'
                      : k === a
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
                        : ''
                  return (
                    <span key={k} className="inline-flex items-center gap-1">
                      <button disabled={answered} onClick={() => setAnswers(s => ({ ...s, [i]: k }))} className={`rounded px-0.5 ${cls}`}>
                        {t.text}
                      </button>
                      {answered && k === lastErr && <span className="rounded bg-emerald-100 px-1 font-semibold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">{it.fix || '(delete)'}</span>}
                    </span>
                  )
                })}
                <button
                  disabled={answered}
                  onClick={() => setAnswers(s => ({ ...s, [i]: -1 }))}
                  className={`ml-auto rounded-lg border px-2 py-0.5 text-[11.5px] font-semibold ${answered && !it.hasError ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : answered && a === -1 ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-brand-navy/20 dark:border-white/25'}`}
                >
                  No error
                </button>
              </div>
              {answered && (
                <p className={`mt-1.5 text-[12.5px] ${ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                  <b>{ok ? '✓ Correct.' : !it.hasError ? '✗ This sentence is correct.' : `✗ The error is "${it.wrong}".`}</b> {it.note}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
