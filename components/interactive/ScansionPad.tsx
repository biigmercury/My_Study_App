'use client'

import { isValidElement, useMemo, useState } from 'react'

// Scansion practice from a ```scan fence. One line of verse per line: words separated by spaces,
// syllables inside a word by "-", stressed syllables written in CAPITALS, metre name after "::".
//   if WE must DIE let IT not BE like HOGS :: iambic pentameter
// The learner taps syllables to mark them stressed, then checks against the key.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-scan' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

type Syl = { text: string; stressed: boolean; wordEnd: boolean }
type Line = { syls: Syl[]; metre: string }

const isUpper = (s: string) => /[A-Z]/.test(s) && s === s.toUpperCase()

export default function ScansionPad({ title, children }: { title?: string; children?: React.ReactNode }) {
  const lines = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    const ls: Line[] = []
    for (const raw of out.join('\n').replace(/\r/g, '').split('\n')) {
      const t = raw.trim()
      if (!t) continue
      const [verse, metre = ''] = t.split('::').map(s => s.trim())
      const syls: Syl[] = []
      for (const word of verse.split(/\s+/)) {
        const parts = word.split('-').filter(Boolean)
        parts.forEach((p, i) => syls.push({ text: p, stressed: isUpper(p.replace(/[^A-Za-z]/g, '')), wordEnd: i === parts.length - 1 }))
      }
      ls.push({ syls, metre })
    }
    return ls
  }, [children])

  const [marks, setMarks] = useState<Record<string, boolean>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const k = (l: number, s: number) => `${l}-${s}`

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🥁 {title ?? 'Scan the line'}</p>
      <div className="p-3 space-y-3">
        <p className="text-[12px] text-brand-navy/65 dark:text-white/65">
          Read each line aloud. Tap every syllable you hear <b>stressed</b> (it turns bold with ´), then check. Unstressed syllables are marked ˘.
        </p>
        {lines.map((line, li) => {
          const done = checked[li]
          const wrong = line.syls.filter((s, si) => !!marks[k(li, si)] !== s.stressed).length
          return (
            <div key={li} className="rounded-xl border border-brand-navy/10 dark:border-white/10 p-2.5">
              <div className="flex flex-wrap items-end gap-y-2">
                {line.syls.map((s, si) => {
                  const on = !!marks[k(li, si)]
                  const ok = on === s.stressed
                  return (
                    <span key={si} className={`flex flex-col items-center ${s.wordEnd ? 'mr-2.5' : ''}`}>
                      <span className={`text-[12px] leading-none h-3 ${done ? (s.stressed ? 'text-emerald-600 dark:text-emerald-300' : 'text-brand-navy/40 dark:text-white/40') : 'text-brand-deep dark:text-brand-sky'}`}>
                        {done ? (s.stressed ? '´' : '˘') : on ? '´' : ''}
                      </span>
                      <button
                        onClick={() => {
                          setChecked(c => ({ ...c, [li]: false }))
                          setMarks(m => ({ ...m, [k(li, si)]: !on }))
                        }}
                        className={`rounded-md px-1 py-0.5 text-[15px] ${on ? 'font-bold underline decoration-2' : ''} ${
                          done && !ok ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : done && s.stressed ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                        }`}
                      >
                        {s.text.toLowerCase()}
                      </button>
                    </span>
                  )
                })}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button onClick={() => setChecked(c => ({ ...c, [li]: true }))} className="rounded-lg bg-brand-deep dark:bg-brand-sky text-white dark:text-brand-navy px-2.5 py-1 text-[12px] font-semibold">
                  Check
                </button>
                {done && (
                  <span className={`text-[12px] ${wrong ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {wrong ? `${wrong} syllable${wrong > 1 ? 's' : ''} differ from the key (shown in red).` : 'Perfect!'} {line.metre && <b>Metre: {line.metre}.</b>}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
