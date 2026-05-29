export type QuizDifficulty = 'easy' | 'medium' | 'hard'

export interface AppSettings {
  dailyReminders: boolean
  reminderHour: number
  reminderMinute: number
  dailyGoal: number
  quizDifficulty: QuizDifficulty
}

const KEY = 'studyos-settings'

export const DEFAULTS: AppSettings = {
  dailyReminders: false,
  reminderHour: 20,
  reminderMinute: 0,
  dailyGoal: 1,
  quizDifficulty: 'medium',
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

// ─── Service worker ─────────────────────────────────────────────────────────
// Notifications shown via the service worker registration appear as real
// system notifications (and work on mobile / installed PWAs), unlike the
// plain `new Notification()` constructor which is unreliable on mobile.

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? (await registerServiceWorker())
  } catch {
    return null
  }
}

// Show a notification — prefer the service worker (system-level, mobile-friendly),
// fall back to the Notification constructor on desktop browsers without an active SW.
export async function showNotification(title: string, body: string): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const options: NotificationOptions = {
    body,
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    tag: 'studyos-reminder',
  }

  const reg = await getSWRegistration()
  if (reg) {
    await reg.showNotification(title, options)
  } else {
    // eslint-disable-next-line no-new
    new Notification(title, options)
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// ─── Daily reminder scheduling ──────────────────────────────────────────────
// In-page scheduling: fires while the app is open. We persist the next fire
// time and re-arm on every app launch (see ReminderManager). A guard prevents
// double-firing within the same day.

let _reminderTimeout: ReturnType<typeof setTimeout> | null = null
const LAST_FIRED_KEY = 'studyos-reminder-last-fired'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function scheduleReminder(hour = 20, minute = 0): void {
  if (_reminderTimeout) { clearTimeout(_reminderTimeout); _reminderTimeout = null }
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const now = new Date()
  const next = new Date()
  next.setHours(hour, minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)

  const delay = next.getTime() - now.getTime()

  _reminderTimeout = setTimeout(() => {
    const goal = getSettings().dailyGoal
    // Guard: only fire once per calendar day
    if (localStorage.getItem(LAST_FIRED_KEY) !== todayKey()) {
      localStorage.setItem(LAST_FIRED_KEY, todayKey())
      void showNotification(
        'StudyOS — time to study!',
        `Your daily goal of ${goal} topic${goal > 1 ? 's' : ''} is waiting.`,
      )
    }
    scheduleReminder(hour, minute) // re-arm for the next day
  }, delay)
}

export function cancelReminder(): void {
  if (_reminderTimeout) {
    clearTimeout(_reminderTimeout)
    _reminderTimeout = null
  }
}

// Called on app launch to re-arm the reminder if the user has it enabled.
export function initReminders(): void {
  if (typeof window === 'undefined') return
  const s = getSettings()
  if (s.dailyReminders && 'Notification' in window && Notification.permission === 'granted') {
    scheduleReminder(s.reminderHour, s.reminderMinute)
  }
}
