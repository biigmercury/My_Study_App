import { GoogleGenerativeAI } from '@google/generative-ai'
import type { QuizRequest, QuizResponse, QuizQuestion } from '@/types'

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

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  const topicName = topic.replace(/-/g, ' ')

  const prompt = `You are an exam question generator for a 200-level Computer Science course at the University of Ibadan, Nigeria.

Generate exactly 20 exam-style questions for:
- Course: ${course}
- Topic: ${topicName}
- Difficulty: ${difficulty}

Return ONLY valid JSON. Use this exact structure:
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
- Include exactly 15 MCQ and 5 short_answer questions
- easy: recall, definitions, basic identification
- medium: application, analysis, explain with examples
- hard: synthesis, derivation, complex problem-solving, compare and contrast
- Questions must be exam-style — the kind that would appear in a University of Ibadan final exam
- MCQ options must be clearly lettered A) B) C) D)
- correctAnswer for MCQ must exactly match one of the options strings`

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text()

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
