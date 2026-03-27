export interface AiChatRequest {
  question: string
  noteContents: { title: string; content: string }[]
}

export interface AiStreamCallbacks {
  onToken: (token: string) => void
  onDone: () => void
  onError: (error: string) => void
}

export async function streamAiChat(
  request: AiChatRequest,
  callbacks: AiStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const { onToken, onDone, onError } = callbacks

  let response: Response

  try {
    response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return
    }
    onError('Failed to connect to AI service.')
    return
  }

  if (!response.ok) {
    let message = `AI request failed (${response.status})`
    if (response.status === 429) {
      message = 'Rate limited — the free model has usage limits. Wait a moment and try again.'
    }
    try {
      const text = await response.text()
      const body = JSON.parse(text)
      if (body.error) {
        message = typeof body.error === 'string' ? body.error : body.error.message ?? message
      }
    } catch {
      // ignore parse errors, keep the default message
    }
    onError(message)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onError('No response stream available.')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) {
          continue
        }

        const data = trimmed.slice(6)

        if (data === '[DONE]') {
          onDone()
          return
        }

        try {
          const parsed = JSON.parse(data) as { token?: string; error?: string }
          if (parsed.error) {
            onError(parsed.error)
            return
          }
          if (parsed.token) {
            onToken(parsed.token)
          }
        } catch {
          // skip malformed SSE frames
        }
      }
    }

    onDone()
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return
    }
    onError((err as Error).message || 'Stream interrupted.')
  } finally {
    reader.releaseLock()
  }
}
