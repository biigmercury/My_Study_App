'use client'

import { useState } from 'react'

// Writes-and-checks practice for logbook entries. The checks follow the SIWES guide's advice for a
// strong entry — "Name the tools, the tasks, and what you learned" — using simple text heuristics,
// so the feedback is a prompt to improve, not a grade.

const VERBS =
  /\b(install|configur|set ?up|test|crimp|design|develop|cod|program|debug|fix|repair|troubleshoot|assist|creat|build|built|wrote|writ|deploy|updat|migrat|clean|analys|analyz|document|prepar|assembl|replac|mount|connect|wire|wired|wiring|format|back(ed)? ?up|monitor|inspect|measur|calibrat|record|enter|captur|train|learn|observ|maintain|implement|integrat|optimi|upgrad|instal)\w*/i
const VAGUE = /\b(worked on|did some|stuff|things|the computer|helped out|nothing much|as usual|same as yesterday|various tasks|some work|in the office)\b/i
const LEARN = /\b(learn|learnt|learned|understood|discovered|realis|realiz|now know|how to|so that|because|which (taught|showed))\w*/i
const TOOLS =
  /\b([A-Z][A-Za-z0-9+#.]{1,}|RJ45|LAN|IP|DNS|DHCP|SQL|HTML|CSS|JavaScript|Python|Excel|Word|Linux|Windows|router|switch|server|multimeter|tester|printer|database|spreadsheet|inverter|panel|cable|laptop|Git|GitHub|React|PHP|Java|API|AutoCAD)\b/
const NUMBER = /\b\d+\b/

const checks = [
  { test: (s: string) => s.trim().split(/\s+/).filter(Boolean).length >= 12, ok: 'Detailed enough (12+ words).', bad: 'Too short — one vague line gives your report and panel nothing. Aim for 12+ words.' },
  { test: (s: string) => VERBS.test(s), ok: 'Uses specific action verbs.', bad: 'Use specific action verbs: installed, configured, tested, debugged, designed…' },
  { test: (s: string) => TOOLS.test(s.replace(/^\s*\w/, '')), ok: 'Names tools, equipment or technologies.', bad: 'Name the tools, equipment or software you used (e.g. LAN tester, Excel, router, Python).' },
  { test: (s: string) => NUMBER.test(s), ok: 'Includes a quantity or measurable detail.', bad: 'Add a number: how many workstations, cables, records, pages, hours?' },
  { test: (s: string) => LEARN.test(s), ok: 'Says what you learned or why it mattered.', bad: 'Add what you learned or why the task mattered ("…which taught me how DHCP assigns addresses").' },
  { test: (s: string) => !VAGUE.test(s), ok: 'No vague filler phrases.', bad: 'Avoid vague phrases like "worked on the computer", "did some stuff", "various tasks".' },
]

const EXAMPLES = [
  'Worked on the computer today.',
  'Assisted in setting up the office network. Crimped RJ45 cables, tested connections with a LAN tester, and configured IP addresses on 4 workstations.',
]

export default function LogEntryCoach() {
  const [text, setText] = useState('')
  const results = checks.map(c => ({ ...c, pass: text.trim() ? c.test(text) : false }))
  const score = results.filter(r => r.pass).length

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📝 Logbook entry coach</p>
        {text.trim() && (
          <span className={`text-[11px] font-bold ${score >= 5 ? 'text-emerald-600 dark:text-emerald-300' : score >= 3 ? 'text-amber-600 dark:text-amber-300' : 'text-rose-600 dark:text-rose-300'}`}>
            {score} / {checks.length} {score >= 5 ? '— strong entry' : score >= 3 ? '— getting there' : '— weak entry'}
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <p className="text-[12px] text-brand-navy/70 dark:text-white/70">Write a logbook entry for a day of training (real or imagined), or load an example.</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((e, i) => (
            <button key={i} onClick={() => setText(e)} className="rounded-lg border border-brand-navy/20 dark:border-white/25 px-2 py-1 text-[11.5px] font-semibold hover:bg-brand-sky/10">
              {i === 0 ? 'Load the weak example' : 'Load the strong example'}
            </button>
          ))}
          {text && (
            <button onClick={() => setText('')} className="rounded-lg px-2 py-1 text-[11.5px] font-semibold underline">
              Clear
            </button>
          )}
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          placeholder="e.g. Monday: Assisted the IT officer in…"
          className="w-full rounded-xl border border-brand-navy/20 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-2 text-[13.5px] outline-none focus:border-brand-deep dark:focus:border-brand-sky"
        />
        {text.trim() && (
          <ul className="space-y-1">
            {results.map((r, i) => (
              <li key={i} className={`text-[12.5px] ${r.pass ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {r.pass ? '✓' : '✗'} {r.pass ? r.ok : r.bad}
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-brand-navy/50 dark:text-white/50">The coach uses simple word patterns, so treat it as a prompt, not a grade — your supervisor and panel are the real judges.</p>
      </div>
    </div>
  )
}
