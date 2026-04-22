export interface Course {
  code: string
  name: string
  shortName: string
  creditHours: number
  description: string
  accent: string
  accentFrom: string
  accentTo: string
  icon: string
  topics: Topic[]
}

export interface Topic {
  slug: string
  title: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface MDXFrontmatter {
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface CourseProgress {
  completedTopics: string[]
  lastVisited: string
}

export type ProgressStore = Record<string, CourseProgress>

export interface QuizQuestion {
  id: string
  type: 'mcq' | 'short_answer'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
}

export interface QuizRequest {
  course: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface QuizResponse {
  questions: QuizQuestion[]
  courseCode: string
  topicSlug: string
  generatedAt: string
}
