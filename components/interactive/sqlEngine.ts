// Shared SQL engine for the SQL and PHP playgrounds: sql.js (SQLite compiled to WebAssembly, vendored in
// /public/sqljs) plus a translation layer so lessons can use MySQL syntax.

export interface SqlStatement {
  getColumnNames(): string[]
  step(): boolean
  get(): unknown[]
  bind(values: unknown[] | Record<string, unknown>): boolean
  free(): void
}
export interface SqlDatabase {
  run(sql: string): void
  exec(sql: string): { columns: string[]; values: unknown[][] }[]
  prepare(sql: string): SqlStatement
  iterateStatements(sql: string): Iterable<SqlStatement>
  getRowsModified(): number
  create_function(name: string, fn: (...args: unknown[]) => unknown): void
  close(): void
}
export interface SqlModule {
  Database: new () => SqlDatabase
}
declare global {
  interface Window {
    initSqlJs?: (config: { locateFile: (f: string) => string }) => Promise<SqlModule>
  }
}

let sqlModule: Promise<SqlModule> | null = null
export function loadSql(): Promise<SqlModule> {
  if (sqlModule) return sqlModule
  sqlModule = new Promise<void>((resolve, reject) => {
    if (window.initSqlJs) return resolve()
    const s = document.createElement('script')
    s.src = '/sqljs/sql-wasm-browser.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load the SQL engine'))
    document.head.appendChild(s)
  }).then(() => window.initSqlJs!({ locateFile: f => `/sqljs/${f}` }))
  sqlModule.catch(() => (sqlModule = null))
  return sqlModule
}

export const MSG = '__msg'

// Split a script into statements on semicolons outside quotes and comments, keeping
// CREATE TRIGGER … BEGIN … END; bodies together. Each statement keeps its trailing ';'.
export function splitSql(sql: string): string[] {
  const out: string[] = []
  let cur = ''
  let i = 0
  let depth = 0
  while (i < sql.length) {
    const c = sql[i]
    const two = sql.slice(i, i + 2)
    if (c === "'" || c === '"' || c === '`') {
      const end = sql.indexOf(c, i + 1)
      const j = end === -1 ? sql.length : end + 1
      cur += sql.slice(i, j)
      i = j
      continue
    }
    if (two === '--' || c === '#') {
      const end = sql.indexOf('\n', i)
      const j = end === -1 ? sql.length : end
      cur += sql.slice(i, j)
      i = j
      continue
    }
    if (two === '/*') {
      const end = sql.indexOf('*/', i + 2)
      const j = end === -1 ? sql.length : end + 2
      cur += sql.slice(i, j)
      i = j
      continue
    }
    const word = /^[A-Za-z_]+/.exec(sql.slice(i))?.[0]
    if (word && !/[A-Za-z0-9_]/.test(sql[i - 1] ?? '')) {
      const w = word.toUpperCase()
      if (w === 'BEGIN' && /CREATE\s+(TEMP\w*\s+)?TRIGGER/i.test(cur)) depth++
      else if (w === 'END' && depth > 0) depth--
      cur += word
      i += word.length
      continue
    }
    cur += c
    i++
    if (c === ';' && depth === 0) {
      out.push(cur)
      cur = ''
    }
  }
  out.push(cur)
  // Drop pieces that hold only whitespace/comments.
  return out.map(s => s.trim()).filter(s => s.replace(/--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//g, '').replace(/[\s;]/g, '') !== '')
}

// Translate one statement from MySQL dialect to SQLite.
export function toSqlite(statement: string): string {
  // Leading comments would stop the start-of-statement patterns from matching, so set them aside.
  const lead = /^(?:\s*(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/))*/.exec(statement)?.[0] ?? ''
  const sql = statement.slice(lead.length)
  const start = '(^|;)(\\s*)'
  const rx = (body: string) => new RegExp(start + body, 'gi')
  return (
    lead +
    sql
      .replace(rx('CREATE\\s+DATABASE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(\\w+)\\s*;?'), `$1$2SELECT 'Database $3 created' AS ${MSG};`)
      .replace(rx('DROP\\s+DATABASE\\s+(?:IF\\s+EXISTS\\s+)?(\\w+)\\s*;?'), `$1$2SELECT 'Database $3 dropped' AS ${MSG};`)
      .replace(rx('USE\\s+(\\w+)\\s*;?'), `$1$2SELECT 'Database changed to $3' AS ${MSG};`)
      .replace(rx('SHOW\\s+DATABASES\\s*;?'), `$1$2SELECT 'This playground has one database' AS ${MSG};`)
      .replace(rx('SHOW\\s+TABLES\\s*;?'), `$1$2SELECT name AS Tables FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`)
      .replace(
        rx('(?:DESCRIBE|DESC)\\s+(\\w+)\\s*;?'),
        `$1$2SELECT name AS Field, type AS Type, CASE WHEN "notnull" THEN 'NO' ELSE 'YES' END AS "Null", CASE WHEN pk THEN 'PRI' ELSE '' END AS "Key", dflt_value AS "Default" FROM pragma_table_info('$3');`
      )
      .replace(rx('START\\s+TRANSACTION\\b'), '$1$2BEGIN TRANSACTION')
      .replace(rx('TRUNCATE\\s+(?:TABLE\\s+)?(\\w+)'), '$1$2DELETE FROM $3')
      .replace(/\b(?:TINY|SMALL|MEDIUM|BIG)?INT(?:EGER)?(?:\s*\(\d+\))?(?:\s+UNSIGNED)?([^,\n]*?)\s+AUTO_INCREMENT\b/gi, 'INTEGER$1')
      .replace(/\bENUM\s*\([^)]*\)/gi, 'TEXT')
      .replace(/\)((?:\s*(?:ENGINE|(?:DEFAULT\s+)?CHARSET|(?:DEFAULT\s+)?CHARACTER\s+SET|COLLATE|AUTO_INCREMENT)\s*=?\s*\w+)+)\s*;/gi, ');')
  )
}

export function freshDb(SQL: SqlModule, setup: string): SqlDatabase {
  const db = new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = () => {
    const d = new Date()
    return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
  }
  db.create_function('NOW', () => `${now().date} ${now().time}`)
  db.create_function('CURDATE', () => now().date)
  db.create_function('CURTIME', () => now().time)
  for (const s of splitSql(setup)) db.exec(toSqlite(s))
  return db
}

export interface SqlCallResult {
  columns?: string[]
  rows?: unknown[][]
  affected?: number
  insertId?: number
  error?: string
  errno?: number
  sqlstate?: string
  errclass?: string
}

// Present SQLite errors the way MySQL would phrase them, since the lessons teach MySQL.
function mysqlError(message: string): Required<Pick<SqlCallResult, 'error' | 'errno' | 'sqlstate' | 'errclass'>> {
  let m: RegExpExecArray | null
  if ((m = /UNIQUE constraint failed: ([\w.]+)/.exec(message)))
    return { error: `Duplicate entry for key '${m[1]}'`, errno: 1062, sqlstate: '23000', errclass: 'Integrity constraint violation' }
  if ((m = /NOT NULL constraint failed: \w+\.(\w+)/.exec(message)))
    return { error: `Column '${m[1]}' cannot be null`, errno: 1048, sqlstate: '23000', errclass: 'Integrity constraint violation' }
  if (/FOREIGN KEY constraint failed/.test(message))
    return { error: 'Cannot add, update or delete a row: a foreign key constraint fails', errno: 1452, sqlstate: '23000', errclass: 'Integrity constraint violation' }
  if ((m = /no such table: ([\w.]+)/.exec(message))) return { error: `Table '${m[1]}' doesn't exist`, errno: 1146, sqlstate: '42S02', errclass: 'Base table or view not found' }
  if ((m = /no such column: ([\w.]+)/.exec(message))) return { error: `Unknown column '${m[1]}' in 'field list'`, errno: 1054, sqlstate: '42S22', errclass: 'Column not found' }
  if ((m = /table (\w+) already exists/.exec(message))) return { error: `Table '${m[1]}' already exists`, errno: 1050, sqlstate: '42S01', errclass: 'Base table or view already exists' }
  if ((m = /near "([^"]*)": syntax error/.exec(message)) || /incomplete input/.test(message))
    return {
      error: `You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${m?.[1] ?? ''}'`,
      errno: 1064,
      sqlstate: '42000',
      errclass: 'Syntax error or access violation',
    }
  return { error: message, errno: 2000, sqlstate: 'HY000', errclass: 'General error' }
}

// Run one or more statements with optional bound parameters (positional array or named object).
// Results describe the last statement, like a MySQL client call would.
export function runSql(db: SqlDatabase, sql: string, params: unknown): SqlCallResult {
  const statements = splitSql(sql)
  if (statements.length === 0) return mysqlError('near "": syntax error')
  let result: SqlCallResult = { columns: [], rows: [], affected: 0 }
  try {
    statements.forEach((s, idx) => {
      const stmt = db.prepare(toSqlite(s))
      try {
        if (idx === statements.length - 1 && params && (Array.isArray(params) ? params.length : Object.keys(params as object).length)) {
          if (Array.isArray(params)) stmt.bind(params.map(v => (typeof v === 'boolean' ? Number(v) : v)))
          else {
            const named: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(params as Record<string, unknown>)) named[/^[:@$]/.test(k) ? k : ':' + k] = typeof v === 'boolean' ? Number(v) : v
            stmt.bind(named)
          }
        }
        const columns = stmt.getColumnNames()
        const rows: unknown[][] = []
        while (stmt.step()) rows.push(stmt.get().map(v => (v instanceof Uint8Array ? new TextDecoder().decode(v) : v)))
        const isWrite = /^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(s)
        result = { columns, rows, affected: isWrite ? db.getRowsModified() : rows.length }
        if (/^\s*(INSERT|REPLACE)/i.test(s)) result.insertId = Number(db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] ?? 0)
      } finally {
        stmt.free()
      }
    })
  } catch (e) {
    return mysqlError((e as Error).message)
  }
  return result
}
