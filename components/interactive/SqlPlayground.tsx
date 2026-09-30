'use client'

import { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Runs SQL in the browser with sql.js (see sqlEngine.ts). Lessons teach MySQL, so common
// MySQL-only commands are translated to SQLite equivalents first.
import { MSG, freshDb, loadSql, splitSql, toSqlite, type SqlDatabase, type SqlModule } from './sqlEngine'

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-sql' && typeof props.children === 'string') {
    out.push(props.children.replace(/\n$/, ''))
    return
  }
  collect(props.children, out)
}

type Result =
  | { kind: 'table'; sql: string; columns: string[]; rows: unknown[][]; truncated: boolean }
  | { kind: 'ok'; sql: string; text: string }
  | { kind: 'error'; sql: string; text: string }

const MAX_ROWS = 200

function short(sql: string) {
  const one = sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ').trim()
  return one.length > 70 ? one.slice(0, 67) + '…' : one
}

export default function SqlPlayground({ title, children }: { title?: string; children: React.ReactNode }) {
  const blocks = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    return out
  }, [children])
  const setup = blocks.length > 1 ? blocks[0] : ''
  const initialQuery = blocks[blocks.length - 1] ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Result[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const dbRef = useRef<SqlDatabase | null>(null)
  const sqlRef = useRef<SqlModule | null>(null)

  useEffect(() => {
    let alive = true
    loadSql()
      .then(SQL => {
        if (!alive) return
        sqlRef.current = SQL
        try {
          dbRef.current = freshDb(SQL, setup)
          setStatus('ready')
        } catch (e) {
          setResults([{ kind: 'error', sql: 'setup', text: (e as Error).message }])
          setStatus('failed')
        }
      })
      .catch(() => alive && setStatus('failed'))
    return () => {
      alive = false
      dbRef.current?.close()
      dbRef.current = null
    }
  }, [setup])

  const run = useCallback(() => {
    const db = dbRef.current
    if (!db) return
    const out: Result[] = []
    // Run statement by statement so each result is labelled with what the student actually typed.
    for (const original of splitSql(query)) {
      try {
        for (const stmt of db.iterateStatements(toSqlite(original))) {
          try {
            const columns = stmt.getColumnNames()
            const rows: unknown[][] = []
            let truncated = false
            while (stmt.step()) {
              if (rows.length < MAX_ROWS) rows.push(stmt.get())
              else truncated = true
            }
            if (columns.length === 1 && columns[0] === MSG) out.push({ kind: 'ok', sql: original, text: String(rows[0]?.[0] ?? '') })
            else if (columns.length) out.push({ kind: 'table', sql: original, columns, rows, truncated })
            else {
              const n = db.getRowsModified()
              const verb = /^\s*(INSERT|UPDATE|DELETE|REPLACE|TRUNCATE)/i.test(original) ? `${n} row${n === 1 ? '' : 's'} affected` : 'OK'
              out.push({ kind: 'ok', sql: original, text: `Query OK — ${verb}` })
            }
          } finally {
            stmt.free()
          }
        }
      } catch (e) {
        out.push({ kind: 'error', sql: original, text: (e as Error).message })
        break
      }
    }
    if (!out.length) out.push({ kind: 'ok', sql: '', text: 'Nothing to run — type an SQL statement ending with ;' })
    setResults(out)
  }, [query])

  const reset = () => {
    if (!sqlRef.current) return
    dbRef.current?.close()
    dbRef.current = freshDb(sqlRef.current, setup)
    setQuery(initialQuery)
    setResults([])
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🗄 {title ?? 'SQL playground'}</p>
        <p className="text-[10.5px] text-brand-navy/45 dark:text-white/40 text-right">Runs in your browser</p>
      </div>

      {setup && (
        <details className="mx-4 mt-2 rounded-lg bg-brand-soft dark:bg-brand-bg/60 px-3 py-2">
          <summary className="cursor-pointer text-[11.5px] font-semibold text-brand-navy/70 dark:text-white/70">Starting tables (already created for you)</summary>
          <pre className="mt-2 overflow-x-auto text-[11.5px] leading-relaxed font-mono text-brand-navy/80 dark:text-white/75 whitespace-pre">{setup}</pre>
        </details>
      )}

      <div className="px-3 pt-3">
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              run()
            }
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="SQL query"
          rows={Math.min(14, Math.max(3, query.split('\n').length + 1))}
          className="block w-full resize-y rounded-lg bg-[#021037] text-[#e2e8f0] font-mono text-[12.5px] leading-relaxed px-4 py-3 outline-none"
        />
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-brand-navy/10 dark:border-brand-cyan/10">
        <button onClick={run} disabled={status !== 'ready'} className="px-4 py-1.5 rounded-lg bg-brand-gradient text-white text-[12px] font-bold disabled:opacity-50">
          {status === 'loading' ? 'Loading…' : 'Run ▶'}
        </button>
        <button onClick={reset} disabled={status !== 'ready'} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky disabled:opacity-50">
          Reset data
        </button>
        <p className="ml-auto text-[10px] text-brand-navy/40 dark:text-white/35">Changes persist until Reset</p>
      </div>

      <div className="p-3 bg-brand-soft dark:bg-brand-bg/60 space-y-2.5">
        {status === 'failed' && <p className="text-[12px] text-red-600 dark:text-red-300">The SQL engine could not start in this browser.</p>}
        {status !== 'failed' && results.length === 0 && (
          <p className="text-[12px] text-brand-navy/45 dark:text-white/40">Press Run to execute the query. Separate statements with ;</p>
        )}
        {results.map((r, i) => (
          <div key={i}>
            {r.sql && <p className="font-mono text-[10.5px] text-brand-navy/45 dark:text-white/40 mb-1 truncate">› {short(r.sql)}</p>}
            {r.kind === 'table' ? (
              <div className="overflow-x-auto rounded-lg border border-brand-navy/10 dark:border-white/10 bg-white dark:bg-brand-surface">
                <table className="min-w-full text-[11.5px]">
                  <thead>
                    <tr>
                      {r.columns.map(c => (
                        <th key={c} className="px-2.5 py-1.5 text-left font-semibold bg-brand-mist dark:bg-brand-slate whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((row, j) => (
                      <tr key={j} className="border-t border-brand-navy/5 dark:border-white/5">
                        {row.map((v, k) => (
                          <td key={k} className="px-2.5 py-1.5 whitespace-nowrap font-mono text-brand-navy/80 dark:text-white/80">
                            {v === null ? <span className="italic text-brand-navy/35 dark:text-white/35">NULL</span> : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-2.5 py-1 text-[10px] text-brand-navy/45 dark:text-white/40 border-t border-brand-navy/5 dark:border-white/5">
                  {r.rows.length === 0 ? 'Empty set (0 rows)' : `${r.rows.length}${r.truncated ? '+' : ''} row${r.rows.length === 1 ? '' : 's'}`}
                </p>
              </div>
            ) : (
              <p className={`text-[12px] font-mono ${r.kind === 'error' ? 'text-red-600 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                {r.kind === 'error' ? '✗ Error: ' : '✓ '}
                {r.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
