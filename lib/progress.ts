import type { ProgressStore, CourseProgress } from '@/types'

const STORAGE_KEY = 'studyos-progress'

export function getProgress(): ProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getCourseProgress(courseCode: string): CourseProgress {
  const all = getProgress()
  return all[courseCode] ?? { completedTopics: [], lastVisited: '' }
}

export function markTopicComplete(courseCode: string, topicSlug: string): void {
  if (typeof window === 'undefined') return
  const all = getProgress()
  const course = all[courseCode] ?? { completedTopics: [], lastVisited: '' }
  if (!course.completedTopics.includes(topicSlug)) {
    course.completedTopics = [...course.completedTopics, topicSlug]
  }
  course.lastVisited = new Date().toISOString()
  all[courseCode] = course
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function markTopicIncomplete(courseCode: string, topicSlug: string): void {
  if (typeof window === 'undefined') return
  const all = getProgress()
  if (!all[courseCode]) return
  all[courseCode].completedTopics = all[courseCode].completedTopics.filter(s => s !== topicSlug)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function setLastVisited(courseCode: string): void {
  if (typeof window === 'undefined') return
  const all = getProgress()
  if (!all[courseCode]) {
    all[courseCode] = { completedTopics: [], lastVisited: '' }
  }
  all[courseCode].lastVisited = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function resetAllProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function getOverallStats(totalTopics: number): {
  completedTopics: number
  totalTopics: number
  activeStreak: number
  lastCourseCode: string | null
} {
  const all = getProgress()
  let completedTopics = 0
  let latestDate = ''
  let lastCourseCode: string | null = null

  for (const [code, data] of Object.entries(all)) {
    completedTopics += data.completedTopics.length
    if (data.lastVisited > latestDate) {
      latestDate = data.lastVisited
      lastCourseCode = code
    }
  }

  const today = new Date().toDateString()
  const hasActivityToday = Object.values(all).some(
    p => p.lastVisited && new Date(p.lastVisited).toDateString() === today
  )

  return { completedTopics, totalTopics, activeStreak: hasActivityToday ? 1 : 0, lastCourseCode }
}
