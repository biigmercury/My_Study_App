'use client'

import { useMemo, useRef, useState } from 'react'

// Truth-table explorer for propositional logic.
//   <TruthTable title="…" formula="p v ~p" />                    → table + tautology/contradiction/contingent verdict
//   <TruthTable title="…" premises="p > q; p" conclusion="q" />  → argument table, critical rows and a validity verdict
// Students can edit the formula/argument. Accepted symbols: ~ ¬ - (not), . · & (and), v ∨ (or),
// > ⊃ → -> (if…then), = ≡ ↔ <-> (if and only if), parentheses. Any letter except lower-case v is a variable.

type Op = 'and' | 'or' | 'imp' | 'iff'
type Node = { k: 'var'; name: string } | { k: 'not'; a: Node } | { k: 'bin'; op: Op; a: Node; b: Node }

const SYMBOL: Record<Op, string> = { and: '·', or: 'v', imp: '⊃', iff: '≡' }

function tokenize(src: string): string[] | string {
  const out: string[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (src.startsWith('<->', i)) {
      out.push('iff')
      i += 3
      continue
    }
    if (src.startsWith('->', i)) {
      out.push('imp')
      i += 2
      continue
    }
    if ('~¬-!'.includes(c)) out.push('not')
    else if ('.·&∧*'.includes(c)) out.push('and')
    else if ('v∨+'.includes(c)) out.push('or')
    else if ('>⊃→'.includes(c)) out.push('imp')
    else if ('=≡↔'.includes(c)) out.push('iff')
    else if (c === '(' || c === '[') out.push('(')
    else if (c === ')' || c === ']') out.push(')')
    else if (/[A-Za-uw-z]/.test(c)) out.push('V:' + c)
    else return `Unexpected character “${c}”`
    i++
  }
  return out
}

function parse(src: string): Node | string {
  const toks = tokenize(src)
  if (typeof toks === 'string') return toks
  if (!toks.length) return 'Empty formula'
  let pos = 0
  const peek = () => toks[pos]
  const fail = (m: string) => {
    throw new Error(m)
  }
  const atom = (): Node => {
    const t = toks[pos++]
    if (t === undefined) fail('The formula ends too early')
    if (t.startsWith('V:')) return { k: 'var', name: t.slice(2) }
    if (t === '(') {
      const n = iff()
      if (toks[pos++] !== ')') fail('A bracket “(” is not closed')
      return n
    }
    return fail(t === ')' ? 'Unexpected “)”' : `A letter or “(” was expected before “${SYMBOL[t as Op] ?? t}”`)
  }
  const unary = (): Node => {
    if (peek() === 'not') {
      pos++
      return { k: 'not', a: unary() }
    }
    return atom()
  }
  const chain = (op: Op, next: () => Node) => (): Node => {
    let n = next()
    while (peek() === op) {
      pos++
      n = { k: 'bin', op, a: n, b: next() }
    }
    return n
  }
  const and = chain('and', unary)
  const or = chain('or', and)
  const imp = (): Node => {
    const a = or()
    if (peek() === 'imp') {
      pos++
      return { k: 'bin', op: 'imp', a, b: imp() }
    }
    return a
  }
  const iff = chain('iff', imp)
  try {
    const n = iff()
    if (pos < toks.length) return toks[pos] === ')' ? 'Unexpected “)”' : 'Two statements are placed side by side without a connective'
    return n
  } catch (e) {
    return (e as Error).message
  }
}

function show(n: Node, top = true): string {
  if (n.k === 'var') return n.name
  if (n.k === 'not') return '~' + show(n.a, false)
  const s = `${show(n.a, false)} ${SYMBOL[n.op]} ${show(n.b, false)}`
  return top ? s : `(${s})`
}

function evaluate(n: Node, env: Record<string, boolean>): boolean {
  if (n.k === 'var') return env[n.name]
  if (n.k === 'not') return !evaluate(n.a, env)
  const a = evaluate(n.a, env)
  const b = evaluate(n.b, env)
  return n.op === 'and' ? a && b : n.op === 'or' ? a || b : n.op === 'imp' ? !a || b : a === b
}

function vars(n: Node, out: Set<string>) {
  if (n.k === 'var') out.add(n.name)
  else if (n.k === 'not') vars(n.a, out)
  else {
    vars(n.a, out)
    vars(n.b, out)
  }
}

function subformulas(n: Node, out: Node[]) {
  if (n.k === 'var') return
  if (n.k === 'not') subformulas(n.a, out)
  else {
    subformulas(n.a, out)
    subformulas(n.b, out)
  }
  if (!out.some(x => show(x) === show(n))) out.push(n)
}

const MAX_VARS = 5

export default function TruthTable({
  title,
  formula,
  premises,
  conclusion,
}: {
  title?: string
  formula?: string
  premises?: string
  conclusion?: string
}) {
  const argumentMode = premises !== undefined || conclusion !== undefined
  const initial = { f: formula ?? 'p v ~p', p: premises ?? '', c: conclusion ?? '' }
  const [f, setF] = useState(initial.f)
  const [p, setP] = useState(initial.p)
  const [c, setC] = useState(initial.c)
  const focused = useRef<{ el: HTMLInputElement; set: (v: string) => void } | null>(null)

  const result = useMemo(() => {
    const sources = argumentMode ? [...p.split(';').map(s => s.trim()).filter(Boolean), c.trim()] : [f.trim()]
    const nodes: Node[] = []
    for (const [i, s] of sources.entries()) {
      const n = parse(s)
      if (typeof n === 'string') {
        const label = argumentMode ? (i === sources.length - 1 ? 'Conclusion' : `Premise ${i + 1}`) : 'Formula'
        return { error: `${label}: ${n}` }
      }
      nodes.push(n)
    }
    const set = new Set<string>()
    nodes.forEach(n => vars(n, set))
    const names = [...set].sort((a, b) => a.localeCompare(b))
    if (names.length > MAX_VARS) return { error: `Use at most ${MAX_VARS} different letters (this has ${names.length}).` }
    let columns: { label: string; node: Node; role: 'premise' | 'conclusion' | 'sub' | 'main' }[]
    if (argumentMode) {
      columns = nodes.map((n, i) => ({ label: show(n), node: n, role: i === nodes.length - 1 ? 'conclusion' : 'premise' }))
    } else {
      const subs: Node[] = []
      subformulas(nodes[0], subs)
      columns = subs.map(n => ({ label: show(n), node: n, role: show(n) === show(nodes[0]) ? 'main' : 'sub' }))
      if (!columns.length) columns = [{ label: show(nodes[0]), node: nodes[0], role: 'main' }]
    }
    const rows = Array.from({ length: 2 ** names.length }, (_, i) => {
      const env: Record<string, boolean> = {}
      names.forEach((v, j) => (env[v] = !((i >> (names.length - 1 - j)) & 1)))
      return { env, values: columns.map(col => evaluate(col.node, env)) }
    })
    return { names, columns, rows }
  }, [argumentMode, f, p, c])

  const insert = (sym: string) => {
    const t = focused.current
    if (!t) return
    const el = t.el
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const next = el.value.slice(0, start) + sym + el.value.slice(end)
    t.set(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + sym.length, start + sym.length)
    })
  }

  const input = (value: string, set: (v: string) => void, label: string, placeholder: string) => (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-navy/60 dark:text-white/60">{label}</span>
      <input
        value={value}
        onChange={e => set(e.target.value)}
        onFocus={e => (focused.current = { el: e.currentTarget, set })}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        className="mt-0.5 w-full rounded-lg border border-brand-navy/20 dark:border-white/20 bg-white dark:bg-brand-surface px-2.5 py-1.5 font-mono text-[14px] text-brand-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sky/60"
      />
    </label>
  )

  let verdict: React.ReactNode = null
  if (!('error' in result) && result.rows) {
    if (argumentMode) {
      const last = result.columns.length - 1
      const critical = result.rows.filter(r => r.values.slice(0, last).every(Boolean))
      const counter = critical.find(r => !r.values[last])
      verdict = counter ? (
        <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-[13px] text-rose-900 dark:text-rose-100">
          <b>Invalid.</b> In the row where {result.names.map(v => `${v} is ${counter.env[v] ? 'T' : 'F'}`).join(', ')}, every premise is true but the conclusion is false — a counterexample.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-[13px] text-emerald-900 dark:text-emerald-100">
          <b>Valid.</b> In every row where all the premises are true ({critical.length} {critical.length === 1 ? 'row' : 'rows'}, shaded), the conclusion is also true. No counterexample exists.
        </div>
      )
    } else {
      const main = result.columns.findIndex(col => col.role === 'main')
      const col = result.rows.map(r => r.values[main])
      const kind = col.every(Boolean) ? 'tautology' : col.every(v => !v) ? 'contradiction' : 'contingent'
      verdict = (
        <div className="rounded-xl border border-brand-deep/20 dark:border-brand-sky/30 bg-brand-sky/10 px-3 py-2 text-[13px]">
          {kind === 'tautology' && (
            <>
              <b>Tautology</b> — true in every row, so true by its form alone.
            </>
          )}
          {kind === 'contradiction' && (
            <>
              <b>Contradiction</b> — false in every row, so false by its form alone.
            </>
          )}
          {kind === 'contingent' && (
            <>
              <b>Contingent</b> — true in some rows and false in others; its truth depends on the facts.
            </>
          )}
        </div>
      )
    }
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔣 {title ?? 'Truth table'}</p>
        <button
          onClick={() => {
            setF(initial.f)
            setP(initial.p)
            setC(initial.c)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky underline"
        >
          Reset
        </button>
      </div>
      <div className="p-3 space-y-3">
        {argumentMode ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {input(p, setP, 'Premises (separate with ;)', 'p ⊃ q; p')}
            {input(c, setC, 'Conclusion', 'q')}
          </div>
        ) : (
          input(f, setF, 'Formula', 'p v ~p')
        )}
        <div className="flex flex-wrap gap-1.5">
          {[
            ['~', 'not'],
            ['·', 'and'],
            ['v', 'or'],
            ['⊃', 'if…then'],
            ['≡', 'if and only if'],
            ['(', ''],
            [')', ''],
          ].map(([s, name]) => (
            <button
              key={s}
              onMouseDown={e => e.preventDefault()}
              onClick={() => insert(s === 'v' ? ' v ' : s === '·' || s === '⊃' || s === '≡' ? ` ${s} ` : s)}
              title={name}
              className="min-w-[2.25rem] rounded-lg border border-brand-navy/15 dark:border-white/20 px-2 py-1 font-mono text-[14px] hover:bg-brand-sky/10"
            >
              {s}
            </button>
          ))}
        </div>
        {'error' in result ? (
          <p className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-[13px] text-rose-900 dark:text-rose-100">{result.error}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-brand-navy/10 dark:border-white/10">
              <table className="w-full border-collapse text-center font-mono text-[13px]">
                <thead>
                  <tr className="bg-brand-navy/5 dark:bg-white/5">
                    {result.names.map(v => (
                      <th key={v} className="px-2 py-1.5 font-semibold">
                        {v}
                      </th>
                    ))}
                    {result.columns.map((col, i) => (
                      <th
                        key={i}
                        className={`px-2 py-1.5 whitespace-nowrap ${i === 0 ? 'border-l-2 border-brand-navy/20 dark:border-white/20' : ''} ${
                          col.role === 'conclusion' || col.role === 'main' ? 'font-bold text-brand-deep dark:text-brand-sky' : 'font-semibold'
                        }`}
                      >
                        {argumentMode && <span className="block text-[10px] font-sans font-normal text-brand-navy/50 dark:text-white/50">{col.role === 'conclusion' ? 'conclusion' : `premise ${i + 1}`}</span>}
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, ri) => {
                    const last = result.columns.length - 1
                    const critical = argumentMode && r.values.slice(0, last).every(Boolean)
                    const counter = critical && !r.values[last]
                    return (
                      <tr
                        key={ri}
                        className={`border-t border-brand-navy/10 dark:border-white/10 ${counter ? 'bg-rose-100 dark:bg-rose-900/40' : critical ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                      >
                        {result.names.map(v => (
                          <td key={v} className="px-2 py-1 text-brand-navy/70 dark:text-white/70">
                            {r.env[v] ? 'T' : 'F'}
                          </td>
                        ))}
                        {r.values.map((val, i) => (
                          <td
                            key={i}
                            className={`px-2 py-1 ${i === 0 ? 'border-l-2 border-brand-navy/20 dark:border-white/20' : ''} ${val ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'} ${
                              result.columns[i].role === 'conclusion' || result.columns[i].role === 'main' ? 'font-bold' : ''
                            }`}
                          >
                            {val ? 'T' : 'F'}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {verdict}
          </>
        )}
      </div>
    </div>
  )
}
