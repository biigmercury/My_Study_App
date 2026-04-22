import Anthropic from '@anthropic-ai/sdk'
import type { QuizRequest, QuizResponse, QuizQuestion } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  let body: QuizRequest
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { course, topic, difficulty } = body

  if (!course || !topic || !['easy', 'medium', 'hard'].includes(difficulty)) {
    return Response.json({ error: 'Invalid request parameters' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const topicName = topic.replace(/-/g, ' ')

  const prompt = `You are an exam question generator for a 200-level Computer Science course at the University of Ibadan, Nigeria.

Generate exactly 5 exam-style questions for:
- Course: ${course}
- Topic: ${topicName}
- Difficulty: ${difficulty}

Return ONLY valid JSON with no markdown, no extra text, no code fences. Use this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ...",
      "explanation": "..."
    },
    {
      "id": "q2",
      "type": "short_answer",
      "question": "...",
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}

Rules:
- Include at least 3 MCQ and 2 short_answer questions
- easy: recall, definitions, basic identification
- medium: application, analysis, explain with examples
- hard: synthesis, derivation, complex problem-solving, compare and contrast
- Questions must be exam-style — the kind that would appear in a University of Ibadan final exam
- MCQ options must be clearly lettered A) B) C) D)
- correctAnswer for MCQ must exactly match one of the options strings`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: 'text'; text: string }).text.trim()

    let parsed: { questions: QuizQuestion[] }
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Try to extract JSON if wrapped in anything
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No valid JSON found in response')
      parsed = JSON.parse(match[0])
    }

    const response: QuizResponse = {
      questions: parsed.questions,
      courseCode: course,
      topicSlug: topic,
      generatedAt: new Date().toISOString(),
    }

    return Response.json(response)
  } catch (err) {
    console.error('Quiz generation error:', err)
    return Response.json({ error: 'Failed to generate quiz. Check API key and try again.' }, { status: 500 })
  }
}
