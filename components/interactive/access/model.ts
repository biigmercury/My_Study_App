// Shared model for the CSC 272 Access lessons: field data types and value checking with Access's own
// messages, sample tables, Access query criteria (as typed in the design grid) and SQL view text.

export type DataType = 'Short Text' | 'Long Text' | 'Number' | 'Date/Time' | 'Currency' | 'AutoNumber' | 'Yes/No' | 'Hyperlink' | 'Lookup Wizard…'
export const DATA_TYPES: DataType[] = ['Short Text', 'Long Text', 'Number', 'Date/Time', 'Currency', 'AutoNumber', 'Yes/No', 'Hyperlink', 'Lookup Wizard…']

export const TYPE_HELP: Record<DataType, string> = {
  'Short Text': 'Letters, digits and symbols — names, codes, phone numbers. Up to 255 characters (Field Size).',
  'Long Text': 'Long passages of text such as descriptions and notes (up to about 64,000 characters shown).',
  Number: 'Numbers used in calculations — quantities, scores, units. Field Size decides the range (Long Integer, Integer, Double…).',
  'Date/Time': 'Dates and/or times. Format: Short Date, Medium Date, Long Date…',
  Currency: 'Money values, accurate to 4 decimal places, shown with a currency symbol.',
  AutoNumber: 'A unique number Access generates for each new record (1, 2, 3…). Cannot be typed or edited — ideal primary key.',
  'Yes/No': 'Only two values: Yes/No, True/False, On/Off — shown as a check box.',
  Hyperlink: 'A web or e-mail address that can be clicked.',
  'Lookup Wizard…': 'Lets the user pick the value from a list you type (e.g. Male, Female) or from another table.',
}

export interface Field {
  name: string
  type: DataType
  description: string
  size: number
  format: string
  required: boolean
  list?: string
}
export type Value = string | number | boolean | null
export type Row = Record<string, Value>

export const field = (name: string, type: DataType, extra: Partial<Field> = {}): Field => ({ name, type, description: '', size: 255, format: type === 'Date/Time' ? 'Short Date' : '', required: false, ...extra })

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// Dates are stored as ISO yyyy-mm-dd strings. Accepts 15/05/1974, 15-May-1974, 15 May 1974, 1974-05-15.
export function parseDate(s: string): string | null {
  const t = s.trim().replace(/^#|#$/g, '')
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(t)
  let d: number, mo: number, y: number
  if (m) {
    d = +m[1]
    mo = +m[2]
    y = +m[3]
  } else if ((m = /^(\d{1,2})[\s-]([A-Za-z]{3,})[\s-](\d{2,4})$/.exec(t))) {
    d = +m[1]
    mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1
    y = +m[3]
  } else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))) {
    y = +m[1]
    mo = +m[2]
    d = +m[3]
  } else return null
  if (y < 100) y += y < 30 ? 2000 : 1900
  if (mo < 1 || mo > 12 || d < 1) return null
  const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  if (d > dim) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function formatDate(iso: string, fmt: string) {
  const [y, mo, d] = iso.split('-').map(Number)
  const mon = MONTHS[mo - 1][0].toUpperCase() + MONTHS[mo - 1].slice(1)
  const full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mo - 1]
  if (fmt === 'Medium Date') return `${String(d).padStart(2, '0')}-${mon}-${String(y).slice(2)}`
  if (fmt === 'Long Date') return `${d} ${full} ${y}`
  return `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${y}`
}

export function display(v: Value, f: Field): string {
  if (v === null || v === '') return ''
  if (f.type === 'Date/Time' && typeof v === 'string') return formatDate(v, f.format || 'Short Date')
  if (f.type === 'Currency' && typeof v === 'number') return '₦' + v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (f.type === 'Yes/No') return v ? 'Yes' : 'No'
  return String(v)
}

// Convert typed text into a stored value, or return Access's error message.
export function coerce(text: string, f: Field, table: string): { value: Value } | { error: string } {
  const t = text.trim()
  if (t === '') return f.required ? { error: `You must enter a value in the '${table}.${f.name}' field.` } : { value: null }
  const mismatch = { error: `The value you entered does not match the ${f.type} data type in this column.` }
  switch (f.type) {
    case 'Number':
    case 'Currency': {
      const n = Number(t.replace(/[₦,]/g, ''))
      return Number.isFinite(n) ? { value: n } : mismatch
    }
    case 'Date/Time': {
      const d = parseDate(t)
      return d ? { value: d } : mismatch
    }
    case 'Yes/No':
      return { value: /^(yes|true|on|-1|1)$/i.test(t) }
    case 'AutoNumber':
      return { error: `Control can't be edited; it's bound to AutoNumber field '${f.name}'.` }
    case 'Lookup Wizard…': {
      const opts = (f.list ?? '').split(/[;,]/).map(x => x.trim()).filter(Boolean)
      if (opts.length && !opts.some(o => o.toLowerCase() === t.toLowerCase())) return { error: `The text you entered isn't an item in the list. Select an item from the list: ${opts.join(', ')}.` }
      return { value: opts.find(o => o.toLowerCase() === t.toLowerCase()) ?? t }
    }
    default:
      return { value: t.slice(0, f.size || 255) }
  }
}

export const PK_DUPLICATE =
  'The changes you requested to the table were not successful because they would create duplicate values in the index, primary key, or relationship. Change the data in the field or fields that contain duplicate data, remove the index, or redefine the index to permit duplicate entries and try again.'
export const PK_NULL = 'Index or primary key cannot contain a Null value.'
export const NO_PK =
  "Although a primary key isn't required, it's highly recommended. A table must have a primary key for you to define a relationship between this table and other tables in the database. Do you want to create a primary key now?"

// ---------- sample data: the lecture's Staff table ----------

export const STAFF_FIELDS: Field[] = [
  field('StaffID', 'AutoNumber'),
  field('FirstName', 'Short Text', { size: 30 }),
  field('Surname', 'Short Text', { size: 30 }),
  field('Gender', 'Short Text', { size: 1 }),
  field('Address', 'Short Text', { size: 80 }),
  field('Department', 'Short Text', { size: 40 }),
  field('DateEmployed', 'Date/Time'),
  field('Salary', 'Currency'),
]
export const STAFF: Row[] = [
  { StaffID: 1, FirstName: 'John', Surname: 'Adewale', Gender: 'M', Address: '12 Bodija Road, Ibadan', Department: 'Computer Science', DateEmployed: '2009-03-02', Salary: 410000 },
  { StaffID: 2, FirstName: 'Mary', Surname: 'Okon', Gender: 'F', Address: '4 Awolowo Avenue, Ibadan', Department: 'Mathematics', DateEmployed: '2014-10-15', Salary: 350000 },
  { StaffID: 3, FirstName: 'Ibrahim', Surname: 'Sule', Gender: 'M', Address: '7 Ring Road, Ibadan', Department: 'Physics', DateEmployed: '2011-01-10', Salary: 380000 },
  { StaffID: 4, FirstName: 'Grace', Surname: 'Johnson', Gender: 'F', Address: '22 Oke-Ado Street, Ibadan', Department: 'Computer Science', DateEmployed: '2018-05-21', Salary: 295000 },
  { StaffID: 5, FirstName: 'John', Surname: 'Okafor', Gender: 'M', Address: '9 Agodi GRA, Ibadan', Department: 'Statistics', DateEmployed: '2016-09-01', Salary: 320000 },
  { StaffID: 6, FirstName: 'Funmi', Surname: 'Bakare', Gender: 'F', Address: '3 Mokola Hill, Ibadan', Department: 'Computer Science', DateEmployed: '2020-02-03', Salary: 260000 },
  { StaffID: 7, FirstName: 'Chidi', Surname: 'Eze', Gender: 'M', Address: '15 Iwo Road, Ibadan', Department: 'Mathematics', DateEmployed: '2007-07-16', Salary: 450000 },
  { StaffID: 8, FirstName: 'Amina', Surname: 'Bello', Gender: 'F', Address: '6 Sango Close, Ibadan', Department: 'Statistics', DateEmployed: '2019-11-11', Salary: 275000 },
  { StaffID: 9, FirstName: 'Johnson', Surname: 'Ade', Gender: 'M', Address: '30 Challenge Road, Ibadan', Department: 'Physics', DateEmployed: '2022-01-17', Salary: 240000 },
  { StaffID: 10, FirstName: 'Ngozi', Surname: 'Obi', Gender: 'F', Address: '11 Jericho GRA, Ibadan', Department: 'Physics', DateEmployed: '2012-06-04', Salary: 365000 },
  { StaffID: 11, FirstName: 'Tunde', Surname: 'Ajayi', Gender: 'M', Address: '2 UI Staff Quarters, Ibadan', Department: 'Computer Science', DateEmployed: '2015-04-13', Salary: 330000 },
  { StaffID: 12, FirstName: 'Kemi', Surname: 'Adeleke', Gender: 'F', Address: '18 Dugbe Street, Ibadan', Department: 'Mathematics', DateEmployed: '2021-08-30', Salary: 250000 },
]

// ---------- Access criteria (what you type in the Criteria row) ----------

type Pred = (v: Value) => boolean
export interface CritResult {
  pred: Pred
  sql: string
}

function tokens(s: string): string[] {
  const out: string[] = []
  const re = /\s*("(?:[^"]|"")*"|'(?:[^']|'')*'|#[^#]*#|<=|>=|<>|[<>=(),]|[^\s<>=(),"'#]+)/y
  let m: RegExpExecArray | null
  re.lastIndex = 0
  while (re.lastIndex < s.length && (m = re.exec(s))) out.push(m[1])
  if (s.slice(re.lastIndex).trim()) throw new Error('bad')
  return out
}

const isQuoted = (t: string) => /^(".*"|'.*')$/.test(t)
const unq = (t: string) => (isQuoted(t) ? t.slice(1, -1).replace(/""/g, '"').replace(/''/g, "'") : t)

function cmpVal(a: Value, b: string, f: Field): number | null {
  if (a === null || a === '') return null
  if (f.type === 'Number' || f.type === 'Currency' || f.type === 'AutoNumber') {
    const n = Number(unq(b))
    if (!Number.isFinite(n)) return null
    return Number(a) - n
  }
  if (f.type === 'Date/Time') {
    const d = parseDate(unq(b))
    if (!d) return null
    return String(a) < d ? -1 : String(a) > d ? 1 : 0
  }
  const x = String(a).toLowerCase()
  const y = unq(b).toLowerCase()
  return x < y ? -1 : x > y ? 1 : 0
}

const likeRe = (pat: string) =>
  new RegExp(
    '^' +
      [...pat]
        .map(c => (c === '*' ? '.*' : c === '?' ? '.' : c === '#' ? '\\d' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
        .join('') +
      '$',
    'i'
  )

// SQL stores dates as #m/d/yyyy#; the design grid shows them in the regional order #dd/mm/yyyy#.
function sqlLiteral(t: string, f: Field, regional = false): string {
  if (isQuoted(t)) return `"${unq(t)}"`
  if (f.type === 'Date/Time') {
    const d = parseDate(t)
    if (d) {
      const [y, m, dd] = d.split('-')
      return regional ? `#${dd}/${m}/${y}#` : `#${+m}/${+dd}/${y}#`
    }
  }
  if (/^#.*#$/.test(t)) return t
  if (f.type === 'Number' || f.type === 'Currency' || f.type === 'AutoNumber' || f.type === 'Yes/No') return t
  return `"${t}"`
}

// Parses criteria such as: M   "M"   >30   <=#1/1/2015#   Like "J*"   Between 20 And 40   Is Null
// Not "M"   In ("Physics","Statistics")   "M" Or "F"
const KEYWORDS = /\b(and|or|not|like|between|in|is|null)\b/i
// Access wraps plain text such as  Computer Science  in quotes for you.
function autoQuote(text: string, f: Field) {
  const t = text.trim()
  if (['Short Text', 'Long Text', 'Lookup Wizard…', 'Hyperlink'].includes(f.type) && /\s/.test(t) && /^[^"'#<>=(),]+$/.test(t) && !KEYWORDS.test(t)) return `"${t}"`
  return t
}

export function parseCriteria(text: string, f: Field, col: string): CritResult {
  const toks = tokens(autoQuote(text, f))
  let i = 0
  const peek = () => toks[i]
  const kw = (w: string) => peek()?.toLowerCase() === w
  const need = (w: string) => {
    if (!kw(w)) throw new Error('bad')
    i++
  }
  const value = () => {
    const t = toks[i++]
    if (t === undefined || ['and', 'or', ')', ','].includes(t.toLowerCase())) throw new Error('bad')
    return t
  }

  const atom = (): CritResult => {
    if (kw('not')) {
      i++
      const a = atom()
      return { pred: v => v !== null && !a.pred(v), sql: `Not ${a.sql}` }
    }
    if (kw('is')) {
      i++
      let neg = false
      if (kw('not')) {
        neg = true
        i++
      }
      need('null')
      return { pred: v => (v === null || v === '') !== neg, sql: `${col} Is ${neg ? 'Not ' : ''}Null` }
    }
    if (kw('like')) {
      i++
      const p = unq(value())
      const re = likeRe(p)
      return { pred: v => v !== null && re.test(typeof v === 'string' && f.type === 'Date/Time' ? v : String(v)), sql: `${col} Like "${p}"` }
    }
    if (kw('between')) {
      i++
      const a = value()
      need('and')
      const b = value()
      return {
        pred: v => {
          const x = cmpVal(v, a, f)
          const y = cmpVal(v, b, f)
          return x !== null && y !== null && x >= 0 && y <= 0
        },
        sql: `${col} Between ${sqlLiteral(a, f)} And ${sqlLiteral(b, f)}`,
      }
    }
    if (kw('in')) {
      i++
      need('(')
      const items: string[] = []
      for (;;) {
        items.push(value())
        if (peek() === ',') {
          i++
          continue
        }
        need(')')
        break
      }
      return { pred: v => items.some(it => cmpVal(v, it, f) === 0), sql: `${col} In (${items.map(t => sqlLiteral(t, f)).join(',')})` }
    }
    if (peek() === '(') {
      i++
      const e = orExpr()
      need(')')
      return { pred: e.pred, sql: `(${e.sql})` }
    }
    let op = '='
    if (['=', '<', '>', '<=', '>=', '<>'].includes(peek())) op = toks[i++]
    const b = value()
    return {
      pred: v => {
        const c = cmpVal(v, b, f)
        if (c === null) return false
        return op === '=' ? c === 0 : op === '<>' ? c !== 0 : op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0
      },
      sql: `${col}${op}${sqlLiteral(b, f)}`,
    }
  }
  const andExpr = (): CritResult => {
    let l = atom()
    while (kw('and')) {
      i++
      const r = atom()
      const a = l
      l = { pred: v => a.pred(v) && r.pred(v), sql: `${a.sql} And ${r.sql}` }
    }
    return l
  }
  const orExpr = (): CritResult => {
    let l = andExpr()
    while (kw('or')) {
      i++
      const r = andExpr()
      const a = l
      l = { pred: v => a.pred(v) || r.pred(v), sql: `${a.sql} Or ${r.sql}` }
    }
    return l
  }
  const res = orExpr()
  if (i < toks.length) throw new Error('bad')
  return res
}

// How Access re-displays a criterion after you leave the cell (it adds quotes around text, # around dates).
export function tidyCriteria(text: string, f: Field): string {
  const t = autoQuote(text, f)
  if (!t) return ''
  try {
    const toks = tokens(t)
    return toks
      .map((tk, k) => {
        const low = tk.toLowerCase()
        if (['and', 'or', 'not', 'like', 'between', 'in', 'is', 'null'].includes(low)) return low[0].toUpperCase() + low.slice(1)
        if (['=', '<', '>', '<=', '>=', '<>', '(', ')', ','].includes(tk) || isQuoted(tk)) return tk
        if (/^#.*#$/.test(tk)) return sqlLiteral(tk, f, true)
        const prev = toks[k - 1]?.toLowerCase()
        if (prev === 'like') return `"${tk}"`
        return sqlLiteral(tk, f, true)
      })
      .join(' ')
      .replace(/ ?, ?/g, ',')
      .replace(/\( /g, '(')
      .replace(/ \)/g, ')')
      .replace(/(<=|>=|<>|<|>|=) /g, '$1')
  } catch {
    return t
  }
}
