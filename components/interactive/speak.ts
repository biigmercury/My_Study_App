// Shared text-to-speech helper for pronunciation components. Uses the browser's built-in voices
// (no network, so it works under the strict CSP). Prefers a British English voice when one exists.

let cached: SpeechSynthesisVoice | null | undefined

function pickVoice(): SpeechSynthesisVoice | null {
  if (cached !== undefined) return cached
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null // not loaded yet — try again next time
  cached =
    voices.find(v => v.lang === 'en-GB' && /female|google|natural/i.test(v.name)) ??
    voices.find(v => v.lang === 'en-GB') ??
    voices.find(v => v.lang.startsWith('en')) ??
    null
  return cached
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

export function speak(text: string, rate = 0.85) {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice()
  if (v) u.voice = v
  u.lang = v?.lang ?? 'en-GB'
  u.rate = rate
  window.speechSynthesis.speak(u)
}
