'use client'

import { useEffect, useMemo, useState } from 'react'
import { STAFF, STAFF_FIELDS, display, parseCriteria, tidyCriteria, type Field, type Row, type Value } from './access/model'

// Access queries on the lecture's Staff table: the Simple Query Wizard, then Design View's grid
// (Field, Table, Total, Sort, Show, Criteria, or), Run, Datasheet View and the SQL View Access
// writes behind the grid. Criteria use Access syntax: "M", >300000, Like "J*", Between … And …,
// Is Null, In (…), #dates#. The lecture's post-test queries are checked automatically.

type Agg = 'Group By' | 'Sum' | 'Avg' | 'Min' | 'Max' | 'Count' | 'Where'
interface Col {
  field: string
  sort: '' | 'Ascending' | 'Descending'
  show: boolean
  crit: string
  or: string
  total: Agg
}
const blankCol = (field = ''): Col => ({ field, sort: '', show: true, crit: '', or: '', total: 'Group By' })
const F = (n: string) => STAFF_FIELDS.find(f => f.name === n) as Field

type Tab = 'wizard' | 'design' | 'datasheet' | 'sql'

export default function QueryDesignGrid({ start = 'wizard' }: { start?: string }) {
  const [tab, setTab] = useState<Tab>((start as Tab) || 'wizard')
  const [cols, setCols] = useState<Col[]>([])
  const [totals, setTotals] = useState(false)
  const [name, setName] = useState('Query1')
  const [step, setStep] = useState(1)
  const [wizSel, setWizSel] = useState<string[]>([])
  const [avail, setAvail] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [openMode, setOpenMode] = useState<'open' | 'modify'>('open')
  const [error, setError] = useState<string | null>(null)
  const [ran, setRan] = useState(false)
  const [done, setDone] = useState<string[]>([])

  const used = cols.filter(c => c.field)

  // ---------- evaluation ----------
  const result = useMemo(() => {
    try {
      const preds = (key: 'crit' | 'or') =>
        used
          .filter(c => c[key].trim())
          .map(c => {
            const p = parseCriteria(c[key], F(c.field), `Staff.${c.field}`)
            return { c, p }
          })
      const r1 = preds('crit')
      const r2 = preds('or')
      const rowsPass = (r: Row) => {
        if (!r1.length && !r2.length) return true
        const ok1 = r1.length > 0 && r1.every(({ c, p }) => p.pred(r[c.field]))
        const ok2 = r2.length > 0 && r2.every(({ c, p }) => p.pred(r[c.field]))
        return ok1 || ok2
      }
      let rows = STAFF.filter(rowsPass)
      let headers: { key: string; field: Field; label: string }[]
      if (totals) {
        const groups = used.filter(c => c.total === 'Group By')
        const aggs = used.filter(c => c.total !== 'Group By' && c.total !== 'Where')
        const map = new Map<string, Row[]>()
        rows.forEach(r => {
          const k = JSON.stringify(groups.map(g => r[g.field]))
          map.set(k, [...(map.get(k) ?? []), r])
        })
        const out: Row[] = []
        map.forEach(list => {
          const row: Row = {}
          groups.forEach(g => (row[g.field] = list[0][g.field]))
          aggs.forEach(a => {
            const vals = list.map(r => r[a.field]).filter((v): v is Exclude<Value, null> => v !== null && v !== '')
            const nums = vals.map(Number)
            const key = `${a.total}Of${a.field}`
            row[key] =
              a.total === 'Count'
                ? vals.length
                : a.total === 'Sum'
                  ? nums.reduce((s, x) => s + x, 0)
                  : a.total === 'Avg'
                    ? nums.length
                      ? Math.round((nums.reduce((s, x) => s + x, 0) / nums.length) * 100) / 100
                      : null
                    : a.total === 'Min'
                      ? (vals.sort()[0] ?? null)
                      : (vals.sort().slice(-1)[0] ?? null)
          })
          out.push(row)
        })
        rows = out
        headers = [...groups.filter(g => g.show).map(g => ({ key: g.field, field: F(g.field), label: g.field })), ...aggs.filter(a => a.show).map(a => ({ key: `${a.total}Of${a.field}`, field: a.total === 'Count' ? { ...F(a.field), type: 'Number' as const } : F(a.field), label: `${a.total}Of${a.field}` }))]
      } else headers = used.filter(c => c.show).map(c => ({ key: c.field, field: F(c.field), label: c.field }))
      const sorts = used.filter(c => c.sort)
      rows = [...rows].sort((a, b) => {
        for (const s of sorts) {
          const key = totals && s.total !== 'Group By' ? `${s.total}Of${s.field}` : s.field
          const x = a[key]
          const y = b[key]
          const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''))
          if (d) return s.sort === 'Descending' ? -d : d
        }
        return 0
      })
      return { rows, headers, sql: sql(r1.map(x => x.p.sql), r2.map(x => x.p.sql)) }
    } catch {
      return { error: 'The expression you entered contains invalid syntax. You may have entered an operand without an operator, or text without quotation marks around it.' }
    }
  }, [cols, totals]) // eslint-disable-line react-hooks/exhaustive-deps

  function sql(c1: string[], c2: string[]) {
    if (!used.length) return 'SELECT\nFROM Staff;'
    const sel = used
      .filter(c => c.show && (!totals || c.total !== 'Where'))
      .map(c => (totals && c.total !== 'Group By' ? `${c.total}(Staff.${c.field}) AS ${c.total}Of${c.field}` : `Staff.${c.field}`))
    const cond = [c1, c2].filter(x => x.length).map(x => (x.length > 1 ? `(${x.join(' AND ')})` : x[0]))
    const where = cond.length ? cond.join(' OR ') : ''
    let s = `SELECT ${sel.join(', ') || '*'}\nFROM Staff`
    if (where) s += `\nWHERE ${where}`
    if (totals) {
      const g = used.filter(c => c.total === 'Group By').map(c => `Staff.${c.field}`)
      if (g.length) s += `\nGROUP BY ${g.join(', ')}`
    }
    const o = used.filter(c => c.sort).map(c => (totals && c.total !== 'Group By' ? `${c.total}(Staff.${c.field})` : `Staff.${c.field}`) + (c.sort === 'Descending' ? ' DESC' : ''))
    if (o.length) s += `\nORDER BY ${o.join(', ')}`
    return s + ';'
  }

  const setCol = (i: number, patch: Partial<Col>) => {
    setCols(cs => cs.map((c, k) => (k === i ? { ...c, ...patch } : c)))
    setRan(false)
  }
  const addField = (f: string) => {
    if (f === '*') {
      setCols(cs => [...cs.filter(c => c.field), ...STAFF_FIELDS.map(x => blankCol(x.name))])
      return
    }
    setCols(cs => [...cs.filter(c => c.field), blankCol(f)])
    setRan(false)
  }

  const run = () => {
    if ('error' in result) return setError(result.error ?? null)
    setError(null)
    setRan(true)
    setTab('datasheet')
  }

  // ---------- tasks ----------
  const ids = (list: Row[]) =>
    list
      .map(r => `${r.FirstName} ${r.Surname}`)
      .sort()
      .join('|')
  const got = 'rows' in result && ran && !totals ? ids(result.rows as Row[]) : null
  const showsNames = used.some(c => c.field === 'FirstName' && c.show) && used.some(c => c.field === 'Surname' && c.show)
  const tasks: [boolean, string][] = [
    [got === ids(STAFF.filter(r => r.Gender === 'M')) && showsNames && used.some(c => c.field === 'Gender' && c.show), 'Lecture example: all MALE staff — FirstName, Surname, Gender (criteria M under Gender)'],
    [got === ids(STAFF.filter(r => r.Gender === 'F')) && showsNames, 'Post-test 1: extract all the FEMALE staff'],
    [got === ids(STAFF.filter(r => r.FirstName === 'John')) && showsNames, 'Post-test 2: staff whose first name is John (careful — not Johnson!)'],
    [got === ids(STAFF.filter(r => Number(r.Salary) >= 300000 && r.Department === 'Computer Science')) && showsNames, 'Challenge: Computer Science staff earning ₦300,000 or more'],
    [totals && ran && 'rows' in result && (result.rows as Row[]).length === 4 && used.some(c => c.total === 'Count'), 'Challenge: number of staff in each department (Totals: Group By + Count)'],
  ]

  const satisfied = tasks
    .filter(t => t[0])
    .map(t => t[1])
    .join('|')
  useEffect(() => {
    if (!satisfied) return
    setDone(d => Array.from(new Set([...d, ...satisfied.split('|')])))
  }, [satisfied])

  const btn = 'px-2 py-1 rounded border border-[#c6c6c6] bg-white text-[11.5px] text-[#222] hover:border-[#A4373A] disabled:opacity-40'
  const RED = '#A4373A'
  const cell = 'border border-[#d4d4d4] p-0'

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔍 Access query — {name}</p>
        <button
          onClick={() => {
            setCols([])
            setTotals(false)
            setStep(1)
            setWizSel([])
            setTab('wizard')
            setRan(false)
            setError(null)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          New query
        </button>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3] text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="flex overflow-x-auto text-[11px] font-semibold" style={{ background: RED }}>
          {(
            [
              ['wizard', 'Query Wizard'],
              ['design', 'Design View'],
              ['datasheet', 'Datasheet View'],
              ['sql', 'SQL View'],
            ] as [Tab, string][]
          ).map(([t, l]) => (
            <button key={t} onClick={() => (t === 'datasheet' ? run() : setTab(t))} className={`px-3 py-1.5 shrink-0 ${tab === t ? 'bg-[#f3f3f3] text-[#A4373A]' : 'text-white/90 hover:bg-white/10'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'wizard' && (
          <div className="p-3 text-[12.5px] min-h-[230px] bg-white">
            {step === 1 && (
              <div className="space-y-1.5">
                <p className="font-semibold">New Query (CREATE → Query Wizard)</p>
                {[
                  ['Simple Query Wizard', 'Creates a select query from the fields you pick.'],
                  ['Crosstab Query Wizard', 'Summarises data in a compact, spreadsheet-like grid.'],
                  ['Find Duplicates Query Wizard', 'Finds records with duplicate field values.'],
                  ['Find Unmatched Query Wizard', 'Finds records in one table that have no related records in another.'],
                ].map(([t, d], k) => (
                  <label key={t} className={`flex items-start gap-2 ${k ? 'text-[#888]' : ''}`}>
                    <input type="radio" disabled={k > 0} defaultChecked={k === 0} name="qw" className="mt-1" />
                    <span>
                      <b>{t}</b> — {d}
                    </span>
                  </label>
                ))}
                <button className={btn} onClick={() => setStep(2)}>
                  OK
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-2">
                <p className="font-semibold">Which fields do you want in your query?</p>
                <label className="flex items-center gap-2">
                  Tables/Queries
                  <select className="border border-[#c6c6c6] px-1">
                    <option>Table: Staff</option>
                  </select>
                </label>
                <div className="flex gap-2 items-stretch">
                  <div className="flex-1">
                    <p className="text-[11px] text-[#555]">Available Fields:</p>
                    <div className="border border-[#c6c6c6] h-36 overflow-auto">
                      {STAFF_FIELDS.filter(f => !wizSel.includes(f.name)).map(f => (
                        <div key={f.name} onClick={() => setAvail(f.name)} onDoubleClick={() => setWizSel(w => [...w, f.name])} className={`px-1.5 cursor-pointer ${avail === f.name ? 'bg-[#A4373A] text-white' : ''}`}>
                          {f.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <button className={btn} onClick={() => avail && !wizSel.includes(avail) && setWizSel(w => [...w, avail])} aria-label="Add field">
                      &gt;
                    </button>
                    <button className={btn} onClick={() => setWizSel(STAFF_FIELDS.map(f => f.name))} aria-label="Add all fields">
                      &gt;&gt;
                    </button>
                    <button className={btn} onClick={() => chosen && setWizSel(w => w.filter(x => x !== chosen))} aria-label="Remove field">
                      &lt;
                    </button>
                    <button className={btn} onClick={() => setWizSel([])} aria-label="Remove all fields">
                      &lt;&lt;
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-[#555]">Selected Fields:</p>
                    <div className="border border-[#c6c6c6] h-36 overflow-auto">
                      {wizSel.map(n => (
                        <div key={n} onClick={() => setChosen(n)} className={`px-1.5 cursor-pointer ${chosen === n ? 'bg-[#A4373A] text-white' : ''}`}>
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={btn} onClick={() => setStep(1)}>
                    &lt; Back
                  </button>
                  <button className={btn} disabled={!wizSel.length} onClick={() => setStep(3)}>
                    Next &gt;
                  </button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-2">
                <p className="font-semibold">What title do you want for your query?</p>
                <input value={name} onChange={e => setName(e.target.value)} className="border border-[#c6c6c6] px-1.5 py-0.5 w-56" aria-label="Query title" />
                <p>Do you want to open the query or modify the query’s design?</p>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={openMode === 'open'} onChange={() => setOpenMode('open')} /> Open the query to view information.
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={openMode === 'modify'} onChange={() => setOpenMode('modify')} /> Modify the query design.
                </label>
                <div className="flex gap-2">
                  <button className={btn} onClick={() => setStep(2)}>
                    &lt; Back
                  </button>
                  <button
                    className={btn}
                    onClick={() => {
                      setCols(wizSel.map(n => blankCol(n)))
                      setTotals(false)
                      setStep(1)
                      if (openMode === 'open') {
                        setRan(true)
                        setTab('datasheet')
                      } else setTab('design')
                    }}
                  >
                    Finish
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'design' && (
          <div className="bg-white">
            <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-[#d4d4d4] text-[11.5px]">
              <button className={btn} onClick={run} title="QUERY TOOLS DESIGN → Run">
                ❗ Run
              </button>
              <button className={`${btn} ${totals ? '!border-[#A4373A] !bg-[#f6e3e3]' : ''}`} onClick={() => setTotals(t => !t)}>
                Σ Totals
              </button>
              <span className="text-[#555] ml-1">Double-click a field in the Staff box to add it to the grid.</span>
            </div>
            <div className="p-2 bg-[#e9e9e9]">
              <div className="w-40 bg-white border border-[#999] shadow-sm text-[12px]">
                <div className="px-1.5 py-0.5 text-white text-[11px]" style={{ background: RED }}>
                  Staff
                </div>
                <div className="max-h-32 overflow-auto">
                  {['*', ...STAFF_FIELDS.map(f => f.name)].map(n => (
                    <div key={n} onDoubleClick={() => addField(n)} className="px-1.5 hover:bg-[#fbe9e9] cursor-pointer flex justify-between">
                      <span>
                        {n === 'StaffID' ? '🔑 ' : ''}
                        {n}
                      </span>
                      <button onClick={() => addField(n)} className="text-[10px] text-[#A4373A]" aria-label={`Add ${n}`}>
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="text-[12px] border-collapse">
                <tbody>
                  {(['Field', 'Table', ...(totals ? ['Total'] : []), 'Sort', 'Show', 'Criteria', 'or'] as const).map(rowName => (
                    <tr key={rowName}>
                      <th className="px-1.5 py-1 border border-[#d4d4d4] bg-[#f4f4f4] text-left font-semibold w-16">{rowName}:</th>
                      {[...cols, blankCol()].map((c, i) => {
                        const ghost = i === cols.length
                        if (rowName === 'Field')
                          return (
                            <td key={i} className={cell}>
                              <div className="flex">
                                <select aria-label={`Field ${i + 1}`} value={c.field} onChange={e => (ghost ? addField(e.target.value) : setCol(i, { field: e.target.value }))} className="w-[112px] px-1 py-0.5 outline-none bg-transparent">
                                  <option value="" />
                                  {STAFF_FIELDS.map(f => (
                                    <option key={f.name}>{f.name}</option>
                                  ))}
                                </select>
                                {!ghost && (
                                  <button onClick={() => setCols(cs => cs.filter((_, k) => k !== i))} className="px-1 text-[#A4373A]" aria-label={`Delete column ${i + 1}`}>
                                    ✕
                                  </button>
                                )}
                              </div>
                            </td>
                          )
                        if (ghost) return <td key={i} className={`${cell} w-[128px]`} />
                        if (rowName === 'Table')
                          return (
                            <td key={i} className={`${cell} px-1.5 text-[#555]`}>
                              Staff
                            </td>
                          )
                        if (rowName === 'Total')
                          return (
                            <td key={i} className={cell}>
                              <select aria-label={`Total ${i + 1}`} value={c.total} onChange={e => setCol(i, { total: e.target.value as Agg, ...(e.target.value === 'Where' ? { show: false } : {}) })} className="w-full px-1 py-0.5 outline-none bg-transparent">
                                {(['Group By', 'Sum', 'Avg', 'Min', 'Max', 'Count', 'Where'] as Agg[]).map(a => (
                                  <option key={a}>{a}</option>
                                ))}
                              </select>
                            </td>
                          )
                        if (rowName === 'Sort')
                          return (
                            <td key={i} className={cell}>
                              <select aria-label={`Sort ${i + 1}`} value={c.sort} onChange={e => setCol(i, { sort: e.target.value as Col['sort'] })} className="w-full px-1 py-0.5 outline-none bg-transparent">
                                <option value="" />
                                <option>Ascending</option>
                                <option>Descending</option>
                              </select>
                            </td>
                          )
                        if (rowName === 'Show')
                          return (
                            <td key={i} className={`${cell} text-center`}>
                              <input type="checkbox" aria-label={`Show ${i + 1}`} checked={c.show} onChange={e => setCol(i, { show: e.target.checked })} />
                            </td>
                          )
                        const key = rowName === 'Criteria' ? 'crit' : 'or'
                        return (
                          <td key={i} className={cell}>
                            <input
                              aria-label={`${rowName} ${i + 1}`}
                              value={c[key]}
                              onChange={e => setCol(i, { [key]: e.target.value })}
                              onBlur={e => c.field && setCol(i, { [key]: tidyCriteria(e.target.value, F(c.field)) })}
                              className="w-[128px] px-1.5 py-0.5 outline-none bg-transparent font-mono text-[11.5px]"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && <p className="m-2 px-2 py-1.5 border border-[#A4373A] bg-[#fbeeee] text-[12px]">Microsoft Access: {error}</p>}
          </div>
        )}

        {tab === 'datasheet' && 'rows' in result && (
          <div className="bg-white overflow-x-auto">
            <table className="text-[12.5px] border-collapse">
              <thead>
                <tr className="bg-[#eef0f3]">
                  {result.headers!.map(h => (
                    <th key={h.key} className="px-2 py-1 border border-[#d4d4d4] text-left font-semibold whitespace-nowrap">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows!.map((r, i) => (
                  <tr key={i}>
                    {result.headers!.map(h => (
                      <td key={h.key} className="px-2 py-0.5 border border-[#e5e5e5] whitespace-nowrap" style={{ textAlign: typeof r[h.key] === 'number' ? 'right' : 'left' }}>
                        {display(r[h.key] ?? null, h.field)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!result.headers!.length && <p className="p-3 text-[12px] text-[#666]">No fields to show — add fields in Design View (or run the Query Wizard).</p>}
            <p className="px-2 py-1 text-[11px] text-[#555] border-t border-[#e5e5e5]">
              Record: 1 of {result.rows!.length} · {name}
            </p>
          </div>
        )}

        {tab === 'sql' && (
          <div className="bg-white p-3">
            <pre className="text-[12px] font-mono whitespace-pre-wrap text-[#111]">{'sql' in result ? result.sql : error}</pre>
            <p className="mt-2 text-[11px] text-[#666]">Access writes this SQL for you from the design grid (real Access adds extra brackets, e.g. WHERE (((Staff.Gender)=&quot;M&quot;))). Changing the SQL changes the grid, and vice versa.</p>
          </div>
        )}
        <div className="px-2 py-1 text-[10.5px] text-white" style={{ background: RED }}>
          {tab === 'design' ? 'Design View — criteria in the same row are joined with AND; the “or” row adds alternatives' : tab === 'datasheet' ? 'Datasheet View — the query’s results (the data still lives in the Staff table)' : tab === 'sql' ? 'SQL View' : 'Simple Query Wizard'}
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="text-[12px] font-bold mb-1">Queries to build (run each one):</p>
        <ul className="space-y-0.5 text-[12px]">
          {tasks.map(([, t]) => {
            const ok = done.includes(t)
            return (
              <li key={t} className={ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-brand-navy/80 dark:text-white/80'}>
                {ok ? '✓' : '○'} {t}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
