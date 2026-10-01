'use client'

import { isValidElement, useEffect, useMemo, useState } from 'react'
import { canSpeak, speak } from './speak'

// Word-stress practice from a ```stress fence. One word per line, syllables separated by "-",
// the primary-stressed syllable prefixed with an apostrophe, optional note after "::":
//   ac-'cept :: verb — a long vowel/consonant cluster in the second syllable
// The learner taps the syllable that carries the primary stress.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-stress' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

type Word = { syl: string[]; stress: number; note: string; spoken: string }

export default function StressPicker({ title, children }: { title?: string; children?: React.ReactNode }) {
  const words = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    const ws: Word[] = []
    for (const line of out.join('\n').replace(/\r/g, '').split('\n')) {
      const t = line.trim()
      if (!t) continue
      const [w, note = ''] = t.split('::').map(s => s.trim())
      const parts = w.split('-').map(s => s.trim()).filter(Boolean)
      const stress = parts.findIndex(p => p.startsWith("'"))
      const syl = parts.map(p => p.replace(/^'/, ''))
      ws.push({ syl, stress: Math.max(0, stress), note, spoken: syl.join('') })
    }
    return ws
  }, [children])

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [tts, setTts] = useState(false)
  useEffect(() => setTts(canSpeak()), [])
  const done = Object.keys(answers).length
  const right = words.filter((w, i) => answers[i] === w.stress).length

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🎯 {title ?? 'Where is the stress?'}</p>
        <button onClick={() => setAnswers({})} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky underline">
          Reset
        </button>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-[12px] text-brand-navy/65 dark:text-white/65">Tap the syllable that carries the primary stress.</p>
        {words.map((w, i) => {
          const a = answers[i]
          const answered = a !== undefined
          return (
            <div key={i} className="rounded-xl border border-brand-navy/10 dark:border-white/10 px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-1">
                {w.syl.map((s, j) => {
                  const isStress = j === w.stress
                  const cls = !answered
                    ? 'border-brand-navy/15 dark:border-white/20 hover:bg-brand-sky/10'
                    : isStress
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 font-bold'
                      : j === a
                        ? 'border-rose-400 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                        : 'border-brand-navy/10 dark:border-white/10 text-brand-navy/60 dark:text-white/60'
                  return (
                    <button
                      key={j}
                      disabled={answered}
                      onClick={() => setAnswers(prev => ({ ...prev, [i]: j }))}
                      className={`rounded-lg border px-2.5 py-1.5 text-[15px] transition ${cls}`}
                    >
                      {answered && isStress ? `ˈ${s.toUpperCase()}` : s}
                    </button>
                  )
                })}
                {tts && (
                  <button onClick={() => speak(w.spoken)} aria-label={`Hear ${w.spoken}`} className="ml-auto rounded-md border border-brand-navy/15 dark:border-white/20 h-8 w-8 text-[13px]">
                    🔊
                  </button>
                )}
              </div>
              {answered && (
                <p className={`mt-1 text-[12px] ${a === w.stress ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {a === w.stress ? '✓ Correct.' : `✗ The stress falls on “${w.syl[w.stress]}”.`} {w.note}
                </p>
              )}
            </div>
          )
        })}
        {done > 0 && (
          <p className="text-[12.5px] font-semibold">
            Score: {right} / {done} {done === words.length ? (right === words.length ? '— perfect!' : '— check the notes on the ones you missed.') : ''}
          </p>
        )}
      </div>
    </div>
  )
}
