'use client'

import { isValidElement, useEffect, useMemo, useRef, useState } from 'react'

// Timed reading passage from a ```passage fence (paragraphs separated by blank lines). The passage
// stays hidden until the learner presses Start; Done stops the clock and shows words per minute.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-passage' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

function verdict(wpm: number) {
  if (wpm < 150) return 'Slow — you may be reading word by word or sub-vocalising. Practise reading in phrases.'
  if (wpm < 250) return 'About average for careful study reading. Faster is possible with practice.'
  if (wpm < 400) return 'A good, efficient reading rate — check that your comprehension keeps up.'
  if (wpm < 900) return 'Very fast — make sure you are not just skimming. Try the questions to check.'
  return 'That is faster than anyone reads with understanding — did you press Done before finishing? Reset and try again.'
}

export default function ReadingSpeed({ title, children }: { title?: string; children?: React.ReactNode }) {
  const paras = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    return out
      .join('\n')
      .replace(/\r/g, '')
      .split(/\n\s*\n/)
      .map(p => p.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean)
  }, [children])
  const words = useMemo(() => paras.join(' ').split(/\s+/).filter(Boolean).length, [paras])

  const [phase, setPhase] = useState<'ready' | 'reading' | 'done'>('ready')
  const [elapsed, setElapsed] = useState(0)
  const start = useRef(0)

  useEffect(() => {
    if (phase !== 'reading') return
    const id = setInterval(() => setElapsed(Date.now() - start.current), 250)
    return () => clearInterval(id)
  }, [phase])

  const secs = Math.max(1, Math.round(elapsed / 1000))
  const wpm = Math.round(words / (elapsed / 60000 || 1))
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">⏱️ {title ?? 'Timed reading'}</p>
        <span className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
          {words} words{phase !== 'ready' && ` · ${clock}`}
        </span>
      </div>
      <div className="p-3 space-y-3">
        {phase === 'ready' && (
          <div className="space-y-2">
            <p className="text-[12.5px] text-brand-navy/70 dark:text-white/70">
              Read at your normal study pace — for understanding, not just speed. Press <b>Start</b>, read the whole passage once, then press <b>Done</b>.
            </p>
            <button
              onClick={() => {
                start.current = Date.now()
                setElapsed(0)
                setPhase('reading')
              }}
              className="rounded-xl bg-brand-deep px-4 py-2 text-[13px] font-semibold text-white dark:bg-brand-sky dark:text-brand-navy"
            >
              ▶ Start reading
            </button>
          </div>
        )}

        {phase !== 'ready' && (
          <div className="rounded-xl border border-brand-navy/10 dark:border-white/15 bg-brand-sky/[0.04] px-3 py-2.5 space-y-2.5 text-[14px] leading-relaxed">
            {paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {phase === 'reading' && (
          <button
            onClick={() => {
              setElapsed(Date.now() - start.current)
              setPhase('done')
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white"
          >
            ■ Done
          </button>
        )}

        {phase === 'done' && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100">
            <b>{wpm} words per minute</b> ({words} words in {clock}). {verdict(wpm)} Now answer the questions below without looking back.{' '}
            <button
              onClick={() => {
                setPhase('ready')
                setElapsed(0)
              }}
              className="font-semibold underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
