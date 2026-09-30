// Workbook model for the CSC 272 spreadsheet: sheets, cells, formats and the pure operations the
// UI performs (typing, fill, paste, insert/delete rows and columns, sort, rename, merge).
import {
  ERR,
  adjustForStructure,
  cellKey,
  colIndex,
  evalFormula,
  numToText,
  numericText,
  parseAddr,
  renameSheetInFormula,
  shiftFormula,
  isErr,
  type NumFormat,
  type Scalar,
} from './engine'
import { fillSeries, type FillDir } from './fill'

export interface Style {
  b?: boolean
  i?: boolean
  align?: 'left' | 'center' | 'right'
  fmt?: NumFormat
  dec?: number
  wrap?: boolean
  fill?: string
}
export interface Cell {
  raw: string
  st?: Style
}
export interface Rect {
  r1: number
  c1: number
  r2: number
  c2: number
}
export interface Sheet {
  id: number
  name: string
  cells: Record<string, Cell>
  colW: Record<number, number>
  rowH: Record<number, number>
  merges: Rect[]
  freeze: { r: number; c: number } | null
  tab?: string
}
export interface Book {
  sheets: Sheet[]
  nextId: number
}

export const DEFAULT_COL_W = 64
export const DEFAULT_ROW_H = 20

export const rect = (r1: number, c1: number, r2 = r1, c2 = c1): Rect => ({ r1: Math.min(r1, r2), c1: Math.min(c1, c2), r2: Math.max(r1, r2), c2: Math.max(c1, c2) })
export const inRect = (x: Rect, r: number, c: number) => r >= x.r1 && r <= x.r2 && c >= x.c1 && c <= x.c2
export const overlaps = (a: Rect, b: Rect) => a.r1 <= b.r2 && b.r1 <= a.r2 && a.c1 <= b.c2 && b.c1 <= a.c2

export function parseRange(text: string): Rect | null {
  const [a, b] = text.trim().split(':')
  const p = parseAddr(a)
  if (!p) return null
  if (b === undefined) return rect(p.r, p.c)
  const q = parseAddr(b)
  return q ? rect(p.r, p.c, q.r, q.c) : null
}

// What a stored raw string means as a value (formulas are evaluated elsewhere).
export function literal(raw: string): Scalar {
  if (raw === '') return null
  if (raw.startsWith("'")) return raw.slice(1)
  const u = raw.toUpperCase()
  if (u === 'TRUE' || u === 'FALSE') return u === 'TRUE'
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(raw.trim())) return parseFloat(raw)
  return raw
}

// Converts what the user typed into a stored cell, like Excel does: "50%" becomes 0.5 with the
// Percentage format, "₦1,200" becomes 1200 with Currency, "1,200" becomes 1200 with Comma Style.
export function entry(input: string, prev?: Style): Cell | null {
  const st = prev ? { ...prev } : undefined
  if (input === '') return st ? { raw: '', st } : null
  if (input.startsWith('=') || input.startsWith("'")) return { raw: input, st }
  const t = input.trim()
  const n = numericText(t)
  if (n !== null) {
    const general = !st?.fmt || st.fmt === 'general'
    let fmt: NumFormat | undefined
    let dec: number | undefined
    if (t.endsWith('%')) {
      fmt = 'percent'
      dec = (t.split('.')[1]?.replace('%', '').length ?? 0) || undefined
    } else if (t.startsWith('₦')) {
      fmt = 'currency'
    } else if (/\d,\d{3}/.test(t)) {
      fmt = 'comma'
      dec = t.includes('.') ? t.split('.')[1].length : 0
    }
    const next: Style | undefined = fmt && general ? { ...st, fmt, dec } : st
    return { raw: numToText(n), st: next }
  }
  const u = t.toUpperCase()
  if (u === 'TRUE' || u === 'FALSE') return { raw: u, st }
  return { raw: input, st }
}

// ---------- fence spec ----------
//   [Sheet: Raw Scores]           start a sheet
//   Matric No | Score             a row (cells separated by |), rows count from 1
//   @width A:C 90   @bold A1:C1   @italic A2   @align center A1:C1   @wrap A1
//   @format currency B2:B9        (general, number, comma, currency, percent, date)
//   @decimals 2 B2:B9   @merge A1:C1   @fill #DDEBF7 A1:C1   @freeze B2   @select B2:B9   @tab #C00000
export function parseSpec(text: string): { book: Book; active: number; select: Rect | null } {
  const sheets: Sheet[] = []
  let cur: Sheet | null = null
  let row = 0
  let active = 0
  let select: Rect | null = null
  const newSheet = (name: string) => {
    cur = { id: sheets.length + 1, name, cells: {}, colW: {}, rowH: {}, merges: [], freeze: null }
    sheets.push(cur)
    row = 0
    return cur
  }
  const sheet = (): Sheet => cur ?? newSheet('Sheet1')
  const each = (ranges: string[], fn: (r: number, c: number) => void) => {
    for (const s of ranges) {
      const x = parseRange(s)
      if (!x) continue
      for (let r = x.r1; r <= x.r2; r++) for (let c = x.c1; c <= x.c2; c++) fn(r, c)
    }
  }
  const style = (s: Sheet, r: number, c: number, patch: Style) => {
    const k = cellKey(r, c)
    const cell = s.cells[k] ?? { raw: '' }
    s.cells[k] = { ...cell, st: { ...cell.st, ...patch } }
  }

  const lines = text.replace(/\r/g, '').split('\n')
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  for (const line of lines) {
    const head = /^\[(?:Sheet:\s*)?(.+)\]\s*$/.exec(line.trim())
    if (head) {
      newSheet(head[1].trim())
      continue
    }
    const dir = /^@(\w+)\s*(.*)$/.exec(line.trim())
    if (dir) {
      const s = sheet()
      const args = dir[2].trim().split(/\s+/).filter(Boolean)
      switch (dir[1].toLowerCase()) {
        case 'width': {
          const [a, b] = args[0].split(':')
          for (let c = colIndex(a); c <= colIndex(b ?? a); c++) s.colW[c] = parseInt(args[1], 10)
          break
        }
        case 'height':
          s.rowH[parseInt(args[0], 10) - 1] = parseInt(args[1], 10)
          break
        case 'bold':
          each(args, (r, c) => style(s, r, c, { b: true }))
          break
        case 'italic':
          each(args, (r, c) => style(s, r, c, { i: true }))
          break
        case 'wrap':
          each(args, (r, c) => style(s, r, c, { wrap: true }))
          break
        case 'align':
          each(args.slice(1), (r, c) => style(s, r, c, { align: args[0] as Style['align'] }))
          break
        case 'format':
          each(args.slice(1), (r, c) => style(s, r, c, { fmt: args[0] as NumFormat }))
          break
        case 'decimals':
          each(args.slice(1), (r, c) => style(s, r, c, { dec: parseInt(args[0], 10) }))
          break
        case 'fill':
          each(args.slice(1), (r, c) => style(s, r, c, { fill: args[0] }))
          break
        case 'merge': {
          const x = parseRange(args[0])
          if (x) s.merges.push(x)
          break
        }
        case 'freeze': {
          const p = parseAddr(args[0])
          if (p) s.freeze = { r: p.r, c: p.c }
          break
        }
        case 'select':
          select = parseRange(args[0])
          active = sheets.indexOf(s)
          break
        case 'tab':
          s.tab = args[0]
          break
      }
      continue
    }
    const s = sheet()
    if (line.trim() !== '') {
      line.split('|').forEach((part, c) => {
        const v = part.trim()
        if (!v) return
        const k = cellKey(row, c)
        const made = entry(v, s.cells[k]?.st)
        if (made) s.cells[k] = made
      })
    }
    row++
  }
  if (!sheets.length) newSheet('Sheet1')
  return { book: { sheets, nextId: sheets.length + 1 }, active, select }
}

// ---------- evaluation ----------

export function usedBounds(s: Sheet) {
  let rows = 0
  let cols = 0
  for (const k of Object.keys(s.cells)) {
    if (s.cells[k].raw === '' && !s.cells[k].st) continue
    const [r, c] = k.split(',').map(Number)
    rows = Math.max(rows, r + 1)
    cols = Math.max(cols, c + 1)
  }
  for (const m of s.merges) {
    rows = Math.max(rows, m.r2 + 1)
    cols = Math.max(cols, m.c2 + 1)
  }
  return { rows, cols }
}

export function findSheet(book: Book, name: string) {
  const n = name.toLowerCase()
  return book.sheets.find(s => s.name.toLowerCase() === n)
}

export function makeEvaluator(book: Book) {
  const memo = new Map<string, Scalar>()
  const visiting = new Set<string>()
  const state = { circular: false }
  const byName = new Map(book.sheets.map(s => [s.name.toLowerCase(), s]))
  const ctxFor = (s: Sheet) => ({
    sheet: s.name,
    get,
    hasSheet: (n: string) => byName.has(n.toLowerCase()),
    usedRows: (n: string) => {
      const t = byName.get(n.toLowerCase())
      return t ? usedBounds(t).rows : 0
    },
  })
  function get(sheetName: string, r: number, c: number): Scalar {
    const s = byName.get(sheetName.toLowerCase())
    if (!s) return ERR.ref
    const k = `${s.id}:${r},${c}`
    if (memo.has(k)) return memo.get(k) as Scalar
    const cell = s.cells[cellKey(r, c)]
    let v: Scalar
    if (!cell || cell.raw === '') v = null
    else if (cell.raw.startsWith('=')) {
      if (visiting.has(k)) {
        state.circular = true
        return 0
      }
      visiting.add(k)
      v = evalFormula(cell.raw, ctxFor(s))
      visiting.delete(k)
    } else v = literal(cell.raw)
    memo.set(k, v)
    return v
  }
  return {
    get,
    value: (s: Sheet, r: number, c: number) => get(s.name, r, c),
    get circular() {
      return state.circular
    },
  }
}
export type Evaluator = ReturnType<typeof makeEvaluator>

// ---------- pure operations ----------

const cloneSheet = (s: Sheet): Sheet => ({ ...s, cells: { ...s.cells }, colW: { ...s.colW }, rowH: { ...s.rowH }, merges: [...s.merges] })

function withSheet(book: Book, idx: number, fn: (s: Sheet) => void): Book {
  const s = cloneSheet(book.sheets[idx])
  fn(s)
  const sheets = [...book.sheets]
  sheets[idx] = s
  return { ...book, sheets }
}

export function setCells(book: Book, idx: number, updates: [number, number, Cell | null][]): Book {
  return withSheet(book, idx, s => {
    for (const [r, c, cell] of updates) {
      const k = cellKey(r, c)
      if (cell && (cell.raw !== '' || cell.st)) s.cells[k] = cell
      else delete s.cells[k]
    }
  })
}

export function styleRange(book: Book, idx: number, x: Rect, fn: (st: Style) => Style): Book {
  return withSheet(book, idx, s => {
    for (let r = x.r1; r <= x.r2; r++)
      for (let c = x.c1; c <= x.c2; c++) {
        const k = cellKey(r, c)
        const cell = s.cells[k] ?? { raw: '' }
        s.cells[k] = { ...cell, st: fn({ ...cell.st }) }
      }
  })
}

export function clearRange(book: Book, idx: number, x: Rect, what: 'contents' | 'formats' | 'all'): Book {
  return withSheet(book, idx, s => {
    for (let r = x.r1; r <= x.r2; r++)
      for (let c = x.c1; c <= x.c2; c++) {
        const k = cellKey(r, c)
        const cell = s.cells[k]
        if (!cell) continue
        if (what === 'all' || (what === 'contents' && !cell.st) || (what === 'formats' && cell.raw === '')) delete s.cells[k]
        else if (what === 'contents') s.cells[k] = { raw: '', st: cell.st }
        else s.cells[k] = { raw: cell.raw }
      }
    if (what !== 'contents') s.merges = s.merges.filter(m => !overlaps(m, x))
  })
}

export function mapFormulas(book: Book, fn: (raw: string, sheet: Sheet) => string): Book {
  return {
    ...book,
    sheets: book.sheets.map(s => {
      let changed = false
      const cells: Record<string, Cell> = {}
      for (const [k, cell] of Object.entries(s.cells)) {
        if (cell.raw.startsWith('=')) {
          const raw = fn(cell.raw, s)
          if (raw !== cell.raw) {
            changed = true
            cells[k] = { ...cell, raw }
            continue
          }
        }
        cells[k] = cell
      }
      return changed ? { ...s, cells } : s
    }),
  }
}

// Insert (count > 0) or delete (count < 0) whole rows/columns at index `at`.
export function insertLines(book: Book, idx: number, axis: 'row' | 'col', at: number, count: number): Book {
  const target = book.sheets[idx].name
  let next = mapFormulas(book, (raw, s) => adjustForStructure(raw, s.name, target, axis, at, count))
  next = withSheet(next, idx, s => {
    const cells: Record<string, Cell> = {}
    const move = (i: number) => (count > 0 ? (i >= at ? i + count : i) : i >= at - count ? i + count : i < at ? i : null)
    for (const [k, cell] of Object.entries(s.cells)) {
      const [r, c] = k.split(',').map(Number)
      const m = move(axis === 'row' ? r : c)
      if (m === null) continue
      cells[axis === 'row' ? cellKey(m, c) : cellKey(r, m)] = cell
    }
    s.cells = cells
    const sizes = axis === 'row' ? s.rowH : s.colW
    const moved: Record<number, number> = {}
    for (const [i, w] of Object.entries(sizes)) {
      const m = move(Number(i))
      if (m !== null) moved[m] = w
    }
    if (axis === 'row') s.rowH = moved
    else s.colW = moved
    s.merges = s.merges.flatMap(mg => {
      const lo = axis === 'row' ? mg.r1 : mg.c1
      const hi = axis === 'row' ? mg.r2 : mg.c2
      const a = move(lo)
      const b = move(hi)
      if (a === null || b === null) return []
      return [axis === 'row' ? { ...mg, r1: a, r2: b } : { ...mg, c1: a, c2: b }]
    })
  })
  return next
}

export function validSheetName(book: Book, name: string, except?: number): string | null {
  const n = name.trim()
  if (!n || n.length > 31 || /[\\/?*[\]:]/.test(n))
    return 'You typed an invalid name for a sheet or chart. Make sure that: the name does not exceed 31 characters; it does not contain any of these characters: \\ / ? * [ or ] (or :); and you did not leave the name blank.'
  if (book.sheets.some((s, i) => i !== except && s.name.toLowerCase() === n.toLowerCase())) return 'That name is already taken. Try a different one.'
  return null
}

export function renameSheet(book: Book, idx: number, name: string): Book {
  const old = book.sheets[idx].name
  const next = mapFormulas(book, raw => renameSheetInFormula(raw, old, name.trim()))
  return withSheet(next, idx, s => {
    s.name = name.trim()
  })
}

export function addSheet(book: Book, at: number): { book: Book; idx: number } {
  let n = book.sheets.length + 1
  while (book.sheets.some(s => s.name.toLowerCase() === `sheet${n}`)) n++
  const sheet: Sheet = { id: book.nextId, name: `Sheet${n}`, cells: {}, colW: {}, rowH: {}, merges: [], freeze: null }
  const sheets = [...book.sheets]
  sheets.splice(at, 0, sheet)
  return { book: { sheets, nextId: book.nextId + 1 }, idx: at }
}

export function deleteSheet(book: Book, idx: number): Book {
  return { ...book, sheets: book.sheets.filter((_, i) => i !== idx) }
}

export function setSheetProp(book: Book, idx: number, patch: Partial<Sheet>): Book {
  return withSheet(book, idx, s => Object.assign(s, patch))
}

export function mergeRange(book: Book, idx: number, x: Rect): Book {
  return withSheet(book, idx, s => {
    s.merges = s.merges.filter(m => !overlaps(m, x))
    s.merges.push(x)
    for (let r = x.r1; r <= x.r2; r++)
      for (let c = x.c1; c <= x.c2; c++) {
        if (r === x.r1 && c === x.c1) continue
        const k = cellKey(r, c)
        if (s.cells[k]) s.cells[k] = { raw: '', st: s.cells[k].st }
      }
    const k = cellKey(x.r1, x.c1)
    s.cells[k] = { raw: s.cells[k]?.raw ?? '', st: { ...s.cells[k]?.st, align: 'center' } }
  })
}

export function unmerge(book: Book, idx: number, x: Rect): Book {
  return withSheet(book, idx, s => {
    s.merges = s.merges.filter(m => !overlaps(m, x))
  })
}

// Fill handle: extend `x` by `count` cells in direction `dir`.
export function fillRange(book: Book, idx: number, x: Rect, dir: FillDir, count: number): Book {
  const s = book.sheets[idx]
  const updates: [number, number, Cell | null][] = []
  const vertical = dir === 'down' || dir === 'up'
  const lines = vertical ? [x.c1, x.c2] : [x.r1, x.r2]
  for (let line = lines[0]; line <= lines[1]; line++) {
    const src: Cell[] = []
    const lo = vertical ? x.r1 : x.c1
    const hi = vertical ? x.r2 : x.c2
    for (let i = lo; i <= hi; i++) src.push(s.cells[vertical ? cellKey(i, line) : cellKey(line, i)] ?? { raw: '' })
    const vals = fillSeries(
      src.map(c => c.raw),
      count,
      dir
    )
    vals.forEach((raw, k) => {
      const pos = dir === 'down' || dir === 'right' ? hi + 1 + k : lo - 1 - k
      if (pos < 0) return
      const n = src.length
      const from = dir === 'down' || dir === 'right' ? src[k % n] : src[n - 1 - (k % n)]
      const cell: Cell = { raw, st: from.st }
      updates.push(vertical ? [pos, line, cell] : [line, pos, cell])
    })
  }
  return setCells(book, idx, updates)
}

export type PasteMode = 'all' | 'values' | 'formulas' | 'formats' | 'transpose'

function valueToRaw(v: Scalar): string {
  if (v === null) return ''
  if (typeof v === 'number') return numToText(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (isErr(v)) return v.code
  return v.startsWith('=') || literal(v) !== v ? "'" + v : v
}

export function pasteRange(book: Book, ev: Evaluator, from: { idx: number; x: Rect; cut: boolean }, to: number, at: { r: number; c: number }, mode: PasteMode): { book: Book; x: Rect } {
  const src = book.sheets[from.idx]
  const h = from.x.r2 - from.x.r1
  const w = from.x.c2 - from.x.c1
  const updates: [number, number, Cell | null][] = []
  const clears: [number, number, Cell | null][] = []
  const dest = mode === 'transpose' ? rect(at.r, at.c, at.r + w, at.c + h) : rect(at.r, at.c, at.r + h, at.c + w)
  for (let r = from.x.r1; r <= from.x.r2; r++)
    for (let c = from.x.c1; c <= from.x.c2; c++) {
      const dr = r - from.x.r1
      const dc = c - from.x.c1
      const tr = at.r + (mode === 'transpose' ? dc : dr)
      const tc = at.c + (mode === 'transpose' ? dr : dc)
      const cell = src.cells[cellKey(r, c)]
      const existing = book.sheets[to].cells[cellKey(tr, tc)]
      let out: Cell | null
      if (!cell) out = mode === 'formats' ? (existing ? { raw: existing.raw } : null) : mode === 'values' || mode === 'formulas' ? (existing?.st ? { raw: '', st: existing.st } : null) : null
      else if (mode === 'values') out = { raw: valueToRaw(ev.value(src, r, c)), st: existing?.st }
      else if (mode === 'formats') out = { raw: existing?.raw ?? '', st: cell.st }
      else {
        const raw = cell.raw.startsWith('=') && !from.cut ? shiftFormula(cell.raw, tr - r, tc - c) : cell.raw
        out = { raw, st: mode === 'formulas' ? existing?.st : cell.st }
      }
      updates.push([tr, tc, out])
      if (from.cut) clears.push([r, c, null])
    }
  let next = book
  if (from.cut) next = setCells(next, from.idx, clears.filter(([r, c]) => !(from.idx === to && inRect(dest, r, c))))
  next = setCells(next, to, updates)
  return { book: next, x: dest }
}

// Sort the rows of `x` by column `col`. A first row of text above numbers is kept as a header.
export function sortRows(book: Book, idx: number, ev: Evaluator, x: Rect, col: number, desc: boolean): { book: Book; header: boolean } {
  const s = book.sheets[idx]
  const first = ev.value(s, x.r1, col)
  const second = x.r2 > x.r1 ? ev.value(s, x.r1 + 1, col) : null
  const header = x.r2 > x.r1 && typeof first === 'string' && typeof second === 'number'
  const start = header ? x.r1 + 1 : x.r1
  const rows: { r: number; v: Scalar }[] = []
  for (let r = start; r <= x.r2; r++) rows.push({ r, v: ev.value(s, r, col) })
  const rank = (v: Scalar) => (v === null ? 3 : typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2)
  rows.sort((a, b) => {
    const ra = rank(a.v)
    const rb = rank(b.v)
    if (ra === 3 || rb === 3) return ra - rb
    if (ra !== rb) return desc ? rb - ra : ra - rb
    const d = typeof a.v === 'string' ? a.v.toLowerCase().localeCompare((b.v as string).toLowerCase()) : Number(a.v) - Number(b.v)
    return (desc ? -d : d) || a.r - b.r
  })
  const updates: [number, number, Cell | null][] = []
  rows.forEach((row, i) => {
    const tr = start + i
    for (let c = x.c1; c <= x.c2; c++) {
      const cell = s.cells[cellKey(row.r, c)]
      updates.push([tr, c, cell ? { ...cell, raw: cell.raw.startsWith('=') ? shiftFormula(cell.raw, tr - row.r, 0) : cell.raw } : null])
    }
  })
  return { book: setCells(book, idx, updates), header }
}
