'use client'

import { useState, useEffect } from 'react'
import { getSettings } from '@/lib/settings'
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

  // Seed difficulty from saved settings each time the sheet opens
  useEffect(() => {
    if (isOpen) {
      setDifficulty(getSettings().quizDifficulty)
    }
  }, [isOpen])

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

  const score = getScore()

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: 'rgba(3,4,50,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] overflow-y-auto bg-white dark:bg-brand-surface"
        style={{ maxHeight: '88%', borderRadius: '28px 28px 0 0', boxShadow: '0 -16px 40px -10px rgba(0,0,0,0.35)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5">
          <div className="w-[38px] h-1 rounded-full bg-brand-navy/[0.18] dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3.5 pb-1.5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-[0.7px] uppercase text-brand-royal mb-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
              </svg>
              AI Quiz
            </div>
            <h3
              className="text-[22px] font-semibold text-brand-navy dark:text-white leading-[1.1] tracking-[-0.3px]"
              style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
            >
              {topicTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-brand-navy/50 dark:text-white/50 mt-1"
            style={{ background: 'rgba(3,4,94,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 pb-8 pt-3">
          {/* Start screen */}
          {!questions && !loading && (
            <div>
              <p className="text-[13.5px] text-brand-navy/65 dark:text-white/60 leading-[1.5] mb-4">
                Generate 20 exam-style questions tuned to this lesson. Pick a difficulty:
              </p>
              <div className="flex gap-2 mb-[18px]">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className="flex-1 py-3 rounded-[14px] text-[13px] font-semibold border capitalize transition-all"
                    style={{
                      background: difficulty === d ? '#00B4D8' : 'rgba(3,4,94,0.04)',
                      color: difficulty === d ? '#fff' : undefined,
                      borderColor: difficulty === d ? 'transparent' : 'rgba(3,4,94,0.08)',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {error && (
                <p className="text-sm text-red-500 mb-4 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)' }}>
                  {error}
                </p>
              )}
              <button
                onClick={generateQuiz}
                className="w-full py-[14px] rounded-2xl text-white font-bold text-[14px] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', boxShadow: '0 10px 28px -10px #00B4D8aa' }}
              >
                Generate quiz
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
                </svg>
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-10 h-10 border-3 border-brand-royal border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-brand-navy/50 dark:text-white/40">Generating questions…</p>
            </div>
          )}

          {/* Questions */}
          {questions && (
            <div>
              {submitted && (
                <div
                  className="mb-[18px] p-4 rounded-[18px] text-white text-center"
                  style={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)' }}
                >
                  <p className="text-[10px] font-bold tracking-[0.8px] uppercase opacity-80">Your score</p>
                  <p
                    className="text-[38px] font-semibold leading-[1.1] tracking-[-1px]"
                    style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
                  >
                    {score}<span className="text-[22px] opacity-60">/{questions.length}</span>
                  </p>
                  <p className="text-[12px] opacity-90 mt-0.5">
                    {Math.round((score / questions.length) * 100)}% ·{' '}
                    {score >= 4 ? 'Excellent work' : score >= 3 ? 'Solid effort' : "Let's review"}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3.5">
                {questions.map((q, i) => {
                  const isCorrect = submitted && answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                  const isWrong   = submitted && answers[q.id] && !isCorrect

                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl p-3.5"
                      style={{
                        border: `1px solid ${submitted ? (isCorrect ? '#22c55e44' : isWrong ? '#ef444444' : 'rgba(3,4,94,0.08)') : 'rgba(3,4,94,0.08)'}`,
                        background: submitted
                          ? isCorrect ? 'rgba(34,197,94,0.06)' : isWrong ? 'rgba(239,68,68,0.06)' : 'transparent'
                          : 'rgba(3,4,94,0.02)',
                      }}
                    >
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-[10px] font-bold text-brand-royal font-mono">Q{i + 1}</span>
                        <span className="text-[13.5px] font-semibold text-brand-navy dark:text-white leading-[1.35]">
                          {q.question}
                        </span>
                      </div>

                      {q.type === 'mcq' && q.options ? (
                        <div className="flex flex-col gap-1.5">
                          {q.options.map(opt => {
                            const selected = answers[q.id] === opt
                            const isCorrectOpt = submitted && opt === q.correctAnswer
                            return (
                              <label
                                key={opt}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors"
                                style={{
                                  background: isCorrectOpt ? 'rgba(34,197,94,0.14)' : selected ? 'rgba(0,180,216,0.12)' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${isCorrectOpt ? '#22c55e55' : selected ? '#00B4D8' : 'rgba(3,4,94,0.07)'}`,
                                }}
                                onClick={() => !submitted && handleAnswer(q.id, opt)}
                              >
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0 transition-colors"
                                  style={{
                                    border: `2px solid ${isCorrectOpt ? '#22c55e' : selected ? '#00B4D8' : 'rgba(3,4,94,0.25)'}`,
                                    background: selected || isCorrectOpt ? (isCorrectOpt ? '#22c55e' : '#00B4D8') : 'transparent',
                                  }}
                                />
                                <span className="text-[12.5px] text-brand-navy dark:text-white leading-[1.4]">{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      ) : (
                        <textarea
                          className="w-full text-sm p-3 rounded-xl border border-brand-navy/[0.08] dark:border-brand-cyan/[0.12] bg-white/80 dark:bg-brand-slate/60 text-brand-navy dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-royal/40"
                          rows={3}
                          placeholder="Type your answer…"
                          value={answers[q.id] || ''}
                          onChange={e => handleAnswer(q.id, e.target.value)}
                          disabled={submitted}
                        />
                      )}

                      {submitted && (
                        <div className="mt-2.5 pt-2.5 border-t border-brand-navy/[0.08] dark:border-brand-cyan/[0.10]">
                          <p className="text-xs text-brand-navy/70 dark:text-white/60 leading-[1.5]">
                            <span className="text-brand-royal font-semibold">Why · </span>
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-[18px]">
                <button
                  onClick={submitted ? handleReset : () => setSubmitted(true)}
                  className="w-full py-[14px] rounded-2xl font-bold text-[14px] transition-all"
                  style={
                    submitted
                      ? { background: 'rgba(3,4,94,0.06)', color: '#03045E', border: '1px solid rgba(3,4,94,0.08)' }
                      : { background: 'linear-gradient(135deg, #0077B6, #00B4D8)', color: '#fff', boxShadow: '0 10px 28px -10px #00B4D899' }
                  }
                >
                  {submitted ? 'Try again' : 'Submit answers'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
