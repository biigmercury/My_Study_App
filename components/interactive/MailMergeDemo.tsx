'use client'

import { useRef, useState } from 'react'

// The Mail Merge Wizard's six steps on a result letter: document type, starting document, recipient
// list (edit, tick/untick), writing the letter with «merge fields», an IF…THEN…ELSE rule and Greeting
// Line, previewing record by record, and Finish & Merge → Edit Individual Documents.

interface Rec {
  on: boolean
  Title: string
  FirstName: string
  LastName: string
  Course: string
  Score: string
  Hall: string
}
const FIELDS = ['Title', 'FirstName', 'LastName', 'Course', 'Score', 'Hall'] as const
const START: Rec[] = [
  { on: true, Title: 'Miss', FirstName: 'Adesuwa', LastName: 'Alero', Course: 'CSC 272', Score: '78', Hall: 'Queen Idia Hall' },
  { on: true, Title: 'Mr', FirstName: 'Tunde', LastName: 'Bakare', Course: 'CSC 272', Score: '46', Hall: 'Kenneth Mellanby Hall' },
  { on: true, Title: 'Mr', FirstName: 'Chidi', LastName: 'Okafor', Course: 'CSC 272', Score: '63', Hall: 'Nnamdi Azikiwe Hall' },
  { on: true, Title: 'Mrs', FirstName: 'Hauwa', LastName: 'Musa', Course: 'CSC 272', Score: '39', Hall: 'Obafemi Awolowo Hall' },
]
const TEMPLATE = `«GreetingLine»

Your result in «Course» is «Score» marks, which means you «IF Score >= 45 "have passed the course" "will need to resit the course"».

Please collect your script at the Department of Computer Science. A copy of this letter has also been sent to «Hall».

Yours faithfully,
Course Coordinator`

const TYPES = ['Letters', 'E-mail messages', 'Envelopes', 'Labels', 'Directory']
const STEPS = ['Select document type', 'Select starting document', 'Select recipients', 'Write your letter', 'Preview your letters', 'Complete the merge']

function merge(t: string, r: Rec) {
  return t
    .replace(/«IF (\w+)\s*(>=|<=|<>|=|>|<)\s*([^\s»]+)\s+"([^"]*)"\s+"([^"]*)"»/g, (_, f, op, v, a, b) => {
      const x = (r as unknown as Record<string, string>)[f] ?? ''
      const nx = Number(x)
      const nv = Number(v)
      const numeric = !isNaN(nx) && !isNaN(nv) && x !== ''
      const cmp = numeric ? nx - nv : x.localeCompare(v)
      const ok = op === '>=' ? cmp >= 0 : op === '<=' ? cmp <= 0 : op === '>' ? cmp > 0 : op === '<' ? cmp < 0 : op === '<>' ? cmp !== 0 : cmp === 0
      return ok ? a : b
    })
    .replace(/«GreetingLine»/g, `Dear ${r.Title} ${r.LastName},`)
    .replace(/«AddressBlock»/g, `${r.Title} ${r.FirstName} ${r.LastName}\n${r.Hall}\nUniversity of Ibadan`)
    .replace(/«(\w+)»/g, (m, f) => (f in r ? (r as unknown as Record<string, string>)[f] : m))
}

export default function MailMergeDemo() {
  const [step, setStep] = useState(0)
  const [type, setType] = useState('Letters')
  const [recs, setRecs] = useState<Rec[]>(START)
  const [tpl, setTpl] = useState(TEMPLATE)
  const [preview, setPreview] = useState(0)
  const [merged, setMerged] = useState<string[] | null>(null)
  const [highlight, setHighlight] = useState(true)
  const ta = useRef<HTMLTextAreaElement>(null)

  const chosen = recs.filter(r => r.on)
  const insert = (token: string) => {
    const el = ta.current
    const at = el ? el.selectionStart : tpl.length
    const next = tpl.slice(0, at) + token + tpl.slice(el ? el.selectionEnd : at)
    setTpl(next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + token.length, at + token.length)
    })
  }
  const setField = (i: number, f: keyof Rec, v: string | boolean) => setRecs(rs => rs.map((r, k) => (k === i ? { ...r, [f]: v } : r)))

  const shown = (t: string) =>
    t.split(/(«[^»]*»)/).map((part, i) =>
      part.startsWith('«') ? (
        <span key={i} style={{ background: highlight ? '#d9d9d9' : undefined }}>
          {part}
        </span>
      ) : (
        part
      )
    )

  const btn = 'px-2.5 py-1 rounded border border-[#c6c6c6] bg-white text-[11.5px] text-[#222] hover:border-[#2B579A] disabled:opacity-40'

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">✉️ Mail Merge Wizard — result letters</p>
        <button
          onClick={() => {
            setStep(0)
            setRecs(START)
            setTpl(TEMPLATE)
            setMerged(null)
            setPreview(0)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset
        </button>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3] text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="flex overflow-x-auto text-[10.5px]" style={{ background: '#2B579A' }}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} className={`px-2 py-1.5 shrink-0 ${step === i ? 'bg-[#f3f3f3] text-[#2B579A] font-semibold' : 'text-white/85'}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div className="p-3 text-[12.5px] min-h-[220px]">
          {step === 0 && (
            <div className="space-y-1">
              <p className="font-semibold">What type of document are you working on?</p>
              {TYPES.map(t => (
                <label key={t} className="flex items-center gap-2">
                  <input type="radio" name="mmtype" checked={type === t} onChange={() => setType(t)} /> {t}
                </label>
              ))}
              <p className="text-[11.5px] text-[#555] pt-1">
                {type === 'Letters' && 'Send letters to a group of people. You can personalise the letter each person receives.'}
                {type === 'E-mail messages' && 'Send e-mail messages to a group of people (needs Outlook and an e-mail address column).'}
                {type === 'Envelopes' && 'Print addressed envelopes for a group mailing.'}
                {type === 'Labels' && 'Print address labels (a sheet of labels, one per record).'}
                {type === 'Directory' && 'Create a single document containing a catalogue or list of all the records.'}
              </p>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-1">
              <p className="font-semibold">How do you want to set up your letters?</p>
              <label className="flex items-center gap-2">
                <input type="radio" defaultChecked name="mmstart" /> Use the current document
              </label>
              <label className="flex items-center gap-2 text-[#777]">
                <input type="radio" disabled name="mmstart" /> Start from a template
              </label>
              <label className="flex items-center gap-2 text-[#777]">
                <input type="radio" disabled name="mmstart" /> Start from existing document
              </label>
              <p className="text-[11.5px] text-[#555] pt-1">The main document holds the text that is the same for everybody; the recipient list holds what changes.</p>
            </div>
          )}
          {step === 2 && (
            <div>
              <p className="font-semibold mb-1">Use an existing list — Mail Merge Recipients (edit, or untick to leave someone out)</p>
              <div className="overflow-x-auto border border-[#c6c6c6] bg-white">
                <table className="text-[11.5px] border-collapse">
                  <thead>
                    <tr className="bg-[#e8eef7]">
                      <th className="px-1.5 py-0.5">✓</th>
                      {FIELDS.map(f => (
                        <th key={f} className="px-1.5 py-0.5 text-left font-semibold">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map((r, i) => (
                      <tr key={i} className="border-t border-[#e5e5e5]">
                        <td className="px-1.5">
                          <input type="checkbox" aria-label={`Include ${r.FirstName}`} checked={r.on} onChange={e => setField(i, 'on', e.target.checked)} />
                        </td>
                        {FIELDS.map(f => (
                          <td key={f} className="p-0">
                            <input aria-label={`${f} ${i + 1}`} value={r[f]} onChange={e => setField(i, f, e.target.value)} className="w-[92px] px-1 py-0.5 outline-none focus:bg-[#eef4fb]" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className={`${btn} mt-1.5`} onClick={() => setRecs(rs => [...rs, { on: true, Title: 'Mr', FirstName: 'New', LastName: 'Student', Course: 'CSC 272', Score: '50', Hall: 'Independence Hall' }])}>
                + New Entry
              </button>
              <p className="text-[11.5px] text-[#555] mt-1">A list can come from an Excel sheet, an Access table, Outlook contacts, or a list typed here (Type a new list). The first row holds the field names.</p>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1">
                <button className={btn} onClick={() => insert('«AddressBlock»')}>
                  Address Block…
                </button>
                <button className={btn} onClick={() => insert('«GreetingLine»')}>
                  Greeting Line…
                </button>
                {FIELDS.map(f => (
                  <button key={f} className={btn} onClick={() => insert(`«${f}»`)}>
                    «{f}»
                  </button>
                ))}
                <button className={btn} onClick={() => insert('«IF Score >= 45 "passed" "failed"»')}>
                  Rules: If…Then…Else
                </button>
                <label className="flex items-center gap-1 text-[11.5px] ml-1">
                  <input type="checkbox" checked={highlight} onChange={e => setHighlight(e.target.checked)} /> Highlight Merge Fields
                </label>
              </div>
              <textarea ref={ta} aria-label="Main document" value={tpl} onChange={e => setTpl(e.target.value)} rows={9} className="w-full border border-[#c6c6c6] bg-white p-2 text-[13px] leading-relaxed" style={{ fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }} />
              <p className="text-[11.5px] text-[#555]">Click where a field should go, then click the field. Fields appear as «FieldName» — Word fills them in during the merge.</p>
            </div>
          )}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button className={btn} disabled={preview <= 0} onClick={() => setPreview(p => p - 1)}>
                  ◀
                </button>
                <span className="text-[12px]">
                  Recipient {Math.min(preview + 1, chosen.length)} of {chosen.length}
                </span>
                <button className={btn} disabled={preview >= chosen.length - 1} onClick={() => setPreview(p => p + 1)}>
                  ▶
                </button>
                <span className="text-[11px] text-[#666]">(MAILINGS → Preview Results)</span>
              </div>
              {chosen.length ? (
                <div className="bg-white shadow-sm p-4 whitespace-pre-wrap text-[13.5px] leading-relaxed" style={{ fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }}>
                  {merge(tpl, chosen[Math.min(preview, chosen.length - 1)])}
                </div>
              ) : (
                <p>No recipients are ticked.</p>
              )}
            </div>
          )}
          {step === 5 && (
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button className={btn} onClick={() => setMerged(chosen.map(r => merge(tpl, r)))}>
                  Edit individual letters…
                </button>
                <button className={btn} onClick={() => setMerged(null)}>
                  Clear
                </button>
              </div>
              {merged ? (
                <div className="max-h-[320px] overflow-auto bg-[#dfdfdf] p-2 space-y-2">
                  <p className="text-[11px] text-[#444]">
                    New document “Letters1” — {merged.length} letter{merged.length === 1 ? '' : 's'}, each on its own page (separated by Next Page section breaks):
                  </p>
                  {merged.map((m, i) => (
                    <div key={i} className="bg-white shadow-sm p-3 whitespace-pre-wrap text-[12.5px] leading-relaxed" style={{ fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }}>
                      {m}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#555]">Finish &amp; Merge offers: Edit Individual Documents (a new document you can check and save), Print Documents, or Send E-mail Messages.</p>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="mt-2 bg-white border border-[#e5e5e5] p-2 text-[12.5px] whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }}>
              {shown(tpl)}
            </div>
          )}
        </div>

        <div className="flex justify-between px-3 py-2 border-t border-[#d4d4d4] bg-white">
          <button className={btn} disabled={step === 0} onClick={() => setStep(s => s - 1)}>
            ← Previous
          </button>
          <span className="text-[11px] text-[#666] self-center">Step {step + 1} of 6</span>
          <button className={btn} disabled={step === 5} onClick={() => setStep(s => s + 1)}>
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
