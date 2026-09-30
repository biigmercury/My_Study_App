'use client'

import { isValidElement, useEffect, useMemo, useRef, useState } from 'react'
import { addr, cellKey, checkFormula, colName, fitGeneral, formatNumber, formulaRefs, isErr, normalizeFormula, numToText, parseAddr, quoteSheet, type NumFormat, type Scalar } from './excel/engine'
import type { FillDir } from './excel/fill'
import {
  DEFAULT_COL_W,
  DEFAULT_ROW_H,
  addSheet,
  clearRange,
  deleteSheet,
  entry,
  fillRange,
  inRect,
  insertLines,
  makeEvaluator,
  mergeRange,
  overlaps,
  parseRange,
  parseSpec,
  pasteRange,
  rect,
  renameSheet,
  setCells,
  setSheetProp,
  sortRows,
  styleRange,
  unmerge,
  usedBounds,
  validSheetName,
  type Book,
  type PasteMode,
  type Rect,
  type Sheet,
  type Style,
} from './excel/model'

// A working Excel-style spreadsheet for the CSC 272 Excel lessons: type values and formulas, click
// cells to build references, drag the fill handle, format numbers, insert/delete rows, freeze panes,
// sort, copy/paste (incl. Paste Values), multiple sheets with cross-sheet references, undo/redo.
// Initial data comes from a ```sheet fence (see parseSpec in excel/model.ts).

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-sheet' && typeof props.children === 'string') {
    out.push(props.children.replace(/\n$/, ''))
    return
  }
  collect(props.children, out)
}

const FONT = '14px Calibri, Carlito, "Segoe UI", Arial, sans-serif'
const HEAD_H = 20
const RH_W = 36
const GREEN = '#217346'
const GRID = '#d4d4d4'
const REF_COLORS = ['#2E75B6', '#C00000', '#7030A0', '#00A050', '#ED7D31', '#548235']
const FILLS: [string, string][] = [
  ['', 'No Fill'],
  ['#FFFF00', 'Yellow'],
  ['#DDEBF7', 'Light Blue'],
  ['#E2EFDA', 'Light Green'],
  ['#FCE4D6', 'Light Orange'],
  ['#D9D9D9', 'Grey'],
]
const TAB_COLORS: [string, string][] = [
  ['', 'No Colour'],
  ['#C00000', 'Red'],
  ['#ED7D31', 'Orange'],
  ['#FFC000', 'Gold'],
  ['#70AD47', 'Green'],
  ['#4472C4', 'Blue'],
  ['#7030A0', 'Purple'],
]

const SYNTAX: Record<string, [string, string]> = {
  SUM: ['SUM(number1, [number2], …)', 'Adds all the numbers in a range of cells.'],
  AVERAGE: ['AVERAGE(number1, [number2], …)', 'Arithmetic mean of the numbers (blank and text cells are ignored).'],
  COUNT: ['COUNT(value1, [value2], …)', 'Counts how many cells contain numbers.'],
  COUNTA: ['COUNTA(value1, [value2], …)', 'Counts how many cells are not empty.'],
  COUNTBLANK: ['COUNTBLANK(range)', 'Counts the empty cells in a range.'],
  MAX: ['MAX(number1, [number2], …)', 'Largest value.'],
  MIN: ['MIN(number1, [number2], …)', 'Smallest value.'],
  MEDIAN: ['MEDIAN(number1, [number2], …)', 'Middle value of the numbers.'],
  MODE: ['MODE(number1, [number2], …)', 'Most frequently occurring value (#N/A if no value repeats).'],
  'MODE.SNGL': ['MODE.SNGL(number1, [number2], …)', 'Same as MODE (Excel 2010+ name).'],
  STDEV: ['STDEV(number1, [number2], …)', 'Sample standard deviation — spread of values around the mean.'],
  'STDEV.S': ['STDEV.S(number1, [number2], …)', 'Sample standard deviation (Excel 2010+ name for STDEV).'],
  'STDEV.P': ['STDEV.P(number1, [number2], …)', 'Standard deviation of a whole population.'],
  VAR: ['VAR(number1, [number2], …)', 'Sample variance (the square of STDEV).'],
  'VAR.S': ['VAR.S(number1, [number2], …)', 'Sample variance (Excel 2010+ name for VAR).'],
  'VAR.P': ['VAR.P(number1, [number2], …)', 'Variance of a whole population.'],
  CORREL: ['CORREL(array1, array2)', 'Pearson correlation coefficient r between two ranges (−1 to +1).'],
  PEARSON: ['PEARSON(array1, array2)', 'Same as CORREL.'],
  PRODUCT: ['PRODUCT(number1, [number2], …)', 'Multiplies all the numbers.'],
  ROUND: ['ROUND(number, num_digits)', 'Rounds to the given number of decimal places.'],
  ROUNDUP: ['ROUNDUP(number, num_digits)', 'Rounds away from zero.'],
  ROUNDDOWN: ['ROUNDDOWN(number, num_digits)', 'Rounds towards zero.'],
  INT: ['INT(number)', 'Rounds down to the nearest whole number.'],
  ABS: ['ABS(number)', 'Absolute value (drops the minus sign).'],
  SQRT: ['SQRT(number)', 'Square root.'],
  POWER: ['POWER(number, power)', 'Same as number^power.'],
  MOD: ['MOD(number, divisor)', 'Remainder after division.'],
  PI: ['PI()', '3.14159265358979'],
  IF: ['IF(logical_test, [value_if_true], [value_if_false])', 'Returns one value if the test is TRUE and another if it is FALSE.'],
  IFERROR: ['IFERROR(value, value_if_error)', 'Shows value_if_error instead of an error such as #DIV/0!.'],
  AND: ['AND(logical1, [logical2], …)', 'TRUE only if every condition is TRUE.'],
  OR: ['OR(logical1, [logical2], …)', 'TRUE if any condition is TRUE.'],
  NOT: ['NOT(logical)', 'Reverses TRUE/FALSE.'],
  COUNTIF: ['COUNTIF(range, criteria)', 'Counts cells that meet one condition, e.g. ">=50" or "Passed".'],
  COUNTIFS: ['COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], …)', 'Counts cells that meet all the conditions.'],
  SUMIF: ['SUMIF(range, criteria, [sum_range])', 'Adds the cells that meet a condition.'],
  SUMIFS: ['SUMIFS(sum_range, criteria_range1, criteria1, …)', 'Adds cells that meet all the conditions.'],
  AVERAGEIF: ['AVERAGEIF(range, criteria, [average_range])', 'Average of the cells that meet a condition.'],
  VLOOKUP: ['VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])', 'Looks down the first column of a table and returns a value from another column. FALSE = exact match.'],
  HLOOKUP: ['HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])', 'Like VLOOKUP but searches across the top row.'],
  RANK: ['RANK(number, ref, [order])', 'Position of a number in a list (0 or omitted = largest is 1st).'],
  'RANK.EQ': ['RANK.EQ(number, ref, [order])', 'Same as RANK (Excel 2010+ name).'],
  LEFT: ['LEFT(text, [num_chars])', 'First characters of the text.'],
  RIGHT: ['RIGHT(text, [num_chars])', 'Last characters of the text.'],
  MID: ['MID(text, start_num, num_chars)', 'Characters from the middle, starting at start_num.'],
  LEN: ['LEN(text)', 'Number of characters (spaces count).'],
  UPPER: ['UPPER(text)', 'CONVERTS TO CAPITALS.'],
  LOWER: ['LOWER(text)', 'converts to small letters.'],
  PROPER: ['PROPER(text)', 'Capitalises Each Word.'],
  TRIM: ['TRIM(text)', 'Removes extra spaces.'],
  CONCATENATE: ['CONCATENATE(text1, [text2], …)', 'Joins text together (same as the & operator).'],
  CONCAT: ['CONCAT(text1, [text2], …)', 'Newer name for CONCATENATE (Excel 2016+).'],
  VALUE: ['VALUE(text)', 'Turns text that looks like a number into a number.'],
  TODAY: ['TODAY()', 'Today’s date — volatile: recalculates every time the sheet changes.'],
  NOW: ['NOW()', 'Current date and time — volatile.'],
  YEAR: ['YEAR(serial_number)', 'Year part of a date.'],
  MONTH: ['MONTH(serial_number)', 'Month (1–12) of a date.'],
  DAY: ['DAY(serial_number)', 'Day of the month of a date.'],
  RAND: ['RAND()', 'Random number between 0 and 1 — volatile: changes whenever the sheet recalculates.'],
  RANDBETWEEN: ['RANDBETWEEN(bottom, top)', 'Random whole number between bottom and top — volatile.'],
  ISBLANK: ['ISBLANK(value)', 'TRUE if the cell is empty.'],
  ISNUMBER: ['ISNUMBER(value)', 'TRUE if the value is a number.'],
  ISTEXT: ['ISTEXT(value)', 'TRUE if the value is text.'],
}

const FUNCTION_GROUPS: [string, string[]][] = [
  ['Math & Statistics', ['SUM', 'AVERAGE', 'COUNT', 'COUNTA', 'COUNTBLANK', 'MAX', 'MIN', 'MEDIAN', 'MODE', 'STDEV', 'CORREL', 'ROUND', 'INT', 'ABS', 'SQRT', 'MOD', 'PRODUCT']],
  ['Conditional', ['IF', 'AND', 'OR', 'NOT', 'IFERROR', 'COUNTIF', 'COUNTIFS', 'SUMIF', 'AVERAGEIF', 'RANK']],
  ['Lookup', ['VLOOKUP', 'HLOOKUP']],
  ['Text', ['LEFT', 'RIGHT', 'MID', 'LEN', 'UPPER', 'LOWER', 'PROPER', 'TRIM', 'CONCATENATE', 'VALUE']],
  ['Date & Volatile', ['TODAY', 'NOW', 'YEAR', 'MONTH', 'DAY', 'RAND', 'RANDBETWEEN']],
]

let canvas: HTMLCanvasElement | null = null
function measure(text: string, bold = false) {
  if (typeof document === 'undefined') return text.length * 7
  canvas ??= document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return text.length * 7
  ctx.font = (bold ? 'bold ' : '') + FONT
  return ctx.measureText(text).width
}

function wrapLines(text: string, width: number, bold?: boolean) {
  let lines = 1
  let line = ''
  for (const w of text.split(/\s+/)) {
    const t = line ? line + ' ' + w : w
    if (line && measure(t, bold) > width) {
      lines++
      line = w
    } else line = t
  }
  return lines
}

// Innermost function whose bracket is still open at the end of the draft (for the syntax tip).
function openFunction(draft: string): string | null {
  const stack: (string | null)[] = []
  let inStr = false
  for (let i = 0; i < draft.length; i++) {
    const ch = draft[i]
    if (ch === '"') inStr = !inStr
    if (inStr) continue
    if (ch === '(') {
      const m = /([A-Za-z][A-Za-z0-9.]*)\s*$/.exec(draft.slice(0, i))
      stack.push(m ? m[1].toUpperCase() : null)
    } else if (ch === ')') stack.pop()
  }
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i]) return stack[i]
  return null
}

function autoClose(f: string) {
  let depth = 0
  let inStr = false
  for (const ch of f) {
    if (ch === '"') inStr = !inStr
    else if (!inStr && ch === '(') depth++
    else if (!inStr && ch === ')') depth--
  }
  return depth > 0 ? f + ')'.repeat(depth) : f
}

const pointable = (draft: string) => draft.startsWith('=') && /[=+\-*/^(,:&<>]\s*$/.test(draft)

interface Edit {
  sheet: number
  r: number
  c: number
  draft: string
  mode: 'enter' | 'edit'
  inCell: boolean
}
interface Dialog {
  title?: string
  text: string
  input?: string
  okLabel?: string
  cancel?: boolean
  onOk?: (value: string) => void
}
type Drag = { mode: 'select' } | { mode: 'point'; start: number; anchor: { r: number; c: number }; down: boolean } | { mode: 'fill'; x: Rect }

export default function ExcelSheet({ title, rows, cols, height, children }: { title?: string; rows?: string; cols?: string; height?: string; children?: React.ReactNode }) {
  const spec = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    return parseSpec(out.join('\n'))
  }, [children])

  const [mounted, setMounted] = useState(false)
  const [book, setBook] = useState<Book>(spec.book)
  const [undoStack, setUndo] = useState<Book[]>([])
  const [redoStack, setRedo] = useState<Book[]>([])
  const [si, setSi] = useState(spec.active)
  const [sel, setSel] = useState(() => {
    const s = spec.select ?? rect(0, 0)
    return { a: { r: s.r1, c: s.c1 }, f: { r: s.r2, c: s.c2 } }
  })
  const [edit, setEdit] = useState<Edit | null>(null)
  const [showFormulas, setShowFormulas] = useState(false)
  const [gridlines, setGridlines] = useState(true)
  const [headings, setHeadings] = useState(true)
  const [clip, setClip] = useState<{ id: number; x: Rect; cut: boolean } | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [dialogValue, setDialogValue] = useState('')
  const [tick, setTick] = useState(0)
  const [fillPreview, setFillPreview] = useState<{ dir: FillDir; count: number } | null>(null)
  const [tab, setTab] = useState<'home' | 'formulas' | 'data' | 'view'>('home')
  const [renaming, setRenaming] = useState<{ idx: number; value: string } | null>(null)
  const [nameBox, setNameBox] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)
  const cellInputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const latest = useRef({ book, si, sel, edit, fillPreview })
  latest.current = { book, si, sel, edit, fillPreview }

  useEffect(() => setMounted(true), [])

  const sheet = book.sheets[si]
  const ev = useMemo(() => makeEvaluator(book), [book, tick]) // eslint-disable-line react-hooks/exhaustive-deps
  const bounds = usedBounds(sheet)
  const R = Math.min(300, Math.max(parseInt(rows ?? '0', 10) || 0, bounds.rows + 6, 15))
  const C = Math.min(40, Math.max(parseInt(cols ?? '0', 10) || 0, bounds.cols + 2, 8))

  const colW = (c: number) => sheet.colW[c] ?? DEFAULT_COL_W

  const mergeAt = (s: Sheet, r: number, c: number) => s.merges.find(m => inRect(m, r, c))
  const selRect = (() => {
    let x = rect(sel.a.r, sel.a.c, sel.f.r, sel.f.c)
    for (let grew = true; grew; ) {
      grew = false
      for (const m of sheet.merges)
        if (overlaps(m, x) && !(inRect(x, m.r1, m.c1) && inRect(x, m.r2, m.c2))) {
          x = rect(Math.min(x.r1, m.r1), Math.min(x.c1, m.c1), Math.max(x.r2, m.r2), Math.max(x.c2, m.c2))
          grew = true
        }
    }
    return x
  })()
  const active = sel.a
  const activeCell = sheet.cells[cellKey(active.r, active.c)]

  // ---------- display ----------

  const isDateFormula = (raw?: string) => !!raw && /^=\s*(TODAY|NOW)\s*\(\s*\)\s*$/i.test(raw)

  function display(s: Sheet, r: number, c: number, width: number): { text: string; align: 'left' | 'center' | 'right'; kind: 'num' | 'text' | 'other' } {
    const cell = s.cells[cellKey(r, c)]
    const st = cell?.st
    if (showFormulas && cell?.raw.startsWith('=')) return { text: cell.raw, align: 'left', kind: 'text' }
    const v = ev.value(s, r, c)
    const avail = width - 7
    if (v === null) return { text: '', align: st?.align ?? 'left', kind: 'other' }
    if (typeof v === 'number') {
      if (showFormulas) return { text: numToText(v), align: st?.align ?? 'right', kind: 'num' }
      let fmt: NumFormat = st?.fmt ?? 'general'
      let text: string
      if (fmt === 'general' && isDateFormula(cell?.raw)) {
        fmt = 'date'
        text = formatNumber(v, 'date')
        if (/NOW/i.test(cell!.raw)) {
          const mins = Math.round((v - Math.floor(v)) * 1440)
          text += ` ${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
        }
      } else if (fmt === 'general' && st?.dec === undefined) text = fitGeneral(v, t => measure(t, st?.b) <= avail)
      else text = formatNumber(v, fmt, st?.dec)
      if (!text || measure(text, st?.b) > avail) text = '#'.repeat(Math.max(1, Math.floor(avail / measure('#', st?.b))))
      return { text, align: st?.align ?? 'right', kind: 'num' }
    }
    if (typeof v === 'boolean') return { text: v ? 'TRUE' : 'FALSE', align: st?.align ?? 'center', kind: 'other' }
    if (isErr(v)) return { text: v.code, align: st?.align ?? 'center', kind: 'other' }
    return { text: v, align: st?.align ?? 'left', kind: 'text' }
  }

  const rowH = (r: number) => {
    if (sheet.rowH[r] !== undefined) return sheet.rowH[r]
    let h = DEFAULT_ROW_H
    for (let c = 0; c < C; c++) {
      const cell = sheet.cells[cellKey(r, c)]
      if (!cell?.st?.wrap || cell.raw === '') continue
      const m = mergeAt(sheet, r, c)
      let w = colW(c)
      if (m) {
        if (m.r1 !== m.r2) continue
        w = 0
        for (let k = m.c1; k <= m.c2; k++) w += colW(k)
      }
      const d = display(sheet, r, c, 9999)
      h = Math.max(h, wrapLines(d.text, w - 7, cell.st.b) * 17 + 3)
    }
    return h
  }

  // ---------- state helpers ----------

  const apply = (next: Book, opts?: { clearHistory?: boolean }) => {
    setUndo(u => (opts?.clearHistory ? [] : [...u.slice(-59), book]))
    setRedo(opts?.clearHistory ? [] : [])
    setBook(next)
  }

  const undo = () => {
    if (!undoStack.length) return
    setRedo(r => [...r, book])
    setBook(undoStack[undoStack.length - 1])
    setUndo(u => u.slice(0, -1))
  }
  const redo = () => {
    if (!redoStack.length) return
    setUndo(u => [...u, book])
    setBook(redoStack[redoStack.length - 1])
    setRedo(r => r.slice(0, -1))
  }
  useEffect(() => {
    if (si >= book.sheets.length) setSi(book.sheets.length - 1)
  }, [book, si])

  const focusGrid = () => requestAnimationFrame(() => gridRef.current?.focus({ preventScroll: true }))

  const select = (r: number, c: number, extend = false) => {
    r = Math.max(0, Math.min(R - 1, r))
    c = Math.max(0, Math.min(C - 1, c))
    const m = mergeAt(sheet, r, c)
    if (m && !extend) {
      r = m.r1
      c = m.c1
    }
    setSel(s => (extend ? { a: s.a, f: { r, c } } : { a: { r, c }, f: { r, c } }))
    requestAnimationFrame(() => {
      const el = gridRef.current?.querySelector(`[data-r="${r}"][data-c="${c}"]`) as HTMLElement | null
      el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  }

  const startEdit = (draft: string, mode: 'enter' | 'edit', inCell = true) => {
    setEdit({ sheet: si, r: active.r, c: active.c, draft, mode, inCell })
    dragRef.current = null
  }

  function commit(move: 'down' | 'up' | 'right' | 'left' | 'none' = 'down') {
    const e = latest.current.edit
    if (!e) return
    let s = e.draft
    if (s.startsWith('=') && s.length > 1) {
      s = autoClose(s)
      if (checkFormula(s)) {
        setDialog({
          title: 'Microsoft Excel',
          text: 'There’s a problem with this formula.\n\nNot trying to type a formula? When the first character is an equal (=) or minus (-) sign, Excel thinks it’s a formula. To get around this, type an apostrophe (’) first: you type ’=1+1 and the cell shows =1+1.',
        })
        return
      }
      s = normalizeFormula(s)
    }
    const target = book.sheets[e.sheet]
    const old = target.cells[cellKey(e.r, e.c)]
    if ((old?.raw ?? '') !== s) {
      const next = setCells(book, e.sheet, [[e.r, e.c, entry(s, old?.st)]])
      apply(next)
    }
    setEdit(null)
    dragRef.current = null
    if (e.sheet !== si) setSi(e.sheet)
    const d = { down: [1, 0], up: [-1, 0], right: [0, 1], left: [0, -1], none: [0, 0] }[move]
    const m = mergeAt(target, e.r, e.c)
    const r = move === 'down' && m ? m.r2 + 1 : e.r + d[0]
    const c = move === 'right' && m ? m.c2 + 1 : e.c + d[1]
    setSel({ a: { r: Math.max(0, Math.min(R - 1, r)), c: Math.max(0, Math.min(C - 1, c)) }, f: { r: Math.max(0, Math.min(R - 1, r)), c: Math.max(0, Math.min(C - 1, c)) } })
    focusGrid()
  }

  const cancel = () => {
    if (edit && edit.sheet !== si) setSi(edit.sheet)
    setEdit(null)
    dragRef.current = null
    focusGrid()
  }

  // insert a reference while building a formula (Point mode)
  const pointAt = (r: number, c: number, extendFrom?: { r: number; c: number }) => {
    const d = dragRef.current
    setEdit(e => {
      if (!e) return e
      const prefix = si !== e.sheet ? quoteSheet(sheet.name) + '!' : ''
      const ref = prefix + (extendFrom && (extendFrom.r !== r || extendFrom.c !== c) ? addr(Math.min(extendFrom.r, r), Math.min(extendFrom.c, c)) + ':' + addr(Math.max(extendFrom.r, r), Math.max(extendFrom.c, c)) : addr(r, c))
      const start = d && d.mode === 'point' ? d.start : e.draft.length
      return { ...e, draft: e.draft.slice(0, start) + ref }
    })
  }

  // ---------- pointer handling ----------

  const cellFromPoint = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-r]') as HTMLElement | null
    if (!el || !gridRef.current?.contains(el)) return null
    return { r: Number(el.dataset.r), c: Number(el.dataset.c) }
  }

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d || (d.mode === 'point' && !d.down)) return
      // auto-scroll the grid when dragging past its edges, as Excel does
      let x = e.clientX
      let y = e.clientY
      const g = gridRef.current
      if (g) {
        const r = g.getBoundingClientRect()
        if (y > r.bottom - 8) g.scrollTop += 22
        else if (y < r.top + (headings ? HEAD_H : 0) + 8) g.scrollTop -= 22
        if (x > r.right - 8) g.scrollLeft += 30
        else if (x < r.left + (headings ? RH_W : 0) + 8) g.scrollLeft -= 30
        x = Math.min(Math.max(x, r.left + (headings ? RH_W : 0) + 4), r.right - 6)
        y = Math.min(Math.max(y, r.top + (headings ? HEAD_H : 0) + 4), r.bottom - 6)
      }
      const p = cellFromPoint(x, y)
      if (!p) return
      if (d.mode === 'select') setSel(s => (s.f.r === p.r && s.f.c === p.c ? s : { a: s.a, f: p }))
      else if (d.mode === 'point' && d.down) pointAt(p.r, p.c, d.anchor)
      else if (d.mode === 'fill') {
        const x = d.x
        const down = p.r - x.r2
        const up = x.r1 - p.r
        const right = p.c - x.c2
        const left = x.c1 - p.c
        const best = Math.max(down, up, right, left)
        if (best <= 0) setFillPreview(null)
        else if (best === down) setFillPreview({ dir: 'down', count: down })
        else if (best === up) setFillPreview({ dir: 'up', count: up })
        else if (best === right) setFillPreview({ dir: 'right', count: right })
        else setFillPreview({ dir: 'left', count: left })
      }
    }
    const up = () => {
      const d = dragRef.current
      if (!d) return
      if (d.mode === 'fill') {
        const fp = latest.current.fillPreview
        if (fp) {
          const { book: b, si: idx } = latest.current
          const next = fillRange(b, idx, d.x, fp.dir, fp.count)
          setUndo(u => [...u.slice(-59), b])
          setRedo([])
          setBook(next)
          const x = d.x
          const ext = fp.dir === 'down' ? rect(x.r1, x.c1, x.r2 + fp.count, x.c2) : fp.dir === 'up' ? rect(x.r1 - fp.count, x.c1, x.r2, x.c2) : fp.dir === 'right' ? rect(x.r1, x.c1, x.r2, x.c2 + fp.count) : rect(x.r1, x.c1 - fp.count, x.r2, x.c2)
          setSel({ a: { r: Math.max(0, ext.r1), c: Math.max(0, ext.c1) }, f: { r: ext.r2, c: ext.c2 } })
          setNote(fp.dir === 'down' || fp.dir === 'up' ? 'Filled — relative references moved down/up with each row; $-locked parts stayed put.' : 'Filled — relative references moved across with each column; $-locked parts stayed put.')
        }
        setFillPreview(null)
      }
      if (d.mode === 'point') {
        dragRef.current = { ...d, down: false }
        return
      }
      dragRef.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  })

  const onCellDown = (e: React.PointerEvent, r: number, c: number) => {
    if (e.button !== 0) return
    setNote(null)
    if (edit && pointable(edit.draft)) {
      e.preventDefault()
      dragRef.current = { mode: 'point', start: edit.draft.length, anchor: { r, c }, down: true }
      pointAt(r, c)
      return
    }
    const d = dragRef.current
    if (edit && d?.mode === 'point' && edit.draft.length > d.start) {
      e.preventDefault()
      dragRef.current = { ...d, anchor: e.shiftKey ? d.anchor : { r, c }, down: true }
      pointAt(r, c, e.shiftKey ? d.anchor : undefined)
      return
    }
    if (edit) commit('none')
    if (e.shiftKey) setSel(s => ({ a: s.a, f: { r, c } }))
    else {
      const m = mergeAt(sheet, r, c)
      setSel({ a: m ? { r: m.r1, c: m.c1 } : { r, c }, f: m ? { r: m.r2, c: m.c2 } : { r, c } })
    }
    if (e.pointerType === 'mouse') dragRef.current = { mode: 'select' }
    focusGrid()
  }

  // ---------- commands ----------

  const run = (fn: () => void) => {
    if (edit) commit('none')
    fn()
    focusGrid()
  }

  const setStyle = (fn: (st: Style) => Style) => run(() => apply(styleRange(book, si, selRect, fn)))

  const autoSum = (fnName: 'SUM' | 'AVERAGE' | 'COUNT' | 'MAX' | 'MIN') => {
    if (edit) commit('none')
    const x = selRect
    if (x.r1 !== x.r2 || x.c1 !== x.c2) {
      const updates: [number, number, ReturnType<typeof entry>][] = []
      for (let c = x.c1; c <= x.c2; c++) {
        let r = x.r2 + 1
        const lastFilled = ev.value(sheet, x.r2, c)
        if (lastFilled === null) r = x.r2
        updates.push([r, c, entry(`=${fnName}(${addr(x.r1, c)}:${addr(r - 1, c)})`, sheet.cells[cellKey(r, c)]?.st)])
      }
      apply(setCells(book, si, updates))
      return
    }
    const { r, c } = active
    const isNum = (rr: number, cc: number) => typeof ev.value(sheet, rr, cc) === 'number'
    let range = ''
    if (r > 0 && isNum(r - 1, c)) {
      let top = r - 1
      while (top > 0 && isNum(top - 1, c)) top--
      range = `${addr(top, c)}:${addr(r - 1, c)}`
    } else if (c > 0 && isNum(r, c - 1)) {
      let left = c - 1
      while (left > 0 && isNum(r, left - 1)) left--
      range = `${addr(r, left)}:${addr(r, c - 1)}`
    }
    setEdit({ sheet: si, r, c, draft: `=${fnName}(${range}`, mode: 'enter', inCell: true })
    setNote(range ? `Excel guessed ${range}. Press Enter to accept, or drag over different cells first.` : 'Drag over the cells to use, then press Enter.')
    dragRef.current = range ? { mode: 'point', start: `=${fnName}(`.length, anchor: parseAddr(range.split(':')[0])!, down: false } : null
  }

  const insertFunction = (name: string) => {
    if (!name) return
    if (edit) {
      setEdit({ ...edit, draft: edit.draft + (edit.draft.startsWith('=') ? '' : '=') + name + '(' })
      dragRef.current = null
      requestAnimationFrame(() => (edit.inCell ? cellInputRef : barRef).current?.focus())
      return
    }
    startEdit(`=${name}(`, 'enter')
  }

  const doCopy = (cut: boolean) => {
    if (edit) return
    setClip({ id: sheet.id, x: selRect, cut })
    setNote(cut ? 'Cut — click the destination cell and Paste. The moving border shows what will move.' : 'Copied — click where the top-left cell should go, then Paste. Press Esc to cancel the moving border.')
  }

  const doPaste = (mode: PasteMode = 'all') =>
    run(() => {
      if (!clip) return setNote('Nothing to paste — Copy or Cut some cells first.')
      const idx = book.sheets.findIndex(s => s.id === clip.id)
      if (idx < 0) return setClip(null)
      const { book: next, x } = pasteRange(book, ev, { idx, x: clip.x, cut: clip.cut }, si, active, mode)
      apply(next)
      setSel({ a: { r: x.r1, c: x.c1 }, f: { r: x.r2, c: x.c2 } })
      if (clip.cut) setClip(null)
      setNote(mode === 'values' ? 'Pasted values only — the results, not the formulas.' : mode === 'transpose' ? 'Pasted with rows and columns swapped.' : mode === 'formats' ? 'Pasted formatting only.' : null)
    })

  const toggleMerge = () =>
    run(() => {
      const existing = sheet.merges.find(m => overlaps(m, selRect))
      if (existing) return apply(unmerge(book, si, selRect))
      if (selRect.r1 === selRect.r2 && selRect.c1 === selRect.c2) return
      let others = 0
      for (let r = selRect.r1; r <= selRect.r2; r++) for (let c = selRect.c1; c <= selRect.c2; c++) if ((r !== selRect.r1 || c !== selRect.c1) && (sheet.cells[cellKey(r, c)]?.raw ?? '') !== '') others++
      const doIt = () => {
        apply(mergeRange(book, si, selRect))
        setSel({ a: { r: selRect.r1, c: selRect.c1 }, f: { r: selRect.r1, c: selRect.c1 } })
      }
      if (others) setDialog({ title: 'Microsoft Excel', text: 'Merging cells only keeps the upper-left value and discards other values.', cancel: true, onOk: doIt })
      else doIt()
    })

  const structure = (what: string) =>
    run(() => {
      const x = selRect
      if (what === 'ins-row') apply(insertLines(book, si, 'row', x.r1, x.r2 - x.r1 + 1))
      else if (what === 'ins-col') apply(insertLines(book, si, 'col', x.c1, x.c2 - x.c1 + 1))
      else if (what === 'del-row') apply(insertLines(book, si, 'row', x.r1, -(x.r2 - x.r1 + 1)))
      else if (what === 'del-col') apply(insertLines(book, si, 'col', x.c1, -(x.c2 - x.c1 + 1)))
      else if (what === 'ins-sheet') {
        const { book: next, idx } = addSheet(book, si)
        apply(next)
        setSi(idx)
      } else if (what === 'del-sheet') removeSheet(si)
    })

  const removeSheet = (idx: number) => {
    if (book.sheets.length === 1) return setDialog({ title: 'Microsoft Excel', text: 'A workbook must contain at least one visible worksheet.' })
    const doIt = () => {
      apply(deleteSheet(book, idx), { clearHistory: true })
      setSi(Math.max(0, idx - 1))
      setClip(null)
      setNote('Sheet deleted. Undo cannot bring a deleted worksheet back — that is why Excel warns you first.')
    }
    if (Object.keys(book.sheets[idx].cells).length) setDialog({ title: 'Microsoft Excel', text: 'Microsoft Excel will permanently delete this sheet. Do you want to continue?', okLabel: 'Delete', cancel: true, onOk: doIt })
    else doIt()
  }

  const startRename = (idx: number) => {
    if (edit) commit('none')
    setRenaming({ idx, value: book.sheets[idx].name })
  }
  const finishRename = () => {
    if (!renaming) return
    const { idx, value } = renaming
    setRenaming(null)
    if (value.trim() === book.sheets[idx].name) return
    const bad = validSheetName(book, value, idx)
    if (bad) return setDialog({ title: 'Microsoft Excel', text: bad })
    apply(renameSheet(book, idx, value))
  }

  const formatCmd = (what: string) =>
    run(() => {
      const x = selRect
      if (what === 'autofit-col') {
        let colWs = { ...sheet.colW }
        for (let c = x.c1; c <= x.c2; c++) {
          let w = 0
          for (let r = 0; r < R; r++) {
            const m = mergeAt(sheet, r, c)
            if (m && (m.c1 !== m.c2 || m.r1 !== r)) continue
            const d = display(sheet, r, c, 100000)
            if (d.text) w = Math.max(w, measure(d.text, sheet.cells[cellKey(r, c)]?.st?.b) + 10)
          }
          colWs = { ...colWs, [c]: w ? Math.ceil(w) : DEFAULT_COL_W }
        }
        apply(setSheetProp(book, si, { colW: colWs }))
      } else if (what === 'autofit-row') {
        const rh = { ...sheet.rowH }
        for (let r = x.r1; r <= x.r2; r++) delete rh[r]
        apply(setSheetProp(book, si, { rowH: rh }))
      } else if (what === 'col-width' || what === 'row-height') {
        const isCol = what === 'col-width'
        const cur = isCol ? colW(x.c1) : rowH(x.r1)
        setDialogValue(isCol ? ((cur - 5) / 7).toFixed(2) : String(Math.round(cur * 0.75 * 100) / 100))
        setDialog({
          title: isCol ? 'Column Width' : 'Row Height',
          text: isCol ? 'Column width (characters of the default font; 8.43 is the default):' : 'Row height (points; 15 is the default):',
          input: 'value',
          cancel: true,
          onOk: v => {
            const n = parseFloat(v)
            if (!(n >= 0) || n > (isCol ? 255 : 409)) return setDialog({ title: 'Microsoft Excel', text: isCol ? 'Column width must be between 0 and 255 characters.' : 'Row height must be between 0 and 409 points.' })
            if (isCol) {
              const colWs = { ...sheet.colW }
              for (let c = x.c1; c <= x.c2; c++) colWs[c] = Math.round(n * 7 + 5)
              apply(setSheetProp(book, si, { colW: colWs }))
            } else {
              const rh = { ...sheet.rowH }
              for (let r = x.r1; r <= x.r2; r++) rh[r] = Math.round(n / 0.75)
              apply(setSheetProp(book, si, { rowH: rh }))
            }
          },
        })
      } else if (what === 'rename') startRename(si)
      else if (what.startsWith('tab:')) apply(setSheetProp(book, si, { tab: what.slice(4) || undefined }))
    })

  const freeze = (what: string) =>
    run(() => {
      if (what === 'unfreeze') return apply(setSheetProp(book, si, { freeze: null }))
      if (what === 'top') return apply(setSheetProp(book, si, { freeze: { r: 1, c: 0 } }))
      if (what === 'first') return apply(setSheetProp(book, si, { freeze: { r: 0, c: 1 } }))
      if (active.r === 0 && active.c === 0) return setNote('Click the cell below and to the right of the rows and columns you want to keep visible (e.g. B2), then choose Freeze Panes.')
      apply(setSheetProp(book, si, { freeze: { r: active.r, c: active.c } }))
      setNote(`Frozen: ${active.r ? `rows 1–${active.r}` : 'no rows'} and ${active.c ? `columns A–${colName(active.c - 1)}` : 'no columns'} stay visible while you scroll.`)
    })

  const sort = (desc: boolean) =>
    run(() => {
      let x = selRect
      if (x.r1 === x.r2 && x.c1 === x.c2) {
        // expand to the surrounding block of data, like Excel does
        const filled = (r: number, c: number) => (sheet.cells[cellKey(r, c)]?.raw ?? '') !== ''
        let { r1, r2, c1, c2 } = x
        while (r1 > 0 && filled(r1 - 1, x.c1)) r1--
        while (r2 < R - 1 && filled(r2 + 1, x.c1)) r2++
        while (c1 > 0 && filled(r1, c1 - 1)) c1--
        while (c2 < C - 1 && filled(r1, c2 + 1)) c2++
        x = rect(r1, c1, r2, c2)
      }
      const { book: next, header } = sortRows(book, si, ev, x, active.c, desc)
      apply(next)
      setSel({ a: { r: x.r1, c: x.c1 }, f: { r: x.r2, c: x.c2 } })
      setNote(`Sorted ${addr(x.r1, x.c1)}:${addr(x.r2, x.c2)} by column ${colName(active.c)} ${desc ? 'largest → smallest / Z → A' : 'smallest → largest / A → Z'}${header ? ' (row ' + (x.r1 + 1) + ' treated as headers)' : ''}. Whole rows moved together.`)
    })

  const reset = () => {
    setBook(spec.book)
    setUndo([])
    setRedo([])
    setSi(spec.active)
    const s = spec.select ?? rect(0, 0)
    setSel({ a: { r: s.r1, c: s.c1 }, f: { r: s.r2, c: s.c2 } })
    setEdit(null)
    setClip(null)
    setNote(null)
    setShowFormulas(false)
  }

  // ---------- keyboard ----------

  const onGridKey = (e: React.KeyboardEvent) => {
    if (edit?.inCell || renaming || dialog) return
    const ctrl = e.ctrlKey || e.metaKey
    const k = e.key
    if (ctrl) {
      const lk = k.toLowerCase()
      const map: Record<string, () => void> = {
        c: () => doCopy(false),
        x: () => doCopy(true),
        v: () => doPaste('all'),
        z: undo,
        y: redo,
        b: () => setStyle(st => ({ ...st, b: !activeCell?.st?.b })),
        i: () => setStyle(st => ({ ...st, i: !activeCell?.st?.i })),
        a: () => setSel({ a: { r: 0, c: 0 }, f: { r: R - 1, c: C - 1 } }),
        '`': () => setShowFormulas(v => !v),
      }
      if (map[lk]) {
        e.preventDefault()
        map[lk]()
      }
      return
    }
    const moves: Record<string, [number, number]> = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] }
    if (moves[k]) {
      e.preventDefault()
      const from = e.shiftKey ? sel.f : active
      const m = mergeAt(sheet, from.r, from.c)
      const [dr, dc] = moves[k]
      const r = dr > 0 && m ? m.r2 + 1 : dr < 0 && m ? m.r1 - 1 : from.r + dr
      const c = dc > 0 && m ? m.c2 + 1 : dc < 0 && m ? m.c1 - 1 : from.c + dc
      select(r, c, e.shiftKey)
      return
    }
    if (k === 'Enter' || k === 'Tab') {
      e.preventDefault()
      const m = mergeAt(sheet, active.r, active.c)
      if (k === 'Enter') select(e.shiftKey ? active.r - 1 : m ? m.r2 + 1 : active.r + 1, active.c)
      else select(active.r, e.shiftKey ? active.c - 1 : m ? m.c2 + 1 : active.c + 1)
      return
    }
    if (k === 'F2') {
      e.preventDefault()
      return startEdit(activeCell?.raw ?? '', 'edit')
    }
    if (k === 'F9') {
      e.preventDefault()
      return setTick(t => t + 1)
    }
    if (k === 'Delete' || k === 'Backspace') {
      e.preventDefault()
      return apply(clearRange(book, si, selRect, 'contents'))
    }
    if (k === 'Escape') {
      setClip(null)
      setNote(null)
      return
    }
    if (k.length === 1 && !e.altKey) {
      e.preventDefault()
      setNote(null)
      startEdit(k, 'enter')
    }
  }

  const onEditKey = (e: React.KeyboardEvent<HTMLInputElement>, inCell: boolean) => {
    if (!edit) return
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(e.shiftKey ? 'up' : 'down')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      commit(e.shiftKey ? 'left' : 'right')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    } else if (inCell && edit.mode === 'enter' && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !pointable(edit.draft)) {
      e.preventDefault()
      commit(({ ArrowDown: 'down', ArrowUp: 'up', ArrowLeft: 'left', ArrowRight: 'right' } as const)[e.key as 'ArrowDown'])
    }
  }

  useEffect(() => {
    if (edit?.inCell && edit.sheet === si) {
      const el = cellInputRef.current
      if (el && document.activeElement !== el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      }
    }
  }, [edit, si])

  // ---------- derived view data ----------

  const editRefs = edit && edit.draft.startsWith('=') ? formulaRefs(edit.draft, book.sheets[edit.sheet].name) : []
  const refBoxes = editRefs.map((x, i) => ({ ...x, color: REF_COLORS[i % REF_COLORS.length] })).filter(x => x.sheet.toLowerCase() === sheet.name.toLowerCase())
  const fillBox = fillPreview && dragRef.current?.mode === 'fill' ? (() => {
    const x = (dragRef.current as { x: Rect }).x
    const n = fillPreview.count
    return fillPreview.dir === 'down' ? rect(x.r2 + 1, x.c1, x.r2 + n, x.c2) : fillPreview.dir === 'up' ? rect(x.r1 - n, x.c1, x.r1 - 1, x.c2) : fillPreview.dir === 'right' ? rect(x.r1, x.c2 + 1, x.r2, x.c2 + n) : rect(x.r1, x.c1 - n, x.r2, x.c1 - 1)
  })() : null
  const clipBox = clip && clip.id === sheet.id ? clip.x : null

  const frozen = sheet.freeze
  const heights = Array.from({ length: R }, (_, r) => rowH(r))
  const stickyTop = (r: number) => {
    let t = headings ? HEAD_H : 0
    for (let i = 0; i < r; i++) t += heights[i]
    return t
  }
  const stickyLeft = (c: number) => {
    let l = headings ? RH_W : 0
    for (let i = 0; i < c; i++) l += colW(i)
    return l
  }

  // aggregates for the status bar
  const status = (() => {
    const x = selRect
    if (x.r1 === x.r2 && x.c1 === x.c2) return null
    let count = 0
    let nums = 0
    let sum = 0
    for (let r = x.r1; r <= Math.min(x.r2, R - 1); r++)
      for (let c = x.c1; c <= Math.min(x.c2, C - 1); c++) {
        const v = ev.value(sheet, r, c)
        if (v === null) continue
        count++
        if (typeof v === 'number') {
          nums++
          sum += v
        }
      }
    if (!count) return null
    const f = (n: number) => String(Number(n.toPrecision(10)))
    return nums ? `Average: ${f(sum / nums)}    Count: ${count}    Sum: ${f(sum)}` : `Count: ${count}`
  })()

  const modeLabel = edit ? (dragRef.current?.mode === 'point' ? 'Point' : edit.mode === 'edit' ? 'Edit' : 'Enter') : 'Ready'
  const tip = edit ? openFunction(edit.draft) : null

  // ---------- render helpers ----------

  const btn = 'h-7 min-w-7 px-1.5 rounded border border-transparent hover:border-[#c6c6c6] hover:bg-[#e8f2ea] text-[12px] text-[#222] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent'
  const btnOn = 'border-[#86bf9d] bg-[#d3eadb]'
  const sel_ = 'h-7 rounded border border-[#c6c6c6] bg-white px-0.5 text-[12px] text-[#222]'
  const group = (label: string, body: React.ReactNode) => (
    <div className="flex flex-col items-center shrink-0 border-r border-[#e1e1e1] pr-2 mr-2 last:border-r-0 last:mr-0">
      <div className="flex flex-nowrap items-center gap-0.5">{body}</div>
      <span className="text-[9.5px] text-[#777] text-center mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  )
  const choose = (placeholder: string, options: [string, string][], onPick: (v: string) => void, title?: string, width?: number) => (
    <select
      aria-label={title ?? placeholder}
      title={title}
      className={sel_}
      style={{ width }}
      value=""
      onChange={e => {
        const v = e.target.value
        e.target.value = ''
        onPick(v)
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(([v, l]) => (
        <option key={v || l} value={v}>
          {l}
        </option>
      ))}
    </select>
  )

  const st = activeCell?.st ?? {}

  const boxShadowFor = (r: number, c: number, r2: number, c2: number) => {
    const shadows: string[] = []
    const edge = (x: Rect, color: string, w: number) => {
      if (r2 < x.r1 || r > x.r2 || c2 < x.c1 || c > x.c2) return
      if (r === x.r1 || (r < x.r1 && r2 >= x.r1)) shadows.push(`inset 0 ${w}px 0 0 ${color}`)
      if (r2 === x.r2 || (r2 > x.r2 && r <= x.r2)) shadows.push(`inset 0 -${w}px 0 0 ${color}`)
      if (c === x.c1 || (c < x.c1 && c2 >= x.c1)) shadows.push(`inset ${w}px 0 0 0 ${color}`)
      if (c2 === x.c2 || (c2 > x.c2 && c <= x.c2)) shadows.push(`inset -${w}px 0 0 0 ${color}`)
    }
    for (const b of refBoxes) edge(b, b.color, 2)
    if (fillBox) edge(fillBox, '#7a7a7a', 1)
    if (clipBox) edge(clipBox, '#217346', 1)
    if (!edit || edit.sheet === si) edge(selRect, GREEN, 2)
    return shadows.join(', ')
  }

  const hideRight = new Set<string>()

  const renderCell = (r: number, c: number) => {
    const k = cellKey(r, c)
    const m = mergeAt(sheet, r, c)
    if (m && (m.r1 !== r || m.c1 !== c)) return null
    const r2 = m ? m.r2 : r
    const c2 = m ? m.c2 : c
    let width = 0
    for (let i = c; i <= c2; i++) width += colW(i)
    const cell = sheet.cells[k]
    const cst = cell?.st ?? {}
    const barEditing = edit && !edit.inCell && edit.sheet === si && edit.r === r && edit.c === c
    const d = barEditing ? { text: edit.draft, align: 'left' as const, kind: 'text' as const } : display(sheet, r, c, width)
    const wrap = !!cst.wrap && !showFormulas
    // text overflows into empty neighbours on the right, as in Excel
    let spillW = width
    if (!wrap && !m && d.kind === 'text' && d.align === 'left' && measure(d.text, cst.b) > width - 6) {
      let cc = c + 1
      while (cc < C && spillW - 6 < measure(d.text, cst.b)) {
        const nb = sheet.cells[cellKey(r, cc)]
        if ((nb?.raw ?? '') !== '' || mergeAt(sheet, r, cc)) break
        hideRight.add(cellKey(r, cc - 1))
        spillW += colW(cc)
        cc++
      }
    }
    const inSel = inRect(selRect, r, c) && !(r === active.r && c === active.c) && (!edit || edit.sheet === si)
    const isFrozenRow = frozen && r < frozen.r
    const isFrozenCol = frozen && c < frozen.c
    const editingHere = edit && edit.inCell && edit.sheet === si && edit.r === r && edit.c === c
    const bottomRight = (!edit || edit.sheet === si) && r2 === selRect.r2 && c2 === selRect.c2 && !editingHere
    const style: React.CSSProperties = {
      position: isFrozenRow || isFrozenCol ? 'sticky' : 'relative',
      top: isFrozenRow ? stickyTop(r) : undefined,
      left: isFrozenCol ? stickyLeft(c) : undefined,
      zIndex: isFrozenRow && isFrozenCol ? 3 : isFrozenRow || isFrozenCol ? 2 : editingHere ? 4 : undefined,
      backgroundColor: cst.fill || (isFrozenRow || isFrozenCol ? '#fff' : undefined),
      backgroundImage: inSel ? 'linear-gradient(rgba(33,115,70,0.13), rgba(33,115,70,0.13))' : undefined,
      borderRight: `1px solid ${gridlines && !hideRight.has(k) ? GRID : cst.fill ? cst.fill : 'transparent'}`,
      borderBottom: `1px solid ${gridlines ? GRID : cst.fill ? cst.fill : 'transparent'}`,
      boxShadow: [boxShadowFor(r, c, r2, c2), frozen && r === frozen.r - 1 ? 'inset 0 -1px 0 0 #6b6b6b' : '', frozen && c === frozen.c - 1 ? 'inset -1px 0 0 0 #6b6b6b' : ''].filter(Boolean).join(', ') || undefined,
      padding: 0,
      overflow: 'visible',
      fontWeight: cst.b ? 700 : 400,
      fontStyle: cst.i ? 'italic' : 'normal',
      verticalAlign: 'bottom',
    }
    return (
      <td
        key={c}
        data-r={r}
        data-c={c}
        colSpan={c2 - c + 1}
        rowSpan={r2 - r + 1}
        style={style}
        onPointerDown={e => onCellDown(e, r, c)}
        onDoubleClick={() => {
          if (!edit) startEdit(cell?.raw ?? '', 'edit')
        }}
      >
        {editingHere ? (
          <input
            ref={cellInputRef}
            value={edit!.draft}
            onChange={e => {
              dragRef.current = null
              setEdit({ ...edit!, draft: e.target.value })
            }}
            onKeyDown={e => onEditKey(e, true)}
            spellCheck={false}
            className="absolute left-0 top-0 h-full outline-none px-[3px] text-[#111]"
            style={{ width: Math.max(width, measure(edit!.draft) + 16), font: FONT, background: '#fff', boxShadow: `inset 0 0 0 2px ${GREEN}`, zIndex: 6 }}
          />
        ) : (
          <div
            className="px-[3px] text-[#111] pointer-events-none"
            style={{
              position: wrap ? 'static' : 'absolute',
              left: 0,
              bottom: 0,
              width: wrap ? undefined : spillW,
              maxHeight: '100%',
              lineHeight: wrap ? '17px' : `${DEFAULT_ROW_H - 2}px`,
              whiteSpace: wrap ? 'normal' : 'pre',
              overflow: 'hidden',
              textAlign: d.align,
              color: d.text.startsWith('#') && d.kind !== 'num' ? '#c00000' : undefined,
              zIndex: 1,
              wordBreak: wrap ? 'break-word' : undefined,
            }}
          >
            {d.text}
          </div>
        )}
        {bottomRight && (
          <div
            role="presentation"
            title="Fill handle — drag to copy or continue a series"
            onPointerDown={e => {
              e.stopPropagation()
              e.preventDefault()
              if (edit) commit('none')
              dragRef.current = { mode: 'fill', x: selRect }
            }}
            className="absolute z-[4] cursor-crosshair"
            style={{ right: -4, bottom: -4, width: 8, height: 8, background: GREEN, border: '1px solid #fff', touchAction: 'none' }}
          />
        )}
      </td>
    )
  }

  if (!mounted) {
    return (
      <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden">
        <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📊 {title ?? 'Excel worksheet'}</p>
        <div className="m-3 h-40 rounded-md bg-[#f3f3f3] animate-pulse" />
      </div>
    )
  }

  const totalW = (headings ? RH_W : 0) + Array.from({ length: C }, (_, c) => colW(c)).reduce((s, w) => s + w, 0)
  const nameBoxValue = nameBox ?? (edit && edit.sheet !== si ? addr(edit.r, edit.c) : fillPreview ? `${Math.abs(fillPreview.count)}` : sel.a.r !== sel.f.r || sel.a.c !== sel.f.c ? (dragRef.current?.mode === 'select' ? `${selRect.r2 - selRect.r1 + 1}R x ${selRect.c2 - selRect.c1 + 1}C` : addr(active.r, active.c)) : addr(active.r, active.c))
  const barValue = edit ? edit.draft : activeCell?.raw ?? ''

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📊 {title ?? 'Excel worksheet'}</p>
        <button onClick={reset} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky shrink-0">
          Reset
        </button>
      </div>

      <div className="relative m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-white" style={{ font: FONT, color: '#222' }}>
        {/* title bar + ribbon tabs */}
        <div className="flex items-center gap-2 px-2 h-7 text-white text-[12px]" style={{ background: GREEN }}>
          <button onClick={undo} disabled={!undoStack.length} title="Undo (Ctrl+Z)" aria-label="Undo" className="px-1 disabled:opacity-40">
            ↶
          </button>
          <button onClick={redo} disabled={!redoStack.length} title="Redo (Ctrl+Y)" aria-label="Redo" className="px-1 disabled:opacity-40">
            ↷
          </button>
          <span className="flex-1 text-center truncate">Book1 - Excel</span>
        </div>
        <div className="flex text-[11.5px] font-semibold border-b border-[#d4d4d4] overflow-x-auto" style={{ background: GREEN }}>
          {(['home', 'formulas', 'data', 'view'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 uppercase tracking-wide ${tab === t ? 'bg-[#f3f3f3] text-[#217346]' : 'text-white/90 hover:bg-white/10'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-nowrap items-start px-2 py-1.5 bg-[#f3f3f3] border-b border-[#d4d4d4] overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
          {tab === 'home' && (
            <>
              {group(
                'Clipboard',
                <>
                  <button className={btn} onClick={() => doPaste('all')} title="Paste (Ctrl+V)">
                    📋 Paste
                  </button>
                  {choose('▾', [['values', 'Paste Values'], ['formulas', 'Paste Formulas'], ['formats', 'Paste Formatting'], ['transpose', 'Transpose']], v => doPaste(v as PasteMode), 'Paste options', 34)}
                  <button className={btn} onClick={() => doCopy(true)} title="Cut (Ctrl+X)" aria-label="Cut">
                    ✂
                  </button>
                  <button className={btn} onClick={() => doCopy(false)} title="Copy (Ctrl+C)">
                    ⧉ Copy
                  </button>
                </>
              )}
              {group(
                'Font',
                <>
                  <button className={`${btn} font-bold ${st.b ? btnOn : ''}`} onClick={() => setStyle(s => ({ ...s, b: !st.b }))} title="Bold (Ctrl+B)">
                    B
                  </button>
                  <button className={`${btn} italic font-serif ${st.i ? btnOn : ''}`} onClick={() => setStyle(s => ({ ...s, i: !st.i }))} title="Italic (Ctrl+I)">
                    I
                  </button>
                  {choose('Fill', FILLS, v => setStyle(s => ({ ...s, fill: v || undefined })), 'Fill Colour', 52)}
                </>
              )}
              {group(
                'Alignment',
                <>
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button key={a} className={`${btn} ${st.align === a ? btnOn : ''}`} onClick={() => setStyle(s => ({ ...s, align: s.align === a ? undefined : a }))} title={`Align ${a === 'center' ? 'Centre' : a[0].toUpperCase() + a.slice(1)}`} aria-label={`Align ${a}`}>
                      {a === 'left' ? '⇤' : a === 'center' ? '↔' : '⇥'}
                    </button>
                  ))}
                  <button className={`${btn} ${st.wrap ? btnOn : ''}`} onClick={() => setStyle(s => ({ ...s, wrap: !st.wrap }))} title="Wrap Text">
                    Wrap
                  </button>
                  <button className={`${btn} ${sheet.merges.some(m => overlaps(m, selRect)) ? btnOn : ''}`} onClick={toggleMerge} title="Merge & Centre">
                    Merge
                  </button>
                </>
              )}
              {group(
                'Number',
                <>
                  <select
                    aria-label="Number format"
                    className={sel_}
                    style={{ width: 98 }}
                    value={st.fmt ?? 'general'}
                    onChange={e => {
                      const fmt = e.target.value as NumFormat
                      setStyle(s => ({ ...s, fmt, dec: undefined }))
                    }}
                  >
                    <option value="general">General</option>
                    <option value="number">Number</option>
                    <option value="currency">Currency (₦)</option>
                    <option value="comma">Comma Style</option>
                    <option value="percent">Percentage</option>
                    <option value="date">Short Date</option>
                  </select>
                  <button className={btn} title="Increase Decimal" onClick={() => setStyle(s => ({ ...s, dec: Math.min(10, (s.dec ?? ({ number: 2, comma: 2, currency: 2, percent: 0 } as Record<string, number>)[s.fmt ?? ''] ?? 0) + 1) }))}>
                    .0→.00
                  </button>
                  <button className={btn} title="Decrease Decimal" onClick={() => setStyle(s => ({ ...s, dec: Math.max(0, (s.dec ?? ({ number: 2, comma: 2, currency: 2, percent: 0 } as Record<string, number>)[s.fmt ?? ''] ?? 2) - 1) }))}>
                    .00→.0
                  </button>
                </>
              )}
              {group(
                'Cells',
                <>
                  {choose('Insert', [['ins-row', 'Insert Sheet Rows'], ['ins-col', 'Insert Sheet Columns'], ['ins-sheet', 'Insert Sheet']], structure, 'Insert', 62)}
                  {choose('Delete', [['del-row', 'Delete Sheet Rows'], ['del-col', 'Delete Sheet Columns'], ['del-sheet', 'Delete Sheet']], structure, 'Delete', 62)}
                  {choose(
                    'Format',
                    [['row-height', 'Row Height…'], ['autofit-row', 'AutoFit Row Height'], ['col-width', 'Column Width…'], ['autofit-col', 'AutoFit Column Width'], ['rename', 'Rename Sheet'], ...TAB_COLORS.map(([v, l]) => [`tab:${v}`, `Tab Colour: ${l}`] as [string, string])],
                    formatCmd,
                    'Format',
                    66
                  )}
                </>
              )}
              {group(
                'Editing',
                <>
                  <button className={btn} onClick={() => autoSum('SUM')} title="AutoSum">
                    Σ AutoSum
                  </button>
                  {choose('▾', [['SUM', 'Sum'], ['AVERAGE', 'Average'], ['COUNT', 'Count Numbers'], ['MAX', 'Max'], ['MIN', 'Min']], v => autoSum(v as 'SUM'), 'AutoSum options', 34)}
                  {choose('Clear', [['contents', 'Clear Contents'], ['formats', 'Clear Formats'], ['all', 'Clear All']], v => run(() => apply(clearRange(book, si, selRect, v as 'all'))), 'Clear', 56)}
                </>
              )}
            </>
          )}
          {tab === 'formulas' && (
            <>
              {group(
                'Function Library',
                <>
                  <select
                    aria-label="Insert function"
                    className={sel_}
                    style={{ width: 150 }}
                    value=""
                    onChange={e => {
                      const v = e.target.value
                      e.target.value = ''
                      insertFunction(v)
                    }}
                  >
                    <option value="">fx Insert Function…</option>
                    {FUNCTION_GROUPS.map(([g, names]) => (
                      <optgroup key={g} label={g}>
                        {names.map(n => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button className={btn} onClick={() => autoSum('SUM')}>
                    Σ AutoSum
                  </button>
                </>
              )}
              {group(
                'Formula Auditing',
                <button className={`${btn} ${showFormulas ? btnOn : ''}`} onClick={() => setShowFormulas(v => !v)} title="Show Formulas (Ctrl+`)">
                  Show Formulas
                </button>
              )}
              {group(
                'Calculation',
                <button className={btn} onClick={() => setTick(t => t + 1)} title="Calculate Now (F9)">
                  Calculate Now (F9)
                </button>
              )}
            </>
          )}
          {tab === 'data' &&
            group(
              'Sort & Filter',
              <>
                <button className={btn} onClick={() => sort(false)} title="Sort Smallest to Largest / A to Z">
                  A→Z ↓
                </button>
                <button className={btn} onClick={() => sort(true)} title="Sort Largest to Smallest / Z to A">
                  Z→A ↓
                </button>
              </>
            )}
          {tab === 'view' && (
            <>
              {group(
                'Show',
                <>
                  <label className="flex items-center gap-1 text-[12px] px-1">
                    <input type="checkbox" checked={gridlines} onChange={e => setGridlines(e.target.checked)} /> Gridlines
                  </label>
                  <label className="flex items-center gap-1 text-[12px] px-1">
                    <input type="checkbox" checked={headings} onChange={e => setHeadings(e.target.checked)} /> Headings
                  </label>
                </>
              )}
              {group('Window', choose('Freeze Panes', [[frozen ? 'unfreeze' : 'panes', frozen ? 'Unfreeze Panes' : 'Freeze Panes'], ['top', 'Freeze Top Row'], ['first', 'Freeze First Column']], freeze, 'Freeze Panes', 112))}
              {group(
                'Formulas',
                <button className={`${btn} ${showFormulas ? btnOn : ''}`} onClick={() => setShowFormulas(v => !v)}>
                  Show Formulas
                </button>
              )}
            </>
          )}
        </div>

        {/* name box + formula bar */}
        <div className="flex items-center gap-1 px-1.5 py-1 border-b border-[#d4d4d4] bg-white">
          <input
            aria-label="Name Box"
            value={nameBoxValue}
            onFocus={e => {
              setNameBox(addr(active.r, active.c))
              requestAnimationFrame(() => e.target.select())
            }}
            onChange={e => setNameBox(e.target.value)}
            onBlur={() => setNameBox(null)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const x = parseRange((nameBox ?? '').replace(/\$/g, ''))
                if (!x || x.r2 >= R || x.c2 >= C) setDialog({ title: 'Microsoft Excel', text: 'Reference isn’t valid.' })
                else {
                  setSel({ a: { r: x.r1, c: x.c1 }, f: { r: x.r2, c: x.c2 } })
                  setNameBox(null)
                  focusGrid()
                }
              } else if (e.key === 'Escape') {
                setNameBox(null)
                focusGrid()
              }
            }}
            className="w-[74px] shrink-0 h-6 border border-[#c6c6c6] px-1 text-[12px] outline-none focus:border-[#217346]"
          />
          <button onClick={cancel} disabled={!edit} title="Cancel (Esc)" aria-label="Cancel entry" className="w-5 text-[#c00000] disabled:text-[#bbb] text-[14px]">
            ✕
          </button>
          <button onClick={() => commit('none')} disabled={!edit} title="Enter" aria-label="Enter" className="w-5 text-[#217346] disabled:text-[#bbb] text-[14px]">
            ✓
          </button>
          <button onClick={() => setTab('formulas')} title="Insert Function" className="w-6 italic font-serif text-[13px] text-[#555]">
            fx
          </button>
          <input
            ref={barRef}
            aria-label="Formula bar"
            value={barValue}
            spellCheck={false}
            onFocus={() => {
              if (!edit) setEdit({ sheet: si, r: active.r, c: active.c, draft: activeCell?.raw ?? '', mode: 'edit', inCell: false })
              else if (edit.inCell) setEdit({ ...edit, inCell: false })
            }}
            onChange={e => {
              dragRef.current = null
              setEdit(prev => ({ ...(prev ?? { sheet: si, r: active.r, c: active.c, mode: 'edit' as const, inCell: false }), draft: e.target.value, inCell: false }))
            }}
            onKeyDown={e => onEditKey(e, false)}
            className="flex-1 min-w-0 h-6 border border-[#c6c6c6] px-1.5 text-[13px] outline-none focus:border-[#217346] font-[inherit]"
          />
        </div>
        {tip && SYNTAX[tip] && (
          <div className="px-2 py-1 text-[11.5px] bg-[#fffde8] border-b border-[#e8e2b0] text-[#444]">
            <span className="font-mono font-semibold">{SYNTAX[tip][0]}</span> — {SYNTAX[tip][1]}
          </div>
        )}

        {/* grid */}
        <div ref={gridRef} tabIndex={0} onKeyDown={onGridKey} className="relative overflow-auto outline-none select-none" style={{ maxHeight: parseInt(height ?? '300', 10) || 300, touchAction: 'pan-x pan-y', scrollPaddingTop: stickyTop(frozen?.r ?? 0), scrollPaddingLeft: stickyLeft(frozen?.c ?? 0) }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', width: totalW }}>
            <colgroup>
              {headings && <col style={{ width: RH_W }} />}
              {Array.from({ length: C }, (_, c) => (
                <col key={c} style={{ width: colW(c) }} />
              ))}
            </colgroup>
            {headings && (
              <thead>
                <tr style={{ height: HEAD_H }}>
                  <th
                    onPointerDown={e => {
                      e.preventDefault()
                      run(() => setSel({ a: { r: 0, c: 0 }, f: { r: R - 1, c: C - 1 } }))
                    }}
                    title="Select All"
                    className="sticky top-0 left-0 z-[10] bg-[#e6e6e6] border-r border-b border-[#bdbdbd] cursor-cell"
                  >
                    <span className="block ml-auto mr-0.5 mt-2 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-[#b0b0b0]" />
                  </th>
                  {Array.from({ length: C }, (_, c) => {
                    const on = c >= selRect.c1 && c <= selRect.c2
                    const frozenCol = frozen && c < frozen.c
                    return (
                      <th
                        key={c}
                        onPointerDown={e => {
                          if ((e.target as HTMLElement).dataset.resize) return
                          e.preventDefault()
                          run(() => setSel(s => (e.shiftKey ? { a: s.a, f: { r: R - 1, c } } : { a: { r: 0, c }, f: { r: R - 1, c } })))
                        }}
                        className="sticky top-0 text-[12px] font-normal border-r border-b border-[#bdbdbd] cursor-s-resize"
                        style={{ background: on ? '#d2d2d2' : '#e6e6e6', color: on ? GREEN : '#444', boxShadow: on ? `inset 0 -2px 0 0 ${GREEN}` : undefined, left: frozenCol ? stickyLeft(c) : undefined, zIndex: frozenCol ? 9 : 8 }}
                      >
                        {colName(c)}
                        <span
                          data-resize="1"
                          title="Drag to resize, double-click to AutoFit"
                          onPointerDown={e => {
                            e.stopPropagation()
                            e.preventDefault()
                            const startX = e.clientX
                            const startW = colW(c)
                            const base = book
                            let moved = false
                            const mv = (ev2: PointerEvent) => {
                              moved = true
                              setBook(b => setSheetProp(b, si, { colW: { ...b.sheets[si].colW, [c]: Math.max(0, Math.round(startW + ev2.clientX - startX)) } }))
                            }
                            const upH = () => {
                              window.removeEventListener('pointermove', mv)
                              window.removeEventListener('pointerup', upH)
                              if (moved) {
                                setUndo(u => [...u.slice(-59), base])
                                setRedo([])
                              }
                            }
                            window.addEventListener('pointermove', mv)
                            window.addEventListener('pointerup', upH)
                          }}
                          onDoubleClick={e => {
                            e.stopPropagation()
                            setSel({ a: { r: 0, c }, f: { r: R - 1, c } })
                            let w = 0
                            for (let r = 0; r < R; r++) {
                              const d = display(sheet, r, c, 100000)
                              if (d.text && !mergeAt(sheet, r, c)) w = Math.max(w, measure(d.text, sheet.cells[cellKey(r, c)]?.st?.b) + 10)
                            }
                            apply(setSheetProp(book, si, { colW: { ...sheet.colW, [c]: w ? Math.ceil(w) : DEFAULT_COL_W } }))
                          }}
                          className="absolute top-0 -right-[3px] h-full w-[6px] cursor-col-resize z-10"
                          style={{ touchAction: 'none' }}
                        />
                      </th>
                    )
                  })}
                </tr>
              </thead>
            )}
            <tbody>
              {Array.from({ length: R }, (_, r) => {
                const on = r >= selRect.r1 && r <= selRect.r2
                const frozenRow = frozen && r < frozen.r
                return (
                  <tr key={r} style={{ height: heights[r] }}>
                    {headings && (
                      <th
                        onPointerDown={e => {
                          if ((e.target as HTMLElement).dataset.resize) return
                          e.preventDefault()
                          run(() => setSel(s => (e.shiftKey ? { a: s.a, f: { r, c: C - 1 } } : { a: { r, c: 0 }, f: { r, c: C - 1 } })))
                        }}
                        className="sticky left-0 text-[12px] font-normal border-r border-b border-[#bdbdbd] cursor-e-resize"
                        style={{ background: on ? '#d2d2d2' : '#e6e6e6', color: on ? GREEN : '#444', boxShadow: on ? `inset -2px 0 0 0 ${GREEN}` : undefined, top: frozenRow ? stickyTop(r) : undefined, zIndex: frozenRow ? 7 : 5 }}
                      >
                        {r + 1}
                        <span
                          data-resize="1"
                          title="Drag to resize, double-click to AutoFit"
                          onPointerDown={e => {
                            e.stopPropagation()
                            e.preventDefault()
                            const startY = e.clientY
                            const startH = heights[r]
                            const base = book
                            let moved = false
                            const mv = (ev2: PointerEvent) => {
                              moved = true
                              setBook(b => setSheetProp(b, si, { rowH: { ...b.sheets[si].rowH, [r]: Math.max(0, Math.round(startH + ev2.clientY - startY)) } }))
                            }
                            const upH = () => {
                              window.removeEventListener('pointermove', mv)
                              window.removeEventListener('pointerup', upH)
                              if (moved) {
                                setUndo(u => [...u.slice(-59), base])
                                setRedo([])
                              }
                            }
                            window.addEventListener('pointermove', mv)
                            window.addEventListener('pointerup', upH)
                          }}
                          onDoubleClick={e => {
                            e.stopPropagation()
                            const rh = { ...sheet.rowH }
                            delete rh[r]
                            apply(setSheetProp(book, si, { rowH: rh }))
                          }}
                          className="absolute left-0 -bottom-[3px] w-full h-[6px] cursor-row-resize z-10"
                          style={{ touchAction: 'none' }}
                        />
                      </th>
                    )}
                    {Array.from({ length: C }, (_, c) => renderCell(r, c))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* sheet tabs + status bar */}
        <div className="flex items-stretch border-t border-[#d4d4d4] bg-[#f3f3f3] overflow-x-auto">
          {book.sheets.map((s, i) => (
            <div
              key={s.id}
              className={`relative flex items-center px-3 h-7 text-[12px] border-r border-[#d4d4d4] cursor-pointer shrink-0 ${i === si ? 'bg-white font-semibold' : 'hover:bg-[#e8e8e8]'}`}
              style={{ color: i === si ? GREEN : '#444', boxShadow: s.tab ? `inset 0 -3px 0 0 ${s.tab}` : i === si ? `inset 0 -2px 0 0 ${GREEN}` : undefined }}
              onClick={() => {
                if (edit && (pointable(edit.draft) || dragRef.current?.mode === 'point')) {
                  if (dragRef.current?.mode === 'point') dragRef.current = { ...dragRef.current, down: false }
                  setEdit({ ...edit, inCell: false })
                  setSi(i)
                  requestAnimationFrame(() => barRef.current?.focus())
                  return
                }
                if (edit) commit('none')
                setSi(i)
                setSel({ a: { r: 0, c: 0 }, f: { r: 0, c: 0 } })
              }}
              onDoubleClick={() => startRename(i)}
            >
              {renaming?.idx === i ? (
                <input
                  autoFocus
                  aria-label="Sheet name"
                  value={renaming.value}
                  onChange={e => setRenaming({ idx: i, value: e.target.value })}
                  onBlur={finishRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') finishRename()
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                  className="w-24 px-1 border border-[#217346] outline-none text-[12px]"
                />
              ) : (
                s.name
              )}
            </div>
          ))}
          <button
            onClick={() =>
              run(() => {
                const { book: next, idx } = addSheet(book, si + 1)
                apply(next)
                setSi(idx)
                setSel({ a: { r: 0, c: 0 }, f: { r: 0, c: 0 } })
              })
            }
            title="New sheet"
            aria-label="New sheet"
            className="px-2.5 text-[16px] text-[#555] hover:text-[#217346] shrink-0"
          >
            ⊕
          </button>
          <div className="flex-1" />
          <button onClick={() => startRename(si)} className="px-2 text-[11px] text-[#555] hover:text-[#217346] shrink-0" title="Rename the active sheet (or double-click its tab)">
            Rename
          </button>
          <button onClick={() => removeSheet(si)} className="px-2 text-[11px] text-[#555] hover:text-[#c00000] shrink-0" title="Delete the active sheet">
            Delete
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 px-2 h-6 text-[11px] text-white" style={{ background: GREEN }}>
          <span>{modeLabel}</span>
          <span className="truncate">{status}</span>
        </div>

        {dialog && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 p-3">
            <div className="w-full max-w-[340px] bg-white border border-[#8a8a8a] shadow-xl text-[12.5px] text-[#222]">
              <div className="px-3 py-1.5 text-[12px] border-b border-[#ddd]">{dialog.title ?? 'Microsoft Excel'}</div>
              <div className="p-3 whitespace-pre-line">
                <div className="flex gap-2">
                  {!dialog.input && <span className="text-[18px] leading-none">{dialog.cancel ? '⚠️' : 'ℹ️'}</span>}
                  <p>{dialog.text}</p>
                </div>
                {dialog.input && (
                  <input
                    autoFocus
                    aria-label={dialog.title}
                    value={dialogValue}
                    onChange={e => setDialogValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const d = dialog
                        setDialog(null)
                        d.onOk?.(dialogValue)
                      }
                    }}
                    className="mt-2 w-full border border-[#aaa] px-1.5 py-0.5 outline-none focus:border-[#217346]"
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 px-3 pb-3">
                <button
                  onClick={() => {
                    const d = dialog
                    setDialog(null)
                    d.onOk?.(dialogValue)
                    if (!d.onOk && edit) requestAnimationFrame(() => (edit.inCell ? cellInputRef : barRef).current?.focus())
                  }}
                  className="min-w-[70px] px-3 py-1 border border-[#217346] bg-[#e8f2ea] hover:bg-[#d3eadb]"
                >
                  {dialog.okLabel ?? 'OK'}
                </button>
                {dialog.cancel && (
                  <button onClick={() => setDialog(null)} className="min-w-[70px] px-3 py-1 border border-[#aaa] hover:bg-[#f0f0f0]">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {(note || ev.circular) && (
        <p className={`mx-3 mb-3 -mt-1 px-3 py-2 rounded-lg text-[12px] ${ev.circular ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'bg-brand-sky/10 text-brand-navy dark:text-white border border-brand-sky/30'}`}>
          {ev.circular ? 'Circular reference: a formula refers to its own cell, directly or through other cells. Excel warns you and shows 0 until you fix it.' : note}
        </p>
      )}
    </div>
  )
}
