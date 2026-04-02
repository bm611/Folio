/**
 * Lightweight local dev proxy for the Netlify chat function.
 * Run alongside Vite: `npm run dev:ai`
 *
 * Reads OPENROUTER_API_KEY from .env and proxies
 * POST /.netlify/functions/chat to OpenRouter with SSE streaming.
 *
 * No external deps beyond Node 18+ built-ins + the openai SDK
 * already in the project.
 */

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ── Load .env manually (no dotenv dependency) ──────────────────
const envPath = resolve(import.meta.dirname, '..', '.env')
let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''

try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*OPENROUTER_API_KEY\s*=\s*(.+?)\s*$/)
    if (match) {
      OPENROUTER_API_KEY = match[1].replace(/^['"]|['"]$/g, '')
    }
  }
} catch {
  // .env may not exist
}

if (!OPENROUTER_API_KEY) {
  console.error('\x1b[31m[dev-server] OPENROUTER_API_KEY not found in .env\x1b[0m')
  process.exit(1)
}

const MODEL = 'google/gemini-2.5-flash-lite'
const PORT = 9898

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST' || req.url !== '/.netlify/functions/chat') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  // Read body
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }

  let body
  try {
    body = JSON.parse(Buffer.concat(chunks).toString())
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid JSON' }))
    return
  }

  const { question, noteContents, mode } = body

  if (!question || typeof question !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Missing "question"' }))
    return
  }

  const contextBlock = (noteContents ?? [])
    .map((n, i) => `--- Note ${i + 1}: "${n.title}" ---\n${n.content}`)
    .join('\n\n')

  const inlineRule = `\n\nIMPORTANT: Output ONLY the requested content in markdown. Do NOT add any preamble, introduction, explanation, or closing remarks. For example, if asked for a shopping todo list, output only the list — no "Here's your list:" or "Let me know if you need anything else." Your output will be inserted directly into the user's note.`

  const isInline = mode === 'inline'

  let systemPrompt

  if (isInline) {
    systemPrompt = contextBlock
      ? `You are Folio AI, a writing assistant embedded in a note-taking app. Generate the content the user asks for. If they referenced notes, use them as context — but always fulfill the request even if the notes don't cover the topic. Never refuse or say you lack information.${inlineRule}\n\n${contextBlock}`
      : `You are Folio AI, a writing assistant embedded in a note-taking app. Generate whatever content the user asks for. Never refuse or say you lack information.${inlineRule}`
  } else {
    systemPrompt = contextBlock
      ? `You are Folio AI, a helpful assistant embedded in a note-taking app. The user has referenced the following notes as context for their question. Use these notes to provide an accurate, well-grounded answer. If the notes don't contain enough information to fully answer, say so.\n\n${contextBlock}`
      : `You are Folio AI, a helpful assistant embedded in a note-taking app. Answer the user's question concisely and helpfully.`
  }

  // Call OpenRouter
  let upstream
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        stream: true,
      }),
    })
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
    return
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
    res.end(text)
    return
  }

  // Stream SSE back to client
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n')
          continue
        }

        try {
          const parsed = JSON.parse(data)
          const token = parsed.choices?.[0]?.delta?.content
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`)
          }
        } catch {
          // skip malformed frames
        }
      }
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
  }

  res.end()
})

server.listen(PORT, () => {
  console.log(`\x1b[36m[dev-server] AI proxy running at http://localhost:${PORT}\x1b[0m`)
  console.log(`\x1b[90m[dev-server] Proxying /.netlify/functions/chat -> OpenRouter (${MODEL})\x1b[0m`)
})
