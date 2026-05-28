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

// Request browser notification permission and return whether it was granted
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// Schedule an in-page daily reminder (fires while tab is open).
// Returns the timeout ID so the caller can cancel it.
let _reminderTimeout: ReturnType<typeof setTimeout> | null = null

export function scheduleReminder(hour = 20, minute = 0): void {
  if (_reminderTimeout) clearTimeout(_reminderTimeout)
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return

  const now = new Date()
  const next = new Date()
  next.setHours(hour, minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)

  _reminderTimeout = setTimeout(() => {
    new Notification('StudyOS — time to study!', {
      body: `Your daily goal of ${getSettings().dailyGoal} topic${getSettings().dailyGoal > 1 ? 's' : ''} is waiting.`,
      icon: '/logo.jpg',
    })
    scheduleReminder(hour, minute) // reschedule for next day
  }, next.getTime() - now.getTime())
}

export function cancelReminder(): void {
  if (_reminderTimeout) {
    clearTimeout(_reminderTimeout)
    _reminderTimeout = null
  }
}
