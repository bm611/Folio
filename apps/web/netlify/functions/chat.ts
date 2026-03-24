import OpenAI from 'openai'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''
const MODEL = "x-ai/grok-4.1-fast"

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: { question: string; noteContents: { title: string; content: string }[] }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { question, noteContents } = body

  if (!question || typeof question !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing "question" field' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const contextBlock = (noteContents ?? [])
    .map(
      (n: { title: string; content: string }, i: number) =>
        `--- Note ${i + 1}: "${n.title}" ---\n${n.content}`
    )
    .join('\n\n')

  const systemPrompt = contextBlock
    ? `You are Folio AI, a helpful assistant embedded in a note-taking app. The user has referenced the following notes as context for their question. Use these notes to provide an accurate, well-grounded answer. If the notes don't contain enough information to fully answer, say so.\n\n${contextBlock}`
    : `You are Folio AI, a helpful assistant embedded in a note-taking app. Answer the user's question concisely and helpfully.`

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY,
  })

  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`)
              )
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: (err as Error).message })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const config = {
  path: '/.netlify/functions/chat',
}
