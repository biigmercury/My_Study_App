'use client'

import { isValidElement, useEffect, useMemo, useState } from 'react'

// Mock-panel practice from a ```drill fence: one question per line, with tips after "::".
//   Explain what your organization does in one minute. :: Name, sector, main services, your unit.
// Shows one question at a time with a countdown for answering aloud, then the tips.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-drill' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

function shuffle<T>(a: T[], seed: number) {
  const r = [...a]
  let s = seed
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export default function QuestionDrill({ title, seconds = '60', children }: { title?: string; seconds?: string; children?: React.ReactNode }) {
  const qs = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    return out
      .join('\n')
      .replace(/\r/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const [q, tip = ''] = l.split('::').map(s => s.trim())
        return { q, tip }
      })
  }, [children])
  const limit = Math.max(10, parseInt(seconds, 10) || 60)

  const [seed, setSeed] = useState(5)
  const order = useMemo(() => shuffle(qs, seed), [qs, seed])
  const [i, setI] = useState(-1)
  const [left, setLeft] = useState(limit)
  const [running, setRunning] = useState(false)
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    if (!running) return
    if (left <= 0) {
      setRunning(false)
      setShowTip(true)
      return
    }
    const id = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(id)
  }, [running, left])

  const next = () => {
    if (i + 1 >= order.length) {
      setSeed(s => s + 1)
      setI(0)
    } else setI(i + 1)
    setLeft(limit)
    setRunning(true)
    setShowTip(false)
  }
  const cur = i >= 0 ? order[i] : null

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🎤 {title ?? 'Mock panel'}</p>
        {cur && (
          <span className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
            Question {i + 1} of {order.length}
          </span>
        )}
      </div>
      <div className="p-3 space-y-3">
        {!cur ? (
          <p className="text-[12.5px] text-brand-navy/70 dark:text-white/70">
            The panel will ask you {qs.length} questions in random order. Answer each one <b>out loud</b> before the timer runs out ({limit} seconds), then compare with the tips.
          </p>
        ) : (
          <>
            <div className="rounded-xl bg-brand-sky/10 px-3 py-3">
              <p className="text-[15px] font-semibold leading-snug">“{cur.q}”</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-navy/10 dark:bg-white/10">
                <div className={`h-full rounded-full transition-all duration-1000 ${left <= 10 ? 'bg-rose-500' : 'bg-brand-deep dark:bg-brand-sky'}`} style={{ width: `${(left / limit) * 100}%` }} />
              </div>
              <span className={`w-10 text-right text-[13px] font-bold tabular-nums ${left <= 10 ? 'text-rose-600 dark:text-rose-300' : ''}`}>{left}s</span>
            </div>
            {showTip ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100">
                <b>What a strong answer covers:</b> {cur.tip}
              </div>
            ) : (
              <button
                onClick={() => {
                  setRunning(false)
                  setShowTip(true)
                }}
                className="rounded-lg border border-brand-navy/20 dark:border-white/25 px-2.5 py-1 text-[12px] font-semibold"
              >
                I&apos;ve answered — show tips
              </button>
            )}
          </>
        )}
        <button onClick={next} className="rounded-xl bg-brand-deep px-3 py-1.5 text-[12.5px] font-semibold text-white dark:bg-brand-sky dark:text-brand-navy">
          {cur ? 'Next question →' : '▶ Start the mock panel'}
        </button>
      </div>
    </div>
  )
}
