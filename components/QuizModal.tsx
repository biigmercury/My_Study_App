'use client'

import { useState } from 'react'
import type { QuizQuestion } from '@/types'

interface QuizModalProps {
  courseCode: string
  topicSlug: string
  topicTitle: string
  isOpen: boolean
  onClose: () => void
}

type Difficulty = 'easy' | 'medium' | 'hard'
type Answers = Record<string, string>

export default function QuizModal({ courseCode, topicSlug, topicTitle, isOpen, onClose }: QuizModalProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateQuiz = async () => {
    setLoading(true)
    setError(null)
    setQuestions(null)
    setAnswers({})
    setSubmitted(false)

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course: courseCode, topic: topicSlug, difficulty }),
      })
      if (!res.ok) throw new Error('Failed to generate quiz')
      const data = await res.json()
      setQuestions(data.questions)
    } catch {
      setError('Could not generate quiz. Check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (qId: string, value: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  const handleSubmit = () => {
    if (!questions) return
    setSubmitted(true)
  }

  const handleReset = () => {
    setQuestions(null)
    setAnswers({})
    setSubmitted(false)
    setError(null)
  }

  const getScore = () => {
    if (!questions) return 0
    return questions.filter(q => answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()).length
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-brand-frost dark:bg-brand-slate rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 64px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
        </div>

        <div className="px-5 pb-8 pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Quiz</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{topicTitle}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
              ✕
            </button>
          </div>

          {/* Start screen */}
          {!questions && !loading && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Generate 5 exam-style questions. Choose difficulty:
              </p>
              <div className="flex gap-2 mb-6">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                      difficulty === d
                        ? 'bg-brand-gradient text-white border-transparent'
                        : 'bg-white dark:bg-brand-slate text-brand-navy dark:text-brand-ice border-brand-ice/60 dark:border-brand-ocean/30'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">{error}</p>}
              <button
                onClick={generateQuiz}
                className="w-full py-3.5 rounded-2xl bg-brand-gradient text-white font-bold text-sm shadow-lg shadow-brand-ocean/30"
              >
                Generate Quiz ✨
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-10 h-10 border-3 border-brand-ocean dark:border-brand-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Generating questions...</p>
            </div>
          )}

          {/* Questions */}
          {questions && (
            <div>
              {submitted && (
                <div className="mb-5 p-4 rounded-xl bg-brand-gradient">
                  <p className="text-white font-bold text-center">
                    Score: {getScore()}/{questions.length} — {Math.round((getScore() / questions.length) * 100)}%
                  </p>
                </div>
              )}

              <div className="space-y-5">
                {questions.map((q, i) => {
                  const isCorrect = submitted && answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                  const isWrong = submitted && answers[q.id] && !isCorrect

                  return (
                    <div key={q.id} className={`p-4 rounded-xl border ${
                      submitted
                        ? isCorrect
                          ? 'border-green-400/60 bg-green-50 dark:bg-green-950/20'
                          : isWrong
                            ? 'border-red-400/60 bg-red-50 dark:bg-red-950/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'
                    }`}>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
                        <span className="text-brand-ocean dark:text-brand-cyan">Q{i + 1}.</span> {q.question}
                      </p>

                      {q.type === 'mcq' && q.options ? (
                        <div className="space-y-2">
                          {q.options.map(opt => (
                            <label key={opt} className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-all ${
                              answers[q.id] === opt
                                ? 'border-brand-ocean dark:border-brand-cyan bg-brand-frost dark:bg-brand-navy/60'
                                : 'border-transparent bg-brand-ice/20 dark:bg-brand-slate/60 hover:bg-brand-ice/40 dark:hover:bg-brand-slate'
                            }`}>
                              <input
                                type="radio"
                                name={q.id}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={() => handleAnswer(q.id, opt)}
                                className="mt-0.5 accent-brand-royal"
                                disabled={submitted}
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className="w-full text-sm p-3 rounded-lg border border-brand-ice/60 dark:border-brand-ocean/30 bg-white dark:bg-brand-slate text-brand-navy dark:text-brand-ice resize-none focus:outline-none focus:ring-2 focus:ring-brand-ocean dark:focus:ring-brand-cyan"
                          rows={3}
                          placeholder="Type your answer..."
                          value={answers[q.id] || ''}
                          onChange={e => handleAnswer(q.id, e.target.value)}
                          disabled={submitted}
                        />
                      )}

                      {submitted && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            ✓ Answer: <span className="text-green-600 dark:text-green-400">{q.correctAnswer}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex gap-3">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-3.5 rounded-2xl bg-brand-gradient text-white font-bold text-sm"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
