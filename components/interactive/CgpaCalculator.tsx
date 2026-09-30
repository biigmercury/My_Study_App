'use client'

import { useState } from 'react'

// A working model of the COS 202 GUI assignment (Student Course Registration and CGPA Calculator):
// same fields, same validation rules, same 5-point scale and the same formatted profile — so students
// can check the numbers their own Java program should produce.

interface Course {
  code: string
  title: string
  units: number
  grade: string
}

const POINTS: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }
const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics']
const SAMPLE: Course[] = [
  { code: 'CSC201', title: 'Data Structures', units: 3, grade: 'A' },
  { code: 'CSC203', title: 'Computer Architecture', units: 3, grade: 'B' },
  { code: 'MTH201', title: 'Mathematics II', units: 3, grade: 'A' },
  { code: 'CSC205', title: 'Programming II', units: 3, grade: 'B' },
  { code: 'STA201', title: 'Statistics', units: 2, grade: 'C' },
]
const MIN_COURSES = 5
const LINE = '='.repeat(47)
const DASH = '-'.repeat(63)

export default function CgpaCalculator() {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [dept, setDept] = useState(DEPARTMENTS[0])
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [units, setUnits] = useState('')
  const [grade, setGrade] = useState('A')
  const [courses, setCourses] = useState<Course[]>([])
  const [message, setMessage] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null)
  const [profile, setProfile] = useState('')

  const totalUnits = courses.reduce((s, c) => s + c.units, 0)
  const totalPoints = courses.reduce((s, c) => s + POINTS[c.grade] * c.units, 0)

  const registerCourse = () => {
    setProfile('')
    if (!code.trim() || !title.trim() || !units.trim()) return setMessage({ text: 'All course fields are required.', kind: 'error' })
    if (!/^-?\d+$/.test(units.trim()))
      return setMessage({ text: `NumberFormatException caught: "${units}" is not a whole number — credit units must be a positive integer.`, kind: 'error' })
    const cu = parseInt(units, 10)
    if (cu <= 0) return setMessage({ text: 'Credit units must be a positive integer.', kind: 'error' })
    if (!(grade in POINTS)) return setMessage({ text: 'Grade must be A, B, C, D, E or F.', kind: 'error' })
    if (courses.some(c => c.code.toUpperCase() === code.trim().toUpperCase())) return setMessage({ text: `${code.trim().toUpperCase()} is already registered.`, kind: 'error' })
    setCourses(prev => [...prev, { code: code.trim().toUpperCase(), title: title.trim(), units: cu, grade }])
    setCode('')
    setTitle('')
    setUnits('')
    setMessage({ text: `${code.trim().toUpperCase()} registered.`, kind: 'ok' })
  }

  const cgpa = () => (totalUnits === 0 ? 0 : totalPoints / totalUnits)

  const calculate = () => {
    if (courses.length < MIN_COURSES) {
      setMessage({ text: 'A student must register at least 5 courses before CGPA can be calculated.', kind: 'error' })
      return null
    }
    setMessage({ text: `CGPA = ${totalPoints} ÷ ${totalUnits} = ${cgpa().toFixed(2)}`, kind: 'ok' })
    return cgpa()
  }

  const display = () => {
    if (!id.trim() || !name.trim()) return setMessage({ text: 'Enter the student ID and name first.', kind: 'error' })
    const value = calculate()
    if (value === null) return
    const rows = courses.map(c => `${c.code.padEnd(12)} ${c.title.padEnd(28).slice(0, 28)} ${String(c.units).padEnd(4)} ${c.grade}`)
    setProfile(
      [
        LINE,
        'UNIVERSITY OF IBADAN - FACULTY OF COMPUTING',
        'STUDENT PROFILE',
        LINE,
        `Student ID : ${id.trim()}`,
        `Name       : ${name.trim()}`,
        `Department : ${dept}`,
        `Courses Registered: ${courses.length}`,
        DASH,
        `${'Course Code'.padEnd(12)} ${'Course Title'.padEnd(28)} ${'CU'.padEnd(4)} Grade`,
        DASH,
        ...rows,
        DASH,
        `Total Credit Units : ${totalUnits}`,
        `CGPA               : ${value.toFixed(2)}`,
        LINE,
      ].join('\n')
    )
  }

  const clear = () => {
    setId('')
    setName('')
    setDept(DEPARTMENTS[0])
    setCourses([])
    setProfile('')
    setMessage(null)
  }

  const loadSample = () => {
    setId('UI/CSC/2026/001')
    setName('John Ade')
    setDept('Computer Science')
    setCourses(SAMPLE)
    setProfile('')
    setMessage({ text: 'Loaded the sample student from the assignment handout.', kind: 'ok' })
  }

  const field = 'w-full px-2 py-1 border border-[#7a8a99] bg-white text-[#111] text-[12.5px] outline-none focus:border-[#3a6ea5]'
  const btn = 'px-2.5 py-1 rounded-sm border border-[#7a8a99] text-[12px] text-[#111] hover:border-[#3a6ea5]'
  const btnStyle = { background: 'linear-gradient(#ffffff, #d6e0ea)' }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🎓 CGPA calculator — model answer</p>
        <button onClick={loadSample} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
          Load sample
        </button>
      </div>

      <div className="m-3 rounded-md border border-[#7a8a99] overflow-hidden" style={{ background: '#eeeeee', fontFamily: 'Dialog, Arial, sans-serif', color: '#333' }}>
        <div className="px-2 py-1 text-[12px] font-bold" style={{ background: 'linear-gradient(#dde8f3, #b8cfe5)', borderBottom: '1px solid #7a8a99' }}>
          ☕ UI Student Course Registration &amp; CGPA Calculator
        </div>
        <div className="p-3 space-y-3 text-[12.5px]">
          <fieldset className="border border-[#9aa8b5] p-2">
            <legend className="px-1 text-[11.5px] font-bold">Student details</legend>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center">
              <label htmlFor="cg-id">Student ID:</label>
              <input id="cg-id" value={id} onChange={e => setId(e.target.value)} placeholder="UI/CSC/2026/001" className={field} />
              <label htmlFor="cg-name">Name:</label>
              <input id="cg-name" value={name} onChange={e => setName(e.target.value)} className={field} />
              <label htmlFor="cg-dept">Department:</label>
              <select id="cg-dept" value={dept} onChange={e => setDept(e.target.value)} className={field}>
                {DEPARTMENTS.map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="border border-[#9aa8b5] p-2">
            <legend className="px-1 text-[11.5px] font-bold">Course</legend>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center">
              <label htmlFor="cg-code">Code:</label>
              <input id="cg-code" value={code} onChange={e => setCode(e.target.value)} placeholder="CSC201" className={field} />
              <label htmlFor="cg-title">Title:</label>
              <input id="cg-title" value={title} onChange={e => setTitle(e.target.value)} className={field} />
              <label htmlFor="cg-units">Credit units:</label>
              <input id="cg-units" value={units} onChange={e => setUnits(e.target.value)} placeholder="3" className={field} />
              <label htmlFor="cg-grade">Grade:</label>
              <select id="cg-grade" value={grade} onChange={e => setGrade(e.target.value)} className={field}>
                {Object.keys(POINTS).map(g => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-1.5">
            <button onClick={registerCourse} className={btn} style={btnStyle}>
              Register Course
            </button>
            <button onClick={calculate} className={btn} style={btnStyle}>
              Calculate CGPA
            </button>
            <button onClick={display} className={btn} style={btnStyle}>
              Display Profile
            </button>
            <button onClick={clear} className={btn} style={btnStyle}>
              Clear
            </button>
          </div>

          {message && (
            <p className={`px-2 py-1.5 border text-[12px] ${message.kind === 'error' ? 'border-red-400 bg-red-50 text-red-800' : 'border-emerald-400 bg-emerald-50 text-emerald-800'}`}>{message.text}</p>
          )}

          <div>
            <p className="text-[11.5px] font-bold mb-1">
              Registered courses: {courses.length} {courses.length < MIN_COURSES && `(need ${MIN_COURSES - courses.length} more)`}
            </p>
            <div className="border border-[#9aa8b5] bg-white max-h-40 overflow-auto">
              <table className="w-full text-[11.5px] text-[#222]">
                <thead>
                  <tr className="bg-[#dde6ee]">
                    <th className="text-left px-1.5 py-0.5 font-semibold">Code</th>
                    <th className="text-left px-1.5 py-0.5 font-semibold">Title</th>
                    <th className="px-1.5 py-0.5 font-semibold">CU</th>
                    <th className="px-1.5 py-0.5 font-semibold">Grade</th>
                    <th className="px-1.5 py-0.5 font-semibold">GP×CU</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c, i) => (
                    <tr key={c.code} className="border-t border-[#e2e8f0]">
                      <td className="px-1.5 py-0.5 font-mono">{c.code}</td>
                      <td className="px-1.5 py-0.5">{c.title}</td>
                      <td className="px-1.5 py-0.5 text-center">{c.units}</td>
                      <td className="px-1.5 py-0.5 text-center">{c.grade}</td>
                      <td className="px-1.5 py-0.5 text-center">
                        {POINTS[c.grade]}×{c.units}={POINTS[c.grade] * c.units}
                      </td>
                      <td className="px-1 text-right">
                        <button onClick={() => setCourses(prev => prev.filter((_, k) => k !== i))} aria-label={`Remove ${c.code}`} className="text-red-600 text-[11px]">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {courses.length > 0 && (
                    <tr className="border-t-2 border-[#9aa8b5] font-semibold">
                      <td className="px-1.5 py-0.5" colSpan={2}>
                        Totals
                      </td>
                      <td className="px-1.5 py-0.5 text-center">{totalUnits}</td>
                      <td />
                      <td className="px-1.5 py-0.5 text-center">{totalPoints}</td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
              {courses.length === 0 && <p className="px-2 py-2 text-[11.5px] text-[#666]">No courses yet — register at least five.</p>}
            </div>
          </div>

          {profile && <pre className="bg-white border border-[#9aa8b5] p-2 text-[10.5px] leading-snug font-mono text-[#111] overflow-x-auto whitespace-pre">{profile}</pre>}
        </div>
      </div>
    </div>
  )
}
