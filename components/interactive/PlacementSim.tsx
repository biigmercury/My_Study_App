'use client'

import { useState } from 'react'

// Practice run of the placement hunt (fictional companies). Teaches the order of operations from the
// SIWES guide: contact companies first, spend the limited introduction-letter requests (cap of 5) only on
// companies that said yes, never send the school's letter alone, then upload the acceptance letter AND
// complete the Request for Placement.

type Reply = 'yes' | 'irrelevant' | 'noreply' | 'no'
type Co = { name: string; area: string; reply: Reply; says: string }

const COMPANIES: Co[] = [
  { name: 'Kudeti Tech Hub', area: 'Software & IT support', reply: 'yes', says: '“Yes, we take SIWES students. Send your letters to the HR desk.”' },
  { name: 'Agodi Network Solutions', area: 'Networking', reply: 'noreply', says: 'You called twice and sent an email — no reply.' },
  { name: 'Bodija Data Services', area: 'Data analysis', reply: 'no', says: '“Sorry, we are not taking SIWES students this year.”' },
  { name: 'Oke-Ado Print & Copy Centre', area: 'Printing', reply: 'irrelevant', says: '“Yes, come anytime!” — but the work is photocopying and binding.' },
  { name: 'Iwo Road Software Studio', area: 'Web & mobile apps', reply: 'yes', says: '“Strong interest — our lead developer would like to meet you.”' },
  { name: 'Challenge Solar & Electrical', area: 'Solar installation', reply: 'noreply', says: 'Your message was delivered, but nobody answered.' },
]
const CAP = 5

type St = { contacted: boolean; letter: boolean; sent: '' | 'alone' | 'full'; outcome: '' | 'accepted' | 'ignored' | 'declined' }

export default function PlacementSim() {
  const fresh = () => COMPANIES.map((): St => ({ contacted: false, letter: false, sent: '', outcome: '' }))
  const [st, setSt] = useState<St[]>(fresh)
  const [log, setLog] = useState<{ text: string; tone: 'good' | 'bad' | 'info' }[]>([])
  const [uploaded, setUploaded] = useState(false)
  const [placed, setPlaced] = useState(false)

  const used = st.filter(s => s.letter).length
  const wasted = st.filter((s, i) => s.letter && (COMPANIES[i].reply === 'noreply' || COMPANIES[i].reply === 'no')).length
  const accepted = st.findIndex(s => s.outcome === 'accepted')
  const say = (text: string, tone: 'good' | 'bad' | 'info' = 'info') => setLog(l => [{ text, tone }, ...l].slice(0, 8))
  const upd = (i: number, p: Partial<St>) => setSt(s => s.map((x, k) => (k === i ? { ...x, ...p } : x)))

  const contact = (i: number) => {
    upd(i, { contacted: true })
    say(`${COMPANIES[i].name}: ${COMPANIES[i].says}`, COMPANIES[i].reply === 'yes' ? 'good' : COMPANIES[i].reply === 'irrelevant' ? 'info' : 'bad')
  }
  const request = (i: number) => {
    if (used >= CAP) return say(`You have used all ${CAP} introduction-letter requests. Ask the SIWES coordinator for help.`, 'bad')
    upd(i, { letter: true })
    const c = COMPANIES[i]
    if (!st[i].contacted) say(`Letter requested for ${c.name} without confirming interest first. If they ignore you, that slot is gone.`, 'bad')
    else if (c.reply === 'no' || c.reply === 'noreply') say(`Letter requested for ${c.name}, who ${c.reply === 'no' ? 'already said no' : 'never replied'} — a wasted slot.`, 'bad')
    else say(`Request for Introduction → ${c.name}: status SUBMITTED, then APPROVED a few days later. PDF downloaded from View Letter.`, 'good')
  }
  const send = (i: number, full: boolean) => {
    const c = COMPANIES[i]
    if (!full) {
      upd(i, { sent: 'alone' })
      return say(`${c.name} received only the school's letter. They ask: “Where is your application letter?” Never send the school's letter alone.`, 'bad')
    }
    if (c.reply === 'yes' || c.reply === 'irrelevant') {
      upd(i, { sent: 'full', outcome: 'accepted' })
      say(
        c.reply === 'yes'
          ? `🎉 ${c.name} issued an Acceptance Letter on their letterhead!`
          : `${c.name} issued an Acceptance Letter — but three months of photocopying will leave you nothing to present at your defence.`,
        c.reply === 'yes' ? 'good' : 'info',
      )
    } else {
      upd(i, { sent: 'full', outcome: c.reply === 'no' ? 'declined' : 'ignored' })
      say(`${c.name} ${c.reply === 'no' ? 'declined' : 'never responded to'} your application.`, 'bad')
    }
  }
  const reset = () => {
    setSt(fresh())
    setLog([])
    setUploaded(false)
    setPlaced(false)
  }

  const goodCompany = accepted >= 0 && COMPANIES[accepted].reply === 'yes'
  const finished = uploaded && placed

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🏢 Placement hunt — practice run</p>
        <button onClick={reset} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky underline">
          Start again
        </button>
      </div>
      <div className="p-3 space-y-3">
        <p className="text-[12px] text-brand-navy/70 dark:text-white/70">
          You are a 200-level Computer Science student. Get an Acceptance Letter from a company where you&apos;ll do <b>relevant</b> work, without wasting introduction-letter requests. (All companies are fictional.)
        </p>
        <div className="flex items-center gap-2 text-[12px] font-semibold">
          <span>Introduction-letter requests:</span>
          <span className="flex gap-1">
            {Array.from({ length: CAP }, (_, k) => (
              <span key={k} className={`h-3.5 w-3.5 rounded-full border ${k < used ? (k < used - (used - wasted) ? 'bg-rose-500 border-rose-500' : 'bg-brand-deep border-brand-deep dark:bg-brand-sky dark:border-brand-sky') : 'border-brand-navy/30 dark:border-white/30'}`} />
            ))}
          </span>
          <span className="text-brand-navy/60 dark:text-white/60">
            {used}/{CAP} used{wasted ? `, ${wasted} wasted` : ''}
          </span>
        </div>

        <div className="space-y-2">
          {COMPANIES.map((c, i) => {
            const s = st[i]
            const badge =
              s.outcome === 'accepted' ? '✅ Accepted' : s.outcome === 'declined' ? '✗ Declined' : s.outcome === 'ignored' ? '… Ignored' : s.letter ? '📄 Letter approved' : s.contacted ? '☎️ Contacted' : ''
            return (
              <div key={c.name} className="rounded-xl border border-brand-navy/10 dark:border-white/15 px-3 py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-[13.5px] font-bold">{c.name}</p>
                  <span className="text-[11px] text-brand-navy/60 dark:text-white/60">
                    {c.area}
                    {badge && <b className="ml-1.5 text-brand-deep dark:text-brand-sky">{badge}</b>}
                  </span>
                </div>
                {s.contacted && <p className="text-[12px] text-brand-navy/70 dark:text-white/70">{c.says}</p>}
                {accepted < 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {!s.contacted && (
                      <button onClick={() => contact(i)} className="rounded-lg border border-brand-navy/20 dark:border-white/25 px-2 py-1 text-[11.5px] font-semibold hover:bg-brand-sky/10">
                        ☎️ Contact first
                      </button>
                    )}
                    {!s.letter && (
                      <button onClick={() => request(i)} className="rounded-lg border border-brand-navy/20 dark:border-white/25 px-2 py-1 text-[11.5px] font-semibold hover:bg-brand-sky/10">
                        📄 Request introduction letter
                      </button>
                    )}
                    {s.letter && !s.outcome && (
                      <>
                        <button onClick={() => send(i, false)} className="rounded-lg border border-brand-navy/20 dark:border-white/25 px-2 py-1 text-[11.5px] font-semibold hover:bg-brand-sky/10">
                          ✉️ Send school letter only
                        </button>
                        <button onClick={() => send(i, true)} className="rounded-lg border border-brand-deep dark:border-brand-sky px-2 py-1 text-[11.5px] font-semibold text-brand-deep dark:text-brand-sky hover:bg-brand-sky/10">
                          📦 Send full package (cover letter + intro letter + CV)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {accepted >= 0 && (
          <div className="rounded-xl border-2 border-dashed border-brand-deep/40 dark:border-brand-sky/40 p-3 space-y-2">
            <p className="text-[13px] font-bold">Acceptance Letter received from {COMPANIES[accepted].name}. Two portal tasks remain:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                disabled={uploaded}
                onClick={() => {
                  setUploaded(true)
                  say('Submission of Acceptance Letter: clean scan uploaded the same day — letterhead fully visible.', 'good')
                }}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${uploaded ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-brand-deep text-white dark:bg-brand-sky dark:text-brand-navy'}`}
              >
                {uploaded ? '✓ Acceptance letter uploaded' : '⬆️ Upload acceptance letter'}
              </button>
              <button
                disabled={placed}
                onClick={() => {
                  setPlaced(true)
                  say('Request for Placement: official company details submitted when the window opened.', 'good')
                }}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${placed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-brand-deep text-white dark:bg-brand-sky dark:text-brand-navy'}`}
              >
                {placed ? '✓ Request for Placement done' : '🏷️ Complete Request for Placement'}
              </button>
            </div>
            {uploaded && !placed && <p className="text-[12px] text-amber-700 dark:text-amber-300">Uploading the letter is not the same as the Request for Placement — do both.</p>}
          </div>
        )}

        {finished && (
          <div className={`rounded-xl border px-3 py-2 text-[13px] ${goodCompany && wasted === 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100' : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100'}`}>
            <b>Placement secured.</b> {used} request{used === 1 ? '' : 's'} used, {wasted} wasted.{' '}
            {goodCompany ? 'You chose a company with relevant work.' : 'But the work is not relevant to your course — you will struggle to fill your logbook, report and defence.'}{' '}
            {wasted === 0 && goodCompany ? 'Perfect run!' : 'Try again: contact first, request letters only for companies that said yes, and choose relevant work.'}
          </div>
        )}

        {log.length > 0 && (
          <ul className="space-y-1">
            {log.map((m, k) => (
              <li
                key={log.length - k}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] ${k === 0 ? 'font-semibold' : 'opacity-70'} ${m.tone === 'good' ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100' : m.tone === 'bad' ? 'bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-100' : 'bg-brand-sky/10'}`}
              >
                {m.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
