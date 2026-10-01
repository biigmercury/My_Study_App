'use client'

import { useEffect, useState } from 'react'
import { canSpeak, speak } from './speak'

// The 44 phonemes of (British) English as described in the GES 201 textbook (Osisanwo):
// 12 pure vowels, 8 diphthongs, 24 consonants. Tap a tile for its description, spellings and
// example words; the 🔊 buttons read the words with the device's built-in voice.

type Phoneme = { sym: string; n?: number; desc: string; spell?: string; words: string[] }

const PURE: Phoneme[] = [
  { sym: 'iː', n: 1, desc: 'Close front spread vowel (long)', spell: 'ee, ea, ie, ei, e, oe, eo, i', words: ['see', 'need', 'chief', 'receive', 'police', 'machine'] },
  { sym: 'ɪ', n: 2, desc: 'Half-close front spread vowel (short)', spell: 'i, y, e, ie, a, ay', words: ['sit', 'pity', 'wicked', 'ladies', 'village', 'Monday'] },
  { sym: 'e', n: 3, desc: 'Half-open front spread vowel (short)', spell: 'e, ea, a, ai', words: ['set', 'dead', 'many', 'says'] },
  { sym: 'æ', n: 4, desc: 'Open front spread vowel (short)', spell: 'a, ai', words: ['man', 'stab', 'plait', 'sat'] },
  { sym: 'ɑː', n: 5, desc: 'Open back neutral vowel (long)', spell: 'a, al, ear, ar', words: ['pass', 'calf', 'heart', 'yard'] },
  { sym: 'ɒ', n: 6, desc: 'Open back rounded vowel (short)', spell: 'o, a', words: ['doll', 'off', 'was', 'what'] },
  { sym: 'ɔː', n: 7, desc: 'Half-open back rounded vowel (long)', spell: 'or, au, ou, aw, ore', words: ['sport', 'cause', 'thought', 'saw'] },
  { sym: 'ʊ', n: 8, desc: 'Half-close back rounded vowel (short)', spell: 'u, oo, oul', words: ['full', 'put', 'wood', 'should'] },
  { sym: 'uː', n: 9, desc: 'Close back rounded vowel (long)', spell: 'oo, ew, ui, u', words: ['moon', 'news', 'juice', 'June'] },
  { sym: 'ʌ', n: 10, desc: 'Open central neutral vowel (short)', spell: 'u, oo, o, ou', words: ['jump', 'blood', 'love', 'country'] },
  { sym: 'ɜː', n: 11, desc: 'Half-close central neutral vowel (long)', spell: 'ir, ur, er, or, ear', words: ['bird', 'burn', 'her', 'word', 'learn'] },
  { sym: 'ə', n: 12, desc: 'Half-open central neutral vowel (short) — the schwa', spell: 'a, er, or', words: ['alone', 'ago', 'doctor', 'professor'] },
]

const DIPH: Phoneme[] = [
  { sym: 'eɪ', n: 13, desc: 'Closing diphthong', words: ['fate', 'sachet', 'faith', 'grey', 'eight', 'reign'] },
  { sym: 'əʊ', n: 14, desc: 'Closing diphthong', words: ['load', 'go', 'cold', 'show', 'toe'] },
  { sym: 'aɪ', n: 15, desc: 'Closing diphthong', words: ['hide', 'fly', 'high', 'night', 'tie'] },
  { sym: 'aʊ', n: 16, desc: 'Closing diphthong', words: ['found', 'mouth', 'now', 'dowry'] },
  { sym: 'ɔɪ', n: 17, desc: 'Closing diphthong', words: ['boy', 'joy', 'voice', 'oil', 'noise'] },
  { sym: 'ɪə', n: 18, desc: 'Centring diphthong', words: ['cheer', 'dear', 'here', 'weird', 'pier'] },
  { sym: 'eə', n: 19, desc: 'Centring diphthong', words: ['air', 'chair', 'rare', 'where', 'there'] },
  { sym: 'ʊə', n: 20, desc: 'Centring diphthong', words: ['pure', 'tour', 'moor', 'amour'] },
]

const CONS: Phoneme[] = [
  { sym: 'p', desc: 'Voiceless bilabial plosive', words: ['pay', 'apple', 'cap'] },
  { sym: 'b', desc: 'Voiced bilabial plosive', words: ['bat', 'rubber', 'cab'] },
  { sym: 't', desc: 'Voiceless alveolar plosive', words: ['tea', 'butter', 'cat'] },
  { sym: 'd', desc: 'Voiced alveolar plosive', words: ['day', 'ladder', 'bed'] },
  { sym: 'k', desc: 'Voiceless velar plosive', words: ['key', 'school', 'back'] },
  { sym: 'g', desc: 'Voiced velar plosive', words: ['go', 'bigger', 'bag'] },
  { sym: 'f', desc: 'Voiceless labio-dental fricative', words: ['fan', 'physics', 'laugh'] },
  { sym: 'v', desc: 'Voiced labio-dental fricative', words: ['van', 'never', 'of'] },
  { sym: 'θ', desc: 'Voiceless inter-dental fricative', words: ['think', 'author', 'bath'] },
  { sym: 'ð', desc: 'Voiced inter-dental fricative', words: ['this', 'mother', 'smooth'] },
  { sym: 's', desc: 'Voiceless alveolar fricative', words: ['see', 'city', 'pass'] },
  { sym: 'z', desc: 'Voiced alveolar fricative', words: ['zoo', 'busy', 'cars'] },
  { sym: 'ʃ', desc: 'Voiceless palato-alveolar fricative', words: ['shoe', 'nation', 'machine', 'wash'] },
  { sym: 'ʒ', desc: 'Voiced palato-alveolar fricative', words: ['genre', 'treasure', 'vision', 'mirage'] },
  { sym: 'h', desc: 'Voiceless glottal fricative', words: ['hat', 'behind', 'unholy'] },
  { sym: 'tʃ', desc: 'Voiceless palato-alveolar affricate', words: ['chalk', 'nature', 'watch'] },
  { sym: 'dʒ', desc: 'Voiced palato-alveolar affricate', words: ['joy', 'germ', 'danger', 'knowledge'] },
  { sym: 'm', desc: 'Voiced bilabial nasal', words: ['man', 'compare', 'bomb'] },
  { sym: 'n', desc: 'Voiced alveolar nasal', words: ['kin', 'knife', 'kitten'] },
  { sym: 'ŋ', desc: 'Voiced velar nasal', words: ['singer', 'bank', 'thing'] },
  { sym: 'l', desc: 'Voiced alveolar lateral liquid', words: ['lame', 'believe', 'call'] },
  { sym: 'r', desc: 'Voiced alveolar liquid (the textbook calls it a “roll”; in standard British English it is an approximant)', words: ['rhyme', 'road', 'wrist', 'free'] },
  { sym: 'j', desc: 'Voiced palatal semi-vowel (approximant)', words: ['yes', 'new', 'use'] },
  { sym: 'w', desc: 'Voiced bilabial semi-vowel (approximant)', words: ['wet', 'quick', 'one'] },
]

const GROUPS = [
  { label: 'Pure vowels (12)', items: PURE },
  { label: 'Diphthongs (8)', items: DIPH },
  { label: 'Consonants (24)', items: CONS },
]

export default function PhonemeChart({ title }: { title?: string }) {
  const [g, setG] = useState(0)
  const [sel, setSel] = useState<Phoneme>(PURE[0])
  const [tts, setTts] = useState(false)
  useEffect(() => setTts(canSpeak()), [])
  const items = GROUPS[g].items

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🗣️ {title ?? 'The 44 sounds of English'}</p>
      <div className="p-3 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((grp, i) => (
            <button
              key={grp.label}
              onClick={() => {
                setG(i)
                setSel(grp.items[0])
              }}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold border ${
                i === g ? 'bg-brand-deep text-white border-brand-deep dark:bg-brand-sky dark:text-brand-navy dark:border-brand-sky' : 'border-brand-navy/15 dark:border-white/20'
              }`}
            >
              {grp.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {items.map(p => (
            <button
              key={p.sym}
              onClick={() => setSel(p)}
              aria-pressed={sel.sym === p.sym}
              className={`rounded-xl border px-1 py-2 text-center transition ${
                sel.sym === p.sym ? 'border-brand-deep bg-brand-sky/15 dark:border-brand-sky' : 'border-brand-navy/10 dark:border-white/15 hover:bg-brand-sky/10'
              }`}
            >
              <span className="block font-serif text-[20px] leading-tight">/{p.sym}/</span>
              <span className="block text-[10.5px] text-brand-navy/60 dark:text-white/60 truncate">{p.n ? `Vowel ${p.n}` : p.words[0]}</span>
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-brand-navy/10 dark:border-white/10 bg-brand-soft/40 dark:bg-white/5 px-3 py-2.5">
          <p className="font-serif text-[26px] leading-none">/{sel.sym}/</p>
          <p className="mt-1 text-[13px] font-semibold">
            {sel.n ? `Vowel ${sel.n} — ` : ''}
            {sel.desc}
          </p>
          {sel.spell && <p className="text-[12px] text-brand-navy/70 dark:text-white/70">Common spellings: {sel.spell}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sel.words.map(w => (
              <button
                key={w}
                onClick={() => tts && speak(w)}
                disabled={!tts}
                className="rounded-lg border border-brand-navy/15 dark:border-white/20 px-2.5 py-1 text-[13px] hover:bg-brand-sky/10 disabled:cursor-default"
              >
                {tts ? '🔊 ' : ''}
                {w}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] text-brand-navy/50 dark:text-white/50">
            {tts
              ? 'Audio uses your device’s built-in voice (British English where available). Listen for the target sound, then say the word yourself.'
              : 'Audio is not available in this browser — say each word aloud, focusing on the target sound.'}
          </p>
        </div>
      </div>
    </div>
  )
}
