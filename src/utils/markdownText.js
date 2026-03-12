export function markdownToPlainText(content = '') {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, ' $1 ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
    .replace(/^>\s?/gm, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/^[-*+]\s+/gm, ' ')
    .replace(/^\d+\.\s+/gm, ' ')
    .replace(/[*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function countPlainTextWords(text = '') {
  if (!text) {
    return 0
  }

  const words = text.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu)
  return words?.length ?? 0
}

export function countMarkdownWords(content = '') {
  return countPlainTextWords(markdownToPlainText(content))
}

export function formatReadTimeFromWordCount(wordCount, wordsPerMinute = 200) {
  if (wordCount <= 0) {
    return ''
  }

  const minutes = Math.round(wordCount / wordsPerMinute)
  return minutes < 1 ? '<1 min read' : `~${minutes} min read`
}

function getMatchExcerpt(content, matchIndex, queryLength, radius = 72) {
  const start = Math.max(0, matchIndex - radius)
  const end = Math.min(content.length, matchIndex + queryLength + radius)
  return content.slice(start, end).replace(/\s+/g, ' ').trim()
}

export function getMarkdownExcerpt(content = '', query = '', fallback = 'No content yet.') {
  const plainText = markdownToPlainText(content)

  if (!plainText) {
    return fallback
  }

  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return plainText.slice(0, 140)
  }

  const lowerText = plainText.toLowerCase()
  const index = lowerText.indexOf(normalizedQuery)

  if (index === -1) {
    return plainText.slice(0, 140)
  }

  return getMatchExcerpt(plainText, index, normalizedQuery.length)
}
