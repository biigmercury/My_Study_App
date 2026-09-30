// A small Excel-compatible formula engine for the CSC 272 spreadsheet lessons.
// Covers what the course teaches: cell/range references (relative, absolute, cross-sheet),
// operator precedence, the common functions, error values, criteria matching (COUNTIF family)
// and reference adjustment when formulas are copied or rows/columns are inserted/deleted.

export class XlError {
  constructor(readonly code: string) {}
  toString() {
    return this.code
  }
}

export const ERR = {
  div0: new XlError('#DIV/0!'),
  value: new XlError('#VALUE!'),
  name: new XlError('#NAME?'),
  ref: new XlError('#REF!'),
  na: new XlError('#N/A'),
  num: new XlError('#NUM!'),
}

export type Scalar = number | string | boolean | XlError | null
export const isErr = (v: unknown): v is XlError => v instanceof XlError

export interface RangeRef {
  kind: 'range'
  sheet: string
  r1: number
  c1: number
  r2: number
  c2: number
}
type Value = Scalar | RangeRef
const isRange = (v: unknown): v is RangeRef => typeof v === 'object' && v !== null && (v as RangeRef).kind === 'range'

// ---------- addresses ----------

export function colName(c: number): string {
  let s = ''
  let n = c + 1
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function colIndex(name: string): number {
  let n = 0
  for (const ch of name.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

export const cellKey = (r: number, c: number) => `${r},${c}`
export const addr = (r: number, c: number) => colName(c) + (r + 1)

export function parseAddr(text: string): { r: number; c: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(text.trim())
  if (!m) return null
  const r = parseInt(m[2], 10) - 1
  if (r < 0) return null
  return { r, c: colIndex(m[1]) }
}

export function quoteSheet(name: string) {
  return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(name) && !/^[A-Za-z]{1,3}\d+$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`
}

export const sameSheet = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

const unquote = (s: string) => (s.startsWith("'") ? s.slice(1, -1).replace(/''/g, "'") : s)

// ---------- tokenizer ----------

export type Tok =
  | { t: 'ws' | 'op' | 'lp' | 'rp' | 'comma'; s: number; e: number; v: string }
  | { t: 'num'; s: number; e: number; v: string; n: number }
  | { t: 'str'; s: number; e: number; v: string; text: string }
  | { t: 'bool'; s: number; e: number; v: string; b: boolean }
  | { t: 'err'; s: number; e: number; v: string }
  | { t: 'func' | 'name'; s: number; e: number; v: string; name: string }
  | { t: 'ref'; s: number; e: number; v: string; sheet?: string; col: number; row: number; colAbs: boolean; rowAbs: boolean }
  | { t: 'colrange'; s: number; e: number; v: string; sheet?: string; c1: number; c2: number; abs1: boolean; abs2: boolean }

const SHEET = `('(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_.]*)!`
const RX = {
  ws: /\s+/y,
  str: /"(?:[^"]|"")*"/y,
  err: /#(?:DIV\/0!|VALUE!|REF!|NAME\?|N\/A|NUM!|NULL!)/y,
  num: /(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y,
  ref: new RegExp(`(?:${SHEET})?(\\$?)([A-Za-z]{1,3})(\\$?)(\\d+)(?![A-Za-z0-9_(!])`, 'y'),
  colrange: new RegExp(`(?:${SHEET})?(\\$?)([A-Za-z]{1,3}):(\\$?)([A-Za-z]{1,3})(?![A-Za-z0-9_(!])`, 'y'),
  func: /([A-Za-z_][A-Za-z0-9_.]*)\s*\(/y,
  bool: /(TRUE|FALSE)(?![A-Za-z0-9_(!])/iy,
  name: /[A-Za-z_][A-Za-z0-9_.]*/y,
  op: /<>|<=|>=|[-+*/^&=<>%:]/y,
}

function match(re: RegExp, src: string, i: number) {
  re.lastIndex = i
  return re.exec(src)
}

// Tokenises the text after the leading "=".
export function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    let m: RegExpExecArray | null
    if ((m = match(RX.ws, src, i))) {
      out.push({ t: 'ws', s: i, e: i + m[0].length, v: m[0] })
    } else if (ch === '(') {
      out.push({ t: 'lp', s: i, e: i + 1, v: ch })
    } else if (ch === ')') {
      out.push({ t: 'rp', s: i, e: i + 1, v: ch })
    } else if (ch === ',') {
      out.push({ t: 'comma', s: i, e: i + 1, v: ch })
    } else if ((m = match(RX.str, src, i))) {
      out.push({ t: 'str', s: i, e: i + m[0].length, v: m[0], text: m[0].slice(1, -1).replace(/""/g, '"') })
    } else if ((m = match(RX.err, src, i))) {
      out.push({ t: 'err', s: i, e: i + m[0].length, v: m[0] })
    } else if ((m = match(RX.num, src, i))) {
      out.push({ t: 'num', s: i, e: i + m[0].length, v: m[0], n: parseFloat(m[0]) })
    } else if ((m = match(RX.bool, src, i)) && !/^[A-Za-z]{1,3}\d/.test(src.slice(i))) {
      out.push({ t: 'bool', s: i, e: i + m[0].length, v: m[0], b: m[1].toUpperCase() === 'TRUE' })
    } else if ((m = match(RX.ref, src, i))) {
      out.push({
        t: 'ref',
        s: i,
        e: i + m[0].length,
        v: m[0],
        sheet: m[1] ? unquote(m[1]) : undefined,
        colAbs: m[2] === '$',
        col: colIndex(m[3]),
        rowAbs: m[4] === '$',
        row: parseInt(m[5], 10) - 1,
      })
    } else if ((m = match(RX.colrange, src, i))) {
      out.push({ t: 'colrange', s: i, e: i + m[0].length, v: m[0], sheet: m[1] ? unquote(m[1]) : undefined, abs1: m[2] === '$', c1: colIndex(m[3]), abs2: m[4] === '$', c2: colIndex(m[5]) })
    } else if ((m = match(RX.func, src, i))) {
      out.push({ t: 'func', s: i, e: i + m[0].length, v: m[0], name: m[1].toUpperCase() })
    } else if ((m = match(RX.name, src, i))) {
      out.push({ t: 'name', s: i, e: i + m[0].length, v: m[0], name: m[0] })
    } else if ((m = match(RX.op, src, i))) {
      out.push({ t: 'op', s: i, e: i + m[0].length, v: m[0] })
    } else {
      throw new SyntaxError(`Unexpected character "${ch}"`)
    }
    i = out[out.length - 1].e
  }
  return out
}

// ---------- parser ----------

export type Node =
  | { k: 'num'; n: number }
  | { k: 'str'; s: string }
  | { k: 'bool'; b: boolean }
  | { k: 'err'; e: XlError }
  | { k: 'ref'; sheet?: string; r: number; c: number }
  | { k: 'range'; sheet?: string; r1: number; c1: number; r2: number; c2: number }
  | { k: 'colrange'; sheet?: string; c1: number; c2: number }
  | { k: 'name'; name: string }
  | { k: 'un'; op: string; a: Node }
  | { k: 'pct'; a: Node }
  | { k: 'bin'; op: string; a: Node; b: Node }
  | { k: 'call'; name: string; args: (Node | null)[] }

const INFIX: Record<string, number> = { '=': 10, '<>': 10, '<': 10, '>': 10, '<=': 10, '>=': 10, '&': 20, '+': 30, '-': 30, '*': 40, '/': 40, '^': 50 }

export function parseFormula(body: string): Node {
  const toks = tokenize(body).filter(t => t.t !== 'ws')
  let p = 0
  const peek = () => toks[p]
  const fail = (msg = 'There’s a problem with this formula.') => {
    throw new SyntaxError(msg)
  }

  const expr = (minBp: number): Node => {
    let lhs = prefix()
    for (;;) {
      const t = peek()
      if (!t) break
      if (t.t === 'op' && t.v === '%') {
        p++
        lhs = { k: 'pct', a: lhs }
        continue
      }
      if (t.t !== 'op' || !(t.v in INFIX)) break
      const bp = INFIX[t.v]
      if (bp <= minBp) break
      p++
      lhs = { k: 'bin', op: t.v, a: lhs, b: expr(bp) }
    }
    return lhs
  }

  const prefix = (): Node => {
    const t = toks[p++]
    if (!t) return fail()
    switch (t.t) {
      case 'num':
        return { k: 'num', n: t.n }
      case 'str':
        return { k: 'str', s: t.text }
      case 'bool':
        return { k: 'bool', b: t.b }
      case 'err':
        return { k: 'err', e: new XlError(t.v) }
      case 'name':
        return { k: 'name', name: t.name }
      case 'colrange':
        return { k: 'colrange', sheet: t.sheet, c1: Math.min(t.c1, t.c2), c2: Math.max(t.c1, t.c2) }
      case 'ref': {
        const n = toks[p]
        const n2 = toks[p + 1]
        if (n && n.t === 'op' && n.v === ':' && n2 && n2.t === 'ref') {
          p += 2
          return { k: 'range', sheet: t.sheet, r1: Math.min(t.row, n2.row), c1: Math.min(t.col, n2.col), r2: Math.max(t.row, n2.row), c2: Math.max(t.col, n2.col) }
        }
        return { k: 'ref', sheet: t.sheet, r: t.row, c: t.col }
      }
      case 'lp': {
        const e = expr(0)
        if (peek()?.t !== 'rp') fail('Missing closing bracket )')
        p++
        return e
      }
      case 'op':
        if (t.v === '-' || t.v === '+') return { k: 'un', op: t.v, a: expr(65) }
        return fail()
      case 'func': {
        const args: (Node | null)[] = []
        if (peek()?.t === 'rp') {
          p++
          return { k: 'call', name: t.name, args }
        }
        for (;;) {
          const n = peek()
          if (!n) fail('Missing closing bracket )')
          if (n.t === 'comma' || n.t === 'rp') args.push(null)
          else args.push(expr(0))
          const sep = toks[p++]
          if (!sep) fail('Missing closing bracket )')
          if (sep.t === 'rp') break
          if (sep.t !== 'comma') fail()
        }
        return { k: 'call', name: t.name, args }
      }
      default:
        return fail()
    }
  }

  const tree = expr(0)
  if (p < toks.length) fail()
  return tree
}

// ---------- coercion ----------

export function numericText(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const pct = t.endsWith('%')
  const core = (pct ? t.slice(0, -1) : t).replace(/^₦/, '').replace(/,(?=\d{3}(\D|$))/g, '')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(core)) return null
  const n = parseFloat(core)
  return pct ? n / 100 : n
}

export function toNum(v: Scalar): number | XlError {
  if (v === null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (isErr(v)) return v
  const n = numericText(v)
  return n === null ? ERR.value : n
}

export function numToText(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n)
  return String(Number(n.toPrecision(15)))
}

export function toText(v: Scalar): string | XlError {
  if (v === null) return ''
  if (typeof v === 'number') return numToText(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return v
}

function toBool(v: Scalar): boolean | XlError {
  if (v === null) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (isErr(v)) return v
  const u = v.toUpperCase()
  if (u === 'TRUE') return true
  if (u === 'FALSE') return false
  return ERR.value
}

const typeRank = (v: Scalar) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2)

// Excel ordering: numbers < text < logicals; text compares case-insensitively.
function compare(a: Scalar, b: Scalar): number {
  if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0
  if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0
  const ra = typeRank(a)
  const rb = typeRank(b)
  if (ra !== rb) return ra - rb
  if (typeof a === 'string') {
    const x = a.toLowerCase()
    const y = (b as string).toLowerCase()
    return x < y ? -1 : x > y ? 1 : 0
  }
  const x = Number(a)
  const y = Number(b)
  return x < y ? -1 : x > y ? 1 : 0
}

function wildcard(pattern: string) {
  let re = ''
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (ch === '~' && i + 1 < pattern.length) re += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    else if (ch === '*') re += '[\\s\\S]*'
    else if (ch === '?') re += '[\\s\\S]'
    else re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${re}$`, 'i')
}

// Criteria for COUNTIF, COUNTIFS, SUMIF, AVERAGEIF: 50, ">=50", "<>Passed", "A*", "".
export function criteria(c: Scalar): (v: Scalar) => boolean {
  if (typeof c === 'number') return v => (typeof v === 'number' ? v === c : typeof v === 'string' && numericText(v) === c)
  if (typeof c === 'boolean') return v => v === c
  if (c === null) return v => v === null || v === ''
  if (isErr(c)) return v => isErr(v) && v.code === c.code
  const m = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(c)!
  const op = m[1] || '='
  const rest = m[2]
  const n = numericText(rest)
  const cmp = (x: number) => (op === '<' ? x < 0 : op === '>' ? x > 0 : op === '<=' ? x <= 0 : op === '>=' ? x >= 0 : op === '=' ? x === 0 : x !== 0)
  if (n !== null) {
    return v => {
      const vn = typeof v === 'number' ? v : op === '=' || op === '<>' ? (typeof v === 'string' ? numericText(v) : null) : null
      if (vn === null) return op === '<>'
      return cmp(vn - n)
    }
  }
  const up = rest.toUpperCase()
  if (up === 'TRUE' || up === 'FALSE') {
    const b = up === 'TRUE'
    return v => (typeof v === 'boolean' ? cmp(Number(v) - Number(b)) : op === '<>')
  }
  if (rest === '') {
    if (op === '=') return v => v === null || v === ''
    if (op === '<>') return v => !(v === null || v === '')
  }
  if (op === '=' || op === '<>') {
    const re = wildcard(rest)
    return v => {
      const hit = typeof v === 'string' && re.test(v)
      return op === '=' ? hit : !hit
    }
  }
  return v => typeof v === 'string' && cmp(compare(v, rest))
}

// ---------- evaluation ----------

export interface EvalCtx {
  sheet: string
  get(sheet: string, r: number, c: number): Scalar
  hasSheet(sheet: string): boolean
  usedRows(sheet: string): number
}

function rangeValues(ctx: EvalCtx, r: RangeRef): Scalar[][] {
  const out: Scalar[][] = []
  for (let i = r.r1; i <= r.r2; i++) {
    const row: Scalar[] = []
    for (let j = r.c1; j <= r.c2; j++) row.push(ctx.get(r.sheet, i, j))
    out.push(row)
  }
  return out
}

function scalar(ctx: EvalCtx, v: Value): Scalar {
  if (!isRange(v)) return v
  if (v.r1 === v.r2 && v.c1 === v.c2) return ctx.get(v.sheet, v.r1, v.c1)
  return ERR.value
}

export function evaluate(node: Node, ctx: EvalCtx): Value {
  switch (node.k) {
    case 'num':
      return node.n
    case 'str':
      return node.s
    case 'bool':
      return node.b
    case 'err':
      return node.e
    case 'name':
      return ERR.name
    case 'ref': {
      const sheet = node.sheet ?? ctx.sheet
      if (!ctx.hasSheet(sheet)) return ERR.ref
      return ctx.get(sheet, node.r, node.c)
    }
    case 'range': {
      const sheet = node.sheet ?? ctx.sheet
      if (!ctx.hasSheet(sheet)) return ERR.ref
      return { kind: 'range', sheet, r1: node.r1, c1: node.c1, r2: node.r2, c2: node.c2 }
    }
    case 'colrange': {
      const sheet = node.sheet ?? ctx.sheet
      if (!ctx.hasSheet(sheet)) return ERR.ref
      return { kind: 'range', sheet, r1: 0, c1: node.c1, r2: Math.max(0, ctx.usedRows(sheet) - 1), c2: node.c2 }
    }
    case 'un': {
      const a = toNum(scalar(ctx, evaluate(node.a, ctx)))
      if (isErr(a)) return a
      return node.op === '-' ? -a : a
    }
    case 'pct': {
      const a = toNum(scalar(ctx, evaluate(node.a, ctx)))
      return isErr(a) ? a : a / 100
    }
    case 'bin':
      return binary(node.op, scalar(ctx, evaluate(node.a, ctx)), scalar(ctx, evaluate(node.b, ctx)))
    case 'call':
      return call(node.name, node.args, ctx)
  }
}

function binary(op: string, a: Scalar, b: Scalar): Scalar {
  if (isErr(a)) return a
  if (isErr(b)) return b
  if (op === '&') {
    return (toText(a) as string) + (toText(b) as string)
  }
  if (['=', '<>', '<', '>', '<=', '>='].includes(op)) {
    const d = compare(a, b)
    return op === '=' ? d === 0 : op === '<>' ? d !== 0 : op === '<' ? d < 0 : op === '>' ? d > 0 : op === '<=' ? d <= 0 : d >= 0
  }
  const x = toNum(a)
  if (isErr(x)) return x
  const y = toNum(b)
  if (isErr(y)) return y
  switch (op) {
    case '+':
      return x + y
    case '-':
      return x - y
    case '*':
      return x * y
    case '/':
      return y === 0 ? ERR.div0 : x / y
    case '^': {
      if (x === 0 && y === 0) return ERR.num
      const r = Math.pow(x, y)
      return Number.isFinite(r) ? r : ERR.num
    }
  }
  return ERR.value
}

// Collects numbers the way SUM/AVERAGE/MAX/MIN do: from ranges only real numbers count,
// typed-in arguments are coerced (so =SUM("3",TRUE) is 4).
function numbers(ctx: EvalCtx, args: (Node | null)[]): number[] | XlError {
  const out: number[] = []
  for (const a of args) {
    if (!a) continue
    const v = evaluate(a, ctx)
    if (isRange(v)) {
      for (const row of rangeValues(ctx, v))
        for (const x of row) {
          if (isErr(x)) return x
          if (typeof x === 'number') out.push(x)
        }
    } else {
      if (v === null) continue
      const n = toNum(v)
      if (isErr(n)) return n
      out.push(n)
    }
  }
  return out
}

function flatValues(ctx: EvalCtx, args: (Node | null)[]): { v: Scalar; direct: boolean }[] {
  const out: { v: Scalar; direct: boolean }[] = []
  for (const a of args) {
    if (!a) {
      out.push({ v: null, direct: true })
      continue
    }
    const v = evaluate(a, ctx)
    if (isRange(v)) for (const row of rangeValues(ctx, v)) for (const x of row) out.push({ v: x, direct: false })
    else out.push({ v, direct: true })
  }
  return out
}

const FUNCS = new Set([
  'SUM', 'AVERAGE', 'COUNT', 'COUNTA', 'COUNTBLANK', 'MAX', 'MIN', 'MEDIAN', 'PRODUCT', 'IF', 'IFERROR', 'AND', 'OR', 'NOT',
  'COUNTIF', 'COUNTIFS', 'SUMIF', 'SUMIFS', 'AVERAGEIF', 'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'INT', 'ABS', 'SQRT', 'POWER', 'MOD',
  'PI', 'LEFT', 'RIGHT', 'MID', 'LEN', 'UPPER', 'LOWER', 'PROPER', 'TRIM', 'CONCATENATE', 'CONCAT', 'TODAY', 'NOW', 'RAND',
  'RANDBETWEEN', 'VLOOKUP', 'HLOOKUP', 'RANK', 'RANK.EQ', 'TRUE', 'FALSE', 'ISBLANK', 'ISNUMBER', 'ISTEXT', 'VALUE', 'YEAR',
  'MONTH', 'DAY', 'MODE', 'MODE.SNGL', 'STDEV', 'STDEV.S', 'STDEV.P', 'VAR', 'VAR.S', 'VAR.P', 'CORREL', 'PEARSON',
])
export const FUNCTION_NAMES = [...FUNCS].sort()
export const VOLATILE = new Set(['TODAY', 'NOW', 'RAND', 'RANDBETWEEN'])

function roundTo(x: number, d: number, mode: 'round' | 'up' | 'down') {
  const f = Math.pow(10, d)
  const y = Math.abs(x) * f
  const eps = 1e-9
  const r = mode === 'round' ? Math.floor(y + 0.5 + eps) : mode === 'up' ? Math.ceil(y - eps) : Math.floor(y + eps)
  return (Math.sign(x) * r) / f
}

export function serialToDate(serial: number) {
  const ms = Math.round((serial - 25569) * 86400000)
  return new Date(ms)
}
export function dateToSerial(d: Date) {
  return Math.floor(d.getTime() / 86400000 - d.getTimezoneOffset() / 1440) + 25569
}

function call(name: string, args: (Node | null)[], ctx: EvalCtx): Value {
  if (!FUNCS.has(name)) return ERR.name
  const arg = (i: number): Scalar => (args[i] ? scalar(ctx, evaluate(args[i] as Node, ctx)) : null)
  const numArg = (i: number, dflt?: number): number | XlError => (args[i] ? toNum(arg(i)) : dflt ?? 0)
  const textArg = (i: number): string | XlError => toText(arg(i))
  const need = (min: number, max = min) => args.length >= min && args.length <= max
  const range = (i: number): RangeRef | null => {
    const n = args[i]
    if (n && n.k === 'ref') {
      const sheet = n.sheet ?? ctx.sheet
      return ctx.hasSheet(sheet) ? { kind: 'range', sheet, r1: n.r, c1: n.c, r2: n.r, c2: n.c } : null
    }
    const v = n ? evaluate(n, ctx) : null
    return isRange(v) ? v : null
  }

  switch (name) {
    case 'SUM': {
      const ns = numbers(ctx, args)
      return isErr(ns) ? ns : ns.reduce((s, x) => s + x, 0)
    }
    case 'PRODUCT': {
      const ns = numbers(ctx, args)
      return isErr(ns) ? ns : ns.length ? ns.reduce((s, x) => s * x, 1) : 0
    }
    case 'AVERAGE': {
      const ns = numbers(ctx, args)
      if (isErr(ns)) return ns
      return ns.length ? ns.reduce((s, x) => s + x, 0) / ns.length : ERR.div0
    }
    case 'MAX':
    case 'MIN': {
      const ns = numbers(ctx, args)
      if (isErr(ns)) return ns
      return ns.length ? (name === 'MAX' ? Math.max(...ns) : Math.min(...ns)) : 0
    }
    case 'MEDIAN': {
      const ns = numbers(ctx, args)
      if (isErr(ns)) return ns
      if (!ns.length) return ERR.num
      const s = [...ns].sort((a, b) => a - b)
      const m = s.length >> 1
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
    }
    case 'MODE':
    case 'MODE.SNGL': {
      const ns = numbers(ctx, args)
      if (isErr(ns)) return ns
      const counts = new Map<number, number>()
      for (const x of ns) counts.set(x, (counts.get(x) ?? 0) + 1)
      const top = Math.max(0, ...counts.values())
      // like Excel: no repeated value → #N/A; ties go to the value that appears first
      return top < 2 ? ERR.na : (ns.find(x => counts.get(x) === top) as number)
    }
    case 'STDEV':
    case 'STDEV.S':
    case 'STDEV.P':
    case 'VAR':
    case 'VAR.S':
    case 'VAR.P': {
      const ns = numbers(ctx, args)
      if (isErr(ns)) return ns
      const pop = name.endsWith('.P')
      if (ns.length < (pop ? 1 : 2)) return ERR.div0
      const mean = ns.reduce((s, x) => s + x, 0) / ns.length
      const v = ns.reduce((s, x) => s + (x - mean) ** 2, 0) / (ns.length - (pop ? 0 : 1))
      return name.startsWith('VAR') ? v : Math.sqrt(v)
    }
    case 'CORREL':
    case 'PEARSON': {
      if (!need(2)) return ERR.value
      const a = range(0)
      const b = range(1)
      if (!a || !b) return ERR.value
      const xs = rangeValues(ctx, a).flat()
      const ys = rangeValues(ctx, b).flat()
      if (xs.length !== ys.length) return ERR.na
      const bad = [...xs, ...ys].find(isErr)
      if (bad) return bad
      const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => typeof x === 'number' && typeof y === 'number') as [number, number][]
      if (pairs.length < 2) return ERR.div0
      const mx = pairs.reduce((s, p) => s + p[0], 0) / pairs.length
      const my = pairs.reduce((s, p) => s + p[1], 0) / pairs.length
      let sxy = 0
      let sxx = 0
      let syy = 0
      for (const [x, y] of pairs) {
        sxy += (x - mx) * (y - my)
        sxx += (x - mx) ** 2
        syy += (y - my) ** 2
      }
      return sxx && syy ? sxy / Math.sqrt(sxx * syy) : ERR.div0
    }
    case 'COUNT':
      return flatValues(ctx, args).filter(x => typeof x.v === 'number' || (x.direct && (typeof x.v === 'boolean' || (typeof x.v === 'string' && numericText(x.v) !== null)))).length
    case 'COUNTA':
      return flatValues(ctx, args).filter(x => x.v !== null && !(x.direct && x.v === null)).length
    case 'COUNTBLANK': {
      const r = range(0)
      if (!r || !need(1)) return ERR.value
      return rangeValues(ctx, r).flat().filter(v => v === null || v === '').length
    }
    case 'IF': {
      if (!need(1, 3)) return ERR.value
      const c = toBool(arg(0))
      if (isErr(c)) return c
      if (c) return args[1] ? evaluate(args[1], ctx) : args.length >= 2 ? 0 : true
      return args.length >= 3 ? (args[2] ? evaluate(args[2], ctx) : 0) : false
    }
    case 'IFERROR': {
      if (!need(2)) return ERR.value
      const v = arg(0)
      return isErr(v) ? arg(1) : v
    }
    case 'AND':
    case 'OR': {
      const vals = flatValues(ctx, args).filter(x => x.v !== null || x.direct)
      let seen = false
      let acc = name === 'AND'
      for (const { v, direct } of vals) {
        if (isErr(v)) return v
        if (!direct && typeof v === 'string') continue
        const b = toBool(v)
        if (isErr(b)) return b
        seen = true
        acc = name === 'AND' ? acc && b : acc || b
      }
      return seen ? acc : ERR.value
    }
    case 'NOT': {
      if (!need(1)) return ERR.value
      const b = toBool(arg(0))
      return isErr(b) ? b : !b
    }
    case 'TRUE':
      return true
    case 'FALSE':
      return false
    case 'COUNTIF':
    case 'SUMIF':
    case 'AVERAGEIF': {
      if (name === 'COUNTIF' ? !need(2) : !need(2, 3)) return ERR.value
      const r = range(0)
      if (!r) return ERR.value
      const test = criteria(arg(1))
      const cells = rangeValues(ctx, r)
      if (name === 'COUNTIF') return cells.flat().filter(test).length
      const sr = args[2] ? range(2) : r
      if (!sr) return ERR.value
      const sums = rangeValues(ctx, { ...sr, r2: sr.r1 + (r.r2 - r.r1), c2: sr.c1 + (r.c2 - r.c1) })
      let total = 0
      let n = 0
      cells.forEach((row, i) =>
        row.forEach((v, j) => {
          const s = sums[i][j]
          if (test(v) && typeof s === 'number') {
            total += s
            n++
          }
        })
      )
      return name === 'SUMIF' ? total : n ? total / n : ERR.div0
    }
    case 'COUNTIFS':
    case 'SUMIFS': {
      const off = name === 'SUMIFS' ? 1 : 0
      if (args.length < 2 + off || (args.length - off) % 2) return ERR.value
      const sumR = off ? range(0) : null
      if (off && !sumR) return ERR.value
      const pairs: { cells: Scalar[][]; test: (v: Scalar) => boolean }[] = []
      for (let i = off; i < args.length; i += 2) {
        const r = range(i)
        if (!r) return ERR.value
        pairs.push({ cells: rangeValues(ctx, r), test: criteria(arg(i + 1)) })
      }
      const h = pairs[0].cells.length
      const w = pairs[0].cells[0].length
      if (pairs.some(p => p.cells.length !== h || p.cells[0].length !== w)) return ERR.value
      const sums = sumR ? rangeValues(ctx, sumR) : null
      if (sums && (sums.length !== h || sums[0].length !== w)) return ERR.value
      let count = 0
      let total = 0
      for (let i = 0; i < h; i++)
        for (let j = 0; j < w; j++)
          if (pairs.every(p => p.test(p.cells[i][j]))) {
            count++
            const s = sums?.[i][j]
            if (typeof s === 'number') total += s
          }
      return off ? total : count
    }
    case 'ROUND':
    case 'ROUNDUP':
    case 'ROUNDDOWN': {
      if (!need(2)) return ERR.value
      const x = numArg(0)
      const d = numArg(1)
      if (isErr(x)) return x
      if (isErr(d)) return d
      return roundTo(x, Math.trunc(d), name === 'ROUND' ? 'round' : name === 'ROUNDUP' ? 'up' : 'down')
    }
    case 'INT':
    case 'ABS':
    case 'SQRT': {
      if (!need(1)) return ERR.value
      const x = numArg(0)
      if (isErr(x)) return x
      if (name === 'INT') return Math.floor(x)
      if (name === 'ABS') return Math.abs(x)
      return x < 0 ? ERR.num : Math.sqrt(x)
    }
    case 'POWER':
      return need(2) ? binary('^', arg(0), arg(1)) : ERR.value
    case 'MOD': {
      if (!need(2)) return ERR.value
      const x = numArg(0)
      const y = numArg(1)
      if (isErr(x)) return x
      if (isErr(y)) return y
      if (y === 0) return ERR.div0
      return x - y * Math.floor(x / y)
    }
    case 'PI':
      return Math.PI
    case 'LEFT':
    case 'RIGHT': {
      if (!need(1, 2)) return ERR.value
      const s = textArg(0)
      const n = numArg(1, 1)
      if (isErr(s)) return s
      if (isErr(n)) return n
      if (n < 0) return ERR.value
      const k = Math.trunc(n)
      return name === 'LEFT' ? s.slice(0, k) : k === 0 ? '' : s.slice(-k)
    }
    case 'MID': {
      if (!need(3)) return ERR.value
      const s = textArg(0)
      const st = numArg(1)
      const n = numArg(2)
      if (isErr(s)) return s
      if (isErr(st)) return st
      if (isErr(n)) return n
      if (st < 1 || n < 0) return ERR.value
      return s.substr(Math.trunc(st) - 1, Math.trunc(n))
    }
    case 'LEN': {
      if (!need(1)) return ERR.value
      const s = textArg(0)
      return isErr(s) ? s : s.length
    }
    case 'UPPER':
    case 'LOWER':
    case 'PROPER':
    case 'TRIM': {
      if (!need(1)) return ERR.value
      const s = textArg(0)
      if (isErr(s)) return s
      if (name === 'UPPER') return s.toUpperCase()
      if (name === 'LOWER') return s.toLowerCase()
      if (name === 'TRIM') return s.replace(/ +/g, ' ').trim()
      return s.toLowerCase().replace(/(^|[^a-z])([a-z])/g, (_, a, b) => a + b.toUpperCase())
    }
    case 'CONCATENATE':
    case 'CONCAT': {
      let s = ''
      for (const { v } of flatValues(ctx, args)) {
        if (isErr(v)) return v
        s += toText(v) as string
      }
      return s
    }
    case 'VALUE': {
      if (!need(1)) return ERR.value
      return toNum(arg(0))
    }
    case 'ISBLANK':
      return need(1) ? arg(0) === null : ERR.value
    case 'ISNUMBER':
      return need(1) ? typeof arg(0) === 'number' : ERR.value
    case 'ISTEXT':
      return need(1) ? typeof arg(0) === 'string' : ERR.value
    case 'TODAY':
      return need(0) ? dateToSerial(new Date()) : ERR.value
    case 'NOW': {
      if (!need(0)) return ERR.value
      const d = new Date()
      return dateToSerial(d) + (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400
    }
    case 'YEAR':
    case 'MONTH':
    case 'DAY': {
      if (!need(1)) return ERR.value
      const x = numArg(0)
      if (isErr(x)) return x
      const d = serialToDate(Math.floor(x))
      return name === 'YEAR' ? d.getUTCFullYear() : name === 'MONTH' ? d.getUTCMonth() + 1 : d.getUTCDate()
    }
    case 'RAND':
      return need(0) ? Math.random() : ERR.value
    case 'RANDBETWEEN': {
      if (!need(2)) return ERR.value
      const lo = numArg(0)
      const hi = numArg(1)
      if (isErr(lo)) return lo
      if (isErr(hi)) return hi
      const a = Math.ceil(lo)
      const b = Math.floor(hi)
      if (a > b) return ERR.num
      return a + Math.floor(Math.random() * (b - a + 1))
    }
    case 'VLOOKUP':
    case 'HLOOKUP': {
      if (!need(3, 4)) return ERR.value
      const key = arg(0)
      if (isErr(key)) return key
      const r = range(1)
      if (!r) return ERR.value
      const idx = numArg(2)
      if (isErr(idx)) return idx
      const approx = args[3] ? toBool(arg(3)) : true
      if (isErr(approx)) return approx
      let table = rangeValues(ctx, r)
      if (name === 'HLOOKUP') table = table[0].map((_, j) => table.map(row => row[j]))
      const k = Math.trunc(idx)
      if (k < 1) return ERR.value
      if (k > table[0].length) return ERR.ref
      let hit = -1
      if (!approx) {
        const re = typeof key === 'string' ? wildcard(key) : null
        const test = (v: Scalar) => (re ? typeof v === 'string' && re.test(v) : v !== null && typeRank(v) === typeRank(key) && compare(v, key) === 0)
        hit = table.findIndex(row => test(row[0]))
      } else {
        for (let i = 0; i < table.length; i++) {
          const v = table[i][0]
          if (v === null || typeRank(v) !== typeRank(key)) continue
          if (compare(v, key) <= 0) hit = i
          else break
        }
      }
      return hit < 0 ? ERR.na : table[hit][k - 1]
    }
    case 'RANK':
    case 'RANK.EQ': {
      if (!need(2, 3)) return ERR.value
      const x = numArg(0)
      if (isErr(x)) return x
      const r = range(1)
      if (!r) return ERR.value
      const order = numArg(2, 0)
      if (isErr(order)) return order
      const ns = rangeValues(ctx, r).flat().filter((v): v is number => typeof v === 'number')
      if (!ns.includes(x)) return ERR.na
      return 1 + ns.filter(v => (order ? v < x : v > x)).length
    }
  }
  return ERR.name
}

const parseCache = new Map<string, Node | SyntaxError>()

export function checkFormula(formula: string): string | null {
  try {
    parseFormula(formula.slice(1))
    return null
  } catch (e) {
    return (e as Error).message
  }
}

// Evaluates a cell formula (text starting with "=") to a single value.
export function evalFormula(formula: string, ctx: EvalCtx): Scalar {
  let tree = parseCache.get(formula)
  if (!tree) {
    try {
      tree = parseFormula(formula.slice(1))
    } catch (e) {
      tree = e as SyntaxError
    }
    if (parseCache.size > 2000) parseCache.clear()
    parseCache.set(formula, tree)
  }
  if (tree instanceof SyntaxError) return ERR.name
  const v = evaluate(tree, ctx)
  if (!isRange(v)) return v
  return v.r1 === v.r2 && v.c1 === v.c2 ? ctx.get(v.sheet, v.r1, v.c1) : ERR.value
}

// ---------- formula rewriting ----------

// Rebuilds the formula text token by token so spacing is kept but references/functions are upper-cased.
export function normalizeFormula(formula: string): string {
  if (!formula.startsWith('=')) return formula
  try {
    return (
      '=' +
      tokenize(formula.slice(1))
        .map(t => {
          if (t.t === 'func' || t.t === 'bool') return t.v.toUpperCase()
          if (t.t !== 'ref' && t.t !== 'colrange') return t.v
          const k = t.v.lastIndexOf('!')
          return k < 0 ? t.v.toUpperCase() : t.v.slice(0, k + 1) + t.v.slice(k + 1).toUpperCase()
        })
        .join('')
    )
  } catch {
    return formula
  }
}

function refText(sheet: string | undefined, col: number, row: number, colAbs: boolean, rowAbs: boolean) {
  return (sheet !== undefined ? quoteSheet(sheet) + '!' : '') + (colAbs ? '$' : '') + colName(col) + (rowAbs ? '$' : '') + (row + 1)
}

function rewrite(formula: string, fn: (toks: Tok[]) => string[]): string {
  if (!formula.startsWith('=')) return formula
  let toks: Tok[]
  try {
    toks = tokenize(formula.slice(1))
  } catch {
    return formula
  }
  return '=' + fn(toks).join('')
}

// Copy/fill: shift relative parts of every reference by (dr, dc). Off-sheet → #REF!
export function shiftFormula(formula: string, dr: number, dc: number): string {
  return rewrite(formula, toks =>
    toks.map(t => {
      if (t.t === 'ref') {
        const row = t.rowAbs ? t.row : t.row + dr
        const col = t.colAbs ? t.col : t.col + dc
        if (row < 0 || col < 0) return '#REF!'
        return refText(t.sheet, col, row, t.colAbs, t.rowAbs)
      }
      if (t.t === 'colrange') {
        const c1 = t.abs1 ? t.c1 : t.c1 + dc
        const c2 = t.abs2 ? t.c2 : t.c2 + dc
        if (c1 < 0 || c2 < 0) return '#REF!'
        return (t.sheet !== undefined ? quoteSheet(t.sheet) + '!' : '') + (t.abs1 ? '$' : '') + colName(c1) + ':' + (t.abs2 ? '$' : '') + colName(c2)
      }
      return t.v
    })
  )
}

// Row/column insertion (count > 0) or deletion (count < 0) at index `at` on sheet `target`.
export function adjustForStructure(formula: string, formulaSheet: string, target: string, axis: 'row' | 'col', at: number, count: number): string {
  return rewrite(formula, toks => {
    const out: string[] = []
    const affects = (sheet?: string) => sameSheet(sheet ?? formulaSheet, target)
    const moveIdx = (i: number): number | null => {
      if (count > 0) return i >= at ? i + count : i
      const del = -count
      if (i >= at && i < at + del) return null
      return i >= at + del ? i + count : i
    }
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i]
      const colon = toks[i + 1]
      const t2 = toks[i + 2]
      if (t.t === 'ref' && colon?.t === 'op' && colon.v === ':' && t2?.t === 'ref') {
        // range
        if (!affects(t.sheet)) {
          out.push(t.v, ':', t2.v)
          i += 2
          continue
        }
        const a = axis === 'row' ? [t.row, t2.row] : [t.col, t2.col]
        let lo = Math.min(a[0], a[1])
        let hi = Math.max(a[0], a[1])
        if (count > 0) {
          if (at <= lo) {
            lo += count
            hi += count
          } else if (at <= hi) hi += count
        } else {
          const del = -count
          const end = at + del - 1
          if (at <= lo && end >= hi) {
            out.push('#REF!')
            i += 2
            continue
          }
          const newLo = lo < at ? lo : lo > end ? lo - del : at
          const removedInside = Math.max(0, Math.min(end, hi) - Math.max(at, lo) + 1)
          const newHi = hi > end ? hi - del : hi - removedInside
          lo = newLo
          hi = newHi
        }
        const first = axis === 'row' ? refText(t.sheet, t.col, lo, t.colAbs, t.rowAbs) : refText(t.sheet, lo, t.row, t.colAbs, t.rowAbs)
        const second = axis === 'row' ? refText(undefined, t2.col, hi, t2.colAbs, t2.rowAbs) : refText(undefined, hi, t2.row, t2.colAbs, t2.rowAbs)
        out.push(first, ':', second)
        i += 2
        continue
      }
      if (t.t === 'ref' && affects(t.sheet)) {
        const idx = moveIdx(axis === 'row' ? t.row : t.col)
        if (idx === null) out.push('#REF!')
        else out.push(axis === 'row' ? refText(t.sheet, t.col, idx, t.colAbs, t.rowAbs) : refText(t.sheet, idx, t.row, t.colAbs, t.rowAbs))
        continue
      }
      if (t.t === 'colrange' && axis === 'col' && affects(t.sheet)) {
        const a = moveIdx(t.c1)
        const b = moveIdx(t.c2)
        if (a === null || b === null) out.push('#REF!')
        else out.push((t.sheet !== undefined ? quoteSheet(t.sheet) + '!' : '') + (t.abs1 ? '$' : '') + colName(a) + ':' + (t.abs2 ? '$' : '') + colName(b))
        continue
      }
      out.push(t.v)
    }
    return out
  })
}

export function renameSheetInFormula(formula: string, from: string, to: string): string {
  return rewrite(formula, toks =>
    toks.map(t => {
      if ((t.t === 'ref' || t.t === 'colrange') && t.sheet !== undefined && sameSheet(t.sheet, from)) return quoteSheet(to) + t.v.slice(t.v.indexOf('!'))
      return t.v
    })
  )
}

// References inside a formula (for colour highlighting while editing).
export function formulaRefs(formula: string, sheet: string): { sheet: string; r1: number; c1: number; r2: number; c2: number }[] {
  if (!formula.startsWith('=')) return []
  let toks: Tok[]
  try {
    toks = tokenize(formula.slice(1))
  } catch {
    return []
  }
  const out: { sheet: string; r1: number; c1: number; r2: number; c2: number }[] = []
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    if (t.t !== 'ref') continue
    const colon = toks[i + 1]
    const t2 = toks[i + 2]
    if (colon?.t === 'op' && colon.v === ':' && t2?.t === 'ref') {
      out.push({ sheet: t.sheet ?? sheet, r1: Math.min(t.row, t2.row), c1: Math.min(t.col, t2.col), r2: Math.max(t.row, t2.row), c2: Math.max(t.col, t2.col) })
      i += 2
    } else out.push({ sheet: t.sheet ?? sheet, r1: t.row, c1: t.col, r2: t.row, c2: t.col })
  }
  return out
}

export function usesVolatile(formula: string) {
  return /\b(TODAY|NOW|RAND|RANDBETWEEN)\s*\(/i.test(formula)
}

// ---------- display formatting ----------

export type NumFormat = 'general' | 'number' | 'comma' | 'currency' | 'percent' | 'date'

function groupThousands(s: string) {
  const [i, f] = s.split('.')
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f !== undefined ? '.' + f : '')
}

export function formatNumber(n: number, fmt: NumFormat, decimals?: number): string {
  const neg = n < 0
  const a = Math.abs(n)
  switch (fmt) {
    case 'number':
      return (neg ? '-' : '') + roundTo(a, decimals ?? 2, 'round').toFixed(decimals ?? 2)
    case 'comma':
      return (neg ? '-' : '') + groupThousands(roundTo(a, decimals ?? 2, 'round').toFixed(decimals ?? 2))
    case 'currency':
      return (neg ? '-' : '') + '₦' + groupThousands(roundTo(a, decimals ?? 2, 'round').toFixed(decimals ?? 2))
    case 'percent':
      return (neg ? '-' : '') + roundTo(a * 100, decimals ?? 0, 'round').toFixed(decimals ?? 0) + '%'
    case 'date': {
      const d = serialToDate(Math.floor(n))
      const dd = String(d.getUTCDate()).padStart(2, '0')
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      return `${dd}/${mm}/${d.getUTCFullYear()}`
    }
    default: {
      if (decimals !== undefined) return (neg ? '-' : '') + roundTo(a, decimals, 'round').toFixed(decimals)
      if (Number.isInteger(n) && a < 1e11) return String(n)
      if (a >= 1e11 || (a < 1e-9 && a > 0)) return n.toExponential(5).replace(/\.?0+e/, 'E').replace('E+', 'E+').replace(/e/, 'E')
      return String(Number(n.toPrecision(10)))
    }
  }
}

// General format drops decimals until the number fits the column (Excel behaviour); if even the
// integer part does not fit, the cell shows ####.
export function fitGeneral(n: number, fits: (s: string) => boolean): string {
  let s = formatNumber(n, 'general')
  if (fits(s)) return s
  if (!Number.isInteger(n)) {
    for (let d = 9; d >= 0; d--) {
      s = String(roundTo(n, d, 'round'))
      if (fits(s)) return s
    }
  }
  return ''
}
