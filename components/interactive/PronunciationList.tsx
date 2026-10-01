'use client'

import { isValidElement, useEffect, useMemo, useState } from 'react'
import { canSpeak, speak } from './speak'

// Pronunciation drill from a ```pron fence:
//   # Silent letters
//   Debt | debt (with b) | /det/ | silent b
// Each row: word | common wrong form | correct transcription | what to note. 🔊 reads the word aloud;
// "Test yourself" hides the transcriptions until tapped.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-pron' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

type Row = { word: string; wrong: string; ipa: string; note: string }
type Group = { heading: string; rows: Row[] }

export default function PronunciationList({ title, children }: { title?: string; children?: React.ReactNode }) {
  const groups = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    const gs: Group[] = []
    for (const line of out.join('\n').replace(/\r/g, '').split('\n')) {
      const t = line.trim()
      if (!t) continue
      if (t.startsWith('#')) {
        gs.push({ heading: t.replace(/^#+\s*/, ''), rows: [] })
        continue
      }
      const [word, wrong = '', ipa = '', note = ''] = t.split('|').map(s => s.trim())
      if (!gs.length) gs.push({ heading: '', rows: [] })
      gs[gs.length - 1].rows.push({ word, wrong, ipa, note })
    }
    return gs
  }, [children])

  const [tts, setTts] = useState(false)
  const [test, setTest] = useState(false)
  const [shown, setShown] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(0)
  useEffect(() => setTts(canSpeak()), [])
  const total = groups.reduce((n, g) => n + g.rows.length, 0)

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔊 {title ?? 'Pronunciation drill'}</p>
        <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-deep dark:text-brand-sky">
          <input
            type="checkbox"
            checked={test}
            onChange={e => {
              setTest(e.target.checked)
              setShown(new Set())
            }}
          />
          Test yourself
        </label>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-[12px] text-brand-navy/65 dark:text-white/65">
          {total} words. {test ? 'Say each word aloud, then tap “show” to check the transcription.' : 'Tap 🔊 to hear a word, then say it yourself.'}
        </p>
        {groups.map((g, gi) => (
          <div key={gi} className="rounded-xl border border-brand-navy/10 dark:border-white/10 overflow-hidden">
            {g.heading && (
              <button
                onClick={() => setOpen(open === gi ? -1 : gi)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-[13px] font-bold bg-brand-soft/50 dark:bg-white/5"
                aria-expanded={open === gi}
              >
                <span>
                  {g.heading} <span className="font-normal text-brand-navy/50 dark:text-white/50">({g.rows.length})</span>
                </span>
                <span aria-hidden>{open === gi ? '▾' : '▸'}</span>
              </button>
            )}
            {(open === gi || !g.heading) && (
              <ul className="divide-y divide-brand-navy/10 dark:divide-white/10">
                {g.rows.map(r => {
                  const hidden = test && !shown.has(r.word)
                  return (
                    <li key={r.word} className="px-3 py-2 flex items-start gap-2">
                      <button
                        onClick={() => tts && speak(r.word)}
                        disabled={!tts}
                        aria-label={`Hear ${r.word}`}
                        className="mt-0.5 shrink-0 rounded-md border border-brand-navy/15 dark:border-white/20 h-8 w-8 text-[14px] disabled:opacity-40"
                      >
                        🔊
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold">
                          {r.word}{' '}
                          {hidden ? (
                            <button
                              onClick={() => setShown(s => new Set(s).add(r.word))}
                              className="ml-1 rounded-md bg-brand-deep/10 dark:bg-brand-sky/15 px-2 py-0.5 text-[11.5px] font-semibold text-brand-deep dark:text-brand-sky"
                            >
                              show
                            </button>
                          ) : (
                            <span className="font-serif font-normal text-[15px] text-emerald-700 dark:text-emerald-300">{r.ipa}</span>
                          )}
                        </p>
                        <p className="text-[12px] text-brand-navy/70 dark:text-white/70">
                          {r.wrong && (
                            <>
                              <span className="text-rose-600 dark:text-rose-300">Not “{r.wrong}”</span>
                              {r.note ? ' · ' : ''}
                            </>
                          )}
                          {r.note}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
        {!tts && <p className="text-[11px] text-brand-navy/50 dark:text-white/50">Audio is not available in this browser.</p>}
      </div>
    </div>
  )
}
