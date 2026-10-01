'use client'

import { useMemo, useState } from 'react'

// Fill-in-the-blanks builder for the SIWES application (cover) letter, using the template from the
// Ultimate UI SIWES Guide. Empty fields stay as [placeholders] so nothing is silently left out.

const FIELDS = [
  { k: 'name', label: 'Your full name', ph: 'Your Full Name' },
  { k: 'address', label: 'Your home address', ph: 'Your Home Address, e.g., Agbowo, Ibadan' },
  { k: 'phone', label: 'Phone number', ph: 'Your Phone Number' },
  { k: 'email', label: 'Email (professional!)', ph: 'Your Personal/Student Email Address' },
  { k: 'date', label: 'Date', ph: 'Date' },
  { k: 'officer', label: 'Addressee', ph: 'Technical Manager / HR Manager / Appropriate Officer' },
  { k: 'company', label: 'Company name', ph: 'Company Name' },
  { k: 'caddress', label: 'Company address', ph: 'Company Address' },
  { k: 'level', label: 'Your level', ph: 'Your Level' },
  { k: 'dept', label: 'Your department', ph: 'Your Department' },
  { k: 'duration', label: 'Duration', ph: 'Duration, e.g., 3 months' },
  { k: 'start', label: 'Start date', ph: 'Start Date' },
  { k: 'end', label: 'End date', ph: 'End Date' },
  { k: 'course', label: 'Your course of study', ph: 'Your Course' },
  { k: 'skills', label: 'Two or three relevant skills', ph: 'two or three relevant skills, e.g., programming and logical problem-solving' },
  { k: 'interest', label: "The company's work that interests you", ph: "the area of the company's work that interests you" },
] as const
type Key = (typeof FIELDS)[number]['k']

export default function SiwesLetterBuilder() {
  const [v, setV] = useState<Record<Key, string>>(() => Object.fromEntries(FIELDS.map(f => [f.k, ''])) as Record<Key, string>)
  const [copied, setCopied] = useState('')
  const f = (k: Key) => v[k].trim() || `[${FIELDS.find(x => x.k === k)!.ph}]`
  const missing = FIELDS.filter(x => !v[x.k].trim()).length

  const letter = useMemo(
    () =>
      [
        f('name'),
        f('address'),
        f('phone'),
        f('email'),
        f('date'),
        '',
        `The ${f('officer')},`,
        `${f('company')},`,
        `${f('caddress')}.`,
        '',
        'Dear Sir/Madam,',
        '',
        'SUBJECT: APPLICATION FOR STUDENT INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES) PLACEMENT',
        '',
        `I am writing to formally apply for a Student Industrial Work Experience Scheme (SIWES) placement with ${f('company')}. I am a ${f('level')} student of the ${f('dept')} Department at the University of Ibadan.`,
        '',
        `As a compulsory requirement for my degree, I am required to undergo a mandatory industrial attachment for a period of ${f('duration')}, scheduled to commence from ${f('start')} to ${f('end')}.`,
        '',
        `My studies in ${f('course')} have provided me with a strong foundation in ${f('skills')}. I am keenly interested in applying this theoretical knowledge in a practical environment like yours, particularly in ${f('interest')}.`,
        '',
        'I am a highly motivated, adaptable, and disciplined individual committed to adhering to all company guidelines. I am eager to learn from your experienced team and contribute effectively to daily operations.',
        '',
        'Attached to this letter are my official SIWES Introduction Letter from the University of Ibadan and my Curriculum Vitae (CV) for your review.',
        '',
        `I am available at your earliest convenience to discuss how I can contribute positively to ${f('company')} during my training period. Thank you for your time and consideration.`,
        '',
        'Yours faithfully,',
        '',
        '__________________________________',
        f('name'),
      ].join('\n'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [v],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter)
      setCopied('Copied — paste it into Word or Google Docs, then format and sign.')
    } catch {
      setCopied('Copying is blocked in this browser — select the letter text and copy it manually.')
    }
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">✍️ Application letter builder</p>
      <div className="p-3 space-y-3">
        <p className="text-[12px] text-brand-navy/70 dark:text-white/70">Fill in your details — the letter updates as you type. Anything left blank stays in [brackets] so you can&apos;t miss it.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FIELDS.map(x => (
            <label key={x.k} className="block text-[11.5px] font-semibold">
              {x.label}
              <input
                value={v[x.k]}
                onChange={e => setV(s => ({ ...s, [x.k]: e.target.value }))}
                placeholder={x.ph}
                className="mt-0.5 w-full rounded-lg border border-brand-navy/20 dark:border-white/20 bg-white dark:bg-white/5 px-2.5 py-1.5 text-[13px] font-normal outline-none focus:border-brand-deep dark:focus:border-brand-sky"
              />
            </label>
          ))}
        </div>
        <div className="rounded-lg border border-black/10 bg-[#fffdf7] text-[#1f2937] px-3 py-3 sm:px-5 font-serif text-[13px] leading-snug whitespace-pre-wrap">
          {letter.split(/(\[[^\]]+\])/).map((part, i) =>
            /^\[.*\]$/.test(part) ? (
              <mark key={i} className="rounded bg-amber-100 px-0.5 text-amber-900">
                {part}
              </mark>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copy} className="rounded-xl bg-brand-deep px-3 py-1.5 text-[12.5px] font-semibold text-white dark:bg-brand-sky dark:text-brand-navy">
            📋 Copy letter
          </button>
          <span className="text-[12px] text-brand-navy/70 dark:text-white/70">{copied || (missing ? `${missing} field${missing > 1 ? 's' : ''} still blank.` : 'All fields filled. Now customise paragraph 3 for this company!')}</span>
        </div>
      </div>
    </div>
  )
}
