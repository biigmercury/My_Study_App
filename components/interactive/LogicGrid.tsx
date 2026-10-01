'use client'

import { useMemo, useState } from 'react'

// Elimination grid ("matrix method") for logic puzzles.
//   <LogicGrid title="…" rows="Adeshina, Okwudili, Olusegun" cols="Position: Accountant, Manager, Cashier"
//              answer="Adeshina: Cashier; Okwudili: Manager; Olusegun: Accountant">clues as MDX</LogicGrid>
// Several categories: cols="Rank: Sergeant, Corporal | Unit: Signals, Catering" and answer="Name: Sergeant, Signals; …".
// Tap a cell to cycle blank → ✗ → ✓. Placing ✓ crosses out the rest of its row and column in that category.

type Group = { label: string; values: string[] }
type Mark = 0 | 1 | 2 // blank, ✗, ✓

const split = (s: string, sep: string) =>
  s
    .split(sep)
    .map(t => t.trim())
    .filter(Boolean)

export default function LogicGrid({
  title,
  rows,
  cols,
  answer,
  children,
}: {
  title?: string
  rows: string
  cols: string
  answer?: string
  children?: React.ReactNode
}) {
  const people = useMemo(() => split(rows, ','), [rows])
  const groups: Group[] = useMemo(
    () =>
      split(cols, '|').map(g => {
        const i = g.indexOf(':')
        return i >= 0 ? { label: g.slice(0, i).trim(), values: split(g.slice(i + 1), ',') } : { label: '', values: split(g, ',') }
      }),
    [cols],
  )
  // solution[g][r] = column index of the correct value
  const solution = useMemo(() => {
    if (!answer) return null
    const byRow: Record<string, string[]> = {}
    for (const part of split(answer, ';')) {
      const i = part.indexOf(':')
      if (i < 0) continue
      byRow[part.slice(0, i).trim()] = split(part.slice(i + 1), ',')
    }
    return groups.map(g => people.map(p => g.values.findIndex(v => (byRow[p] ?? []).includes(v))))
  }, [answer, groups, people])

  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [checked, setChecked] = useState(false)
  const k = (g: number, r: number, c: number) => `${g}-${r}-${c}`
  const get = (g: number, r: number, c: number): Mark => marks[k(g, r, c)] ?? 0

  const tap = (g: number, r: number, c: number) => {
    setChecked(false)
    setMarks(prev => {
      const next = { ...prev }
      const m = ((prev[k(g, r, c)] ?? 0) + 1) % 3 as Mark
      next[k(g, r, c)] = m
      if (m === 2) {
        groups[g].values.forEach((_, c2) => {
          if (c2 !== c && !next[k(g, r, c2)]) next[k(g, r, c2)] = 1
        })
        people.forEach((_, r2) => {
          if (r2 !== r && !next[k(g, r2, c)]) next[k(g, r2, c)] = 1
        })
      }
      return next
    })
  }

  const reveal = () => {
    if (!solution) return
    const next: Record<string, Mark> = {}
    groups.forEach((grp, g) => people.forEach((_, r) => grp.values.forEach((__, c) => (next[k(g, r, c)] = solution[g][r] === c ? 2 : 1))))
    setMarks(next)
    setChecked(true)
  }

  let total = 0
  let right = 0
  let wrongTicks = 0
  let wrongCrosses = 0
  if (solution)
    groups.forEach((grp, g) =>
      people.forEach((_, r) => {
        total++
        grp.values.forEach((__, c) => {
          const m = get(g, r, c)
          const correct = solution[g][r] === c
          if (m === 2 && correct) right++
          if (m === 2 && !correct) wrongTicks++
          if (m === 1 && correct) wrongCrosses++
        })
      }),
    )

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🧩 {title ?? 'Logic grid'}</p>
        <button
          onClick={() => {
            setMarks({})
            setChecked(false)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky underline"
        >
          Clear
        </button>
      </div>
      <div className="p-3 space-y-3">
        {children && <div className="text-[13.5px] leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-1">{children}</div>}
        <p className="text-[11.5px] text-brand-navy/60 dark:text-white/60">Tap a cell: once for ✗ (ruled out), twice for ✓ (confirmed), three times to clear.</p>
        {groups.map((grp, g) => (
          <div key={g} className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="px-1 py-1 text-left text-[10px] font-semibold uppercase tracking-wide text-brand-navy/50 dark:text-white/50 align-bottom">{grp.label}</th>
                  {grp.values.map(v => (
                    <th key={v} className={`px-0.5 py-1 font-semibold leading-tight align-bottom break-words ${grp.values.length >= 6 ? 'text-[9.5px] max-w-[58px]' : 'text-[11px] max-w-[72px]'}`}>
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((p, r) => (
                  <tr key={p}>
                    <th className="pr-1.5 py-0.5 text-left font-semibold text-[12px] leading-tight max-w-[96px]">{p}</th>
                    {grp.values.map((v, c) => {
                      const m = get(g, r, c)
                      const bad = checked && solution && ((m === 2 && solution[g][r] !== c) || (m === 1 && solution[g][r] === c))
                      return (
                        <td key={v} className="p-0.5">
                          <button
                            onClick={() => tap(g, r, c)}
                            aria-label={`${p} — ${v}: ${m === 2 ? 'confirmed' : m === 1 ? 'ruled out' : 'blank'}`}
                            className={`h-9 w-full min-w-[32px] rounded-md border text-[15px] font-bold transition ${
                              bad
                                ? 'border-rose-400 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                                : m === 2
                                  ? 'border-emerald-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                  : m === 1
                                    ? 'border-brand-navy/15 dark:border-white/15 text-brand-navy/40 dark:text-white/40'
                                    : 'border-brand-navy/15 dark:border-white/15'
                            }`}
                          >
                            {m === 2 ? '✓' : m === 1 ? '✗' : ''}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {solution && (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setChecked(true)} className="rounded-lg bg-brand-deep dark:bg-brand-sky text-white dark:text-brand-navy px-3 py-1.5 text-[13px] font-semibold">
              Check my grid
            </button>
            <button onClick={reveal} className="rounded-lg border border-brand-navy/15 dark:border-white/20 px-3 py-1.5 text-[13px] font-semibold">
              Show solution
            </button>
          </div>
        )}
        {checked && solution && (
          <div
            className={`rounded-xl border px-3 py-2 text-[13px] ${
              right === total && !wrongTicks
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100'
                : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100'
            }`}
          >
            {right === total && !wrongTicks ? (
              <b>Solved — every placement is correct.</b>
            ) : (
              <>
                <b>
                  {right} of {total} correct ✓ so far.
                </b>
                {wrongTicks > 0 && ` ${wrongTicks} ✓ ${wrongTicks === 1 ? 'is' : 'are'} in the wrong place.`}
                {wrongCrosses > 0 && ` ${wrongCrosses} correct ${wrongCrosses === 1 ? 'cell has' : 'cells have'} been crossed out.`}
                {(wrongTicks > 0 || wrongCrosses > 0) && ' Mistakes are shown in red — recheck the clue you used there.'}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
