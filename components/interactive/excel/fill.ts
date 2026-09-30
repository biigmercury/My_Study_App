// Excel's fill-handle rules for the CSC 272 spreadsheet: numbers copy (one cell) or continue a
// linear trend (two or more), built-in lists (months, days) and "text + number" items continue as
// series, quarters wrap after 4, and formulas are copied with their relative references shifted.
import { numToText, numericText, shiftFormula } from './engine'

const LISTS = [
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
]

export type FillDir = 'down' | 'up' | 'right' | 'left'

function listItem(s: string): { list: string[]; idx: number; style: 'upper' | 'lower' | 'title' } | null {
  const t = s.trim()
  for (const list of LISTS) {
    const idx = list.findIndex(x => x.toLowerCase() === t.toLowerCase())
    if (idx >= 0) {
      const style = t === t.toUpperCase() && t !== t.toLowerCase() ? 'upper' : t === t.toLowerCase() ? 'lower' : 'title'
      return { list, idx, style }
    }
  }
  return null
}

const styled = (s: string, style: 'upper' | 'lower' | 'title') => (style === 'upper' ? s.toUpperCase() : style === 'lower' ? s.toLowerCase() : s)

interface TextNum {
  prefix: string
  n: number
  suffix: string
  ordinal: boolean
  quarter: boolean
  width: number
}

function textNum(s: string): TextNum | null {
  if (numericText(s) !== null || s.startsWith('=')) return null
  let m = /^(.*?)(\d+)$/.exec(s)
  if (m && m[1] !== '') {
    const quarter = /^(qtr|q|quarter)\s?$/i.test(m[1]) && +m[2] >= 1 && +m[2] <= 4
    return { prefix: m[1], n: +m[2], suffix: '', ordinal: false, quarter, width: m[2].startsWith('0') ? m[2].length : 0 }
  }
  m = /^(\d+)(st|nd|rd|th)(\b[\s\S]*)$/i.exec(s)
  if (m) return { prefix: '', n: +m[1], suffix: m[3], ordinal: true, quarter: false, width: 0 }
  m = /^(\d+)(\D[\s\S]*)$/.exec(s)
  if (m) return { prefix: '', n: +m[1], suffix: m[2], ordinal: false, quarter: false, width: 0 }
  return null
}

function ordinal(n: number) {
  const t = n % 100
  if (t >= 11 && t <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
}

function textNumOut(t: TextNum, n: number) {
  let v = t.quarter ? ((((n - 1) % 4) + 4) % 4) + 1 : Math.abs(n)
  v = Math.round(v)
  const num = t.width ? String(v).padStart(t.width, '0') : String(v)
  return t.prefix + num + (t.ordinal ? ordinal(v) : '') + t.suffix
}

const clean = (x: number) => Number(x.toPrecision(15))

// Least-squares trend through points (0, y0) … (n-1, yn-1), as Excel's fill does for 2+ numbers.
function trend(ys: number[]) {
  const n = ys.length
  const xbar = (n - 1) / 2
  const ybar = ys.reduce((s, y) => s + y, 0) / n
  let num = 0
  let den = 0
  ys.forEach((y, x) => {
    num += (x - xbar) * (y - ybar)
    den += (x - xbar) ** 2
  })
  const slope = den ? num / den : 0
  return (x: number) => clean(ybar - slope * xbar + slope * x)
}

const TIME = /^(\d{1,2}):(\d{2})$/
const timeOut = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

// src: raw cell contents in fill order (top→bottom or left→right). Returns `count` new raw values,
// nearest the source first.
export function fillSeries(src: string[], count: number, dir: FillDir): string[] {
  const n = src.length
  const back = dir === 'up' || dir === 'left'
  // x position of the k-th new cell relative to the source indices 0..n-1
  const xOf = (k: number) => (back ? -1 - k : n + k)
  const out: string[] = []

  const allNums = src.every(s => s.trim() !== '' && !s.startsWith("'") && numericText(s) !== null)
  const lists = src.map(listItem)
  const tns = src.map(textNum)
  const times = src.map(s => TIME.exec(s.trim()))
  const hasFormula = src.some(s => s.startsWith('='))

  if (!hasFormula && allNums && n >= 2) {
    const f = trend(src.map(s => numericText(s) as number))
    for (let k = 0; k < count; k++) out.push(numToText(f(xOf(k))))
    return out
  }
  if (!hasFormula && lists.every(l => l && l.list === lists[0]!.list)) {
    const first = lists[0]!
    const step = n >= 2 ? lists[1]!.idx - first.idx : 1
    const len = first.list.length
    for (let k = 0; k < count; k++) {
      const idx = (((first.idx + step * xOf(k)) % len) + len) % len
      out.push(styled(first.list[idx], lists[n - 1]!.style))
    }
    return out
  }
  if (!hasFormula && n >= 2 && tns.every(t => t && t.prefix === tns[0]!.prefix && t.suffix === tns[0]!.suffix && t.ordinal === tns[0]!.ordinal)) {
    const f = trend(tns.map(t => t!.n))
    for (let k = 0; k < count; k++) out.push(textNumOut(tns[0]!, f(xOf(k))))
    return out
  }
  if (!hasFormula && times.every(Boolean)) {
    const mins = times.map(m => +m![1] * 60 + +m![2])
    const step = n >= 2 ? mins[1] - mins[0] : 60
    for (let k = 0; k < count; k++) out.push(timeOut(mins[0] + step * xOf(k)))
    return out
  }

  // Otherwise every source cell repeats in a cycle; text+number and list items still count up
  // by one per cycle, formulas are shifted, plain values are copied.
  for (let k = 0; k < count; k++) {
    const i = back ? n - 1 - (k % n) : k % n
    const cycle = Math.floor(k / n) + 1
    const s = src[i]
    const shift = (back ? -1 : 1) * n * cycle
    if (s.startsWith('=')) {
      out.push(dir === 'down' || dir === 'up' ? shiftFormula(s, shift, 0) : shiftFormula(s, 0, shift))
      continue
    }
    const l = lists[i]
    if (l) {
      const len = l.list.length
      out.push(styled(l.list[(((l.idx + (back ? -cycle : cycle)) % len) + len) % len], l.style))
      continue
    }
    const t = tns[i]
    if (t) {
      out.push(textNumOut(t, t.n + (back ? -cycle : cycle)))
      continue
    }
    out.push(s)
  }
  return out
}
