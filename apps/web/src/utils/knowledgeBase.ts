import { getNoteDisplayTitle } from './noteMeta'

export interface SearchResult {
  note: NoteInput
  score: number
  excerpt: string
  matches: string[]
}

interface NoteInput {
  id?: string
  title?: string
  content: string
  updatedAt?: string
  createdAt?: string
}

export function stripMarkdown(content: string = ''): string {
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

function getMatchExcerpt(content: string, matchIndex: number, queryLength: number): string {
  const radius = 72
  const start = Math.max(0, matchIndex - radius)
  const end = Math.min(content.length, matchIndex + queryLength + radius)
  return content.slice(start, end).replace(/\s+/g, ' ').trim()
}

export function getNoteExcerpt(note: NoteInput, query: string = ''): string {
  const plainText = stripMarkdown(note.content)

  if (!plainText) {
    return 'No content yet.'
  }

  if (!query.trim()) {
    return plainText.slice(0, 140)
  }

  const lowerText = plainText.toLowerCase()
  const lowerQuery = query.trim().toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) {
    return plainText.slice(0, 140)
  }

  return getMatchExcerpt(plainText, index, lowerQuery.length)
}

export function searchNotes(notes: NoteInput[], query: string = ''): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return notes.map((note) => ({
      note,
      score: 0,
      excerpt: getNoteExcerpt(note),
      matches: [],
    }))
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  return notes
    .map((note) => {
      const title = getNoteDisplayTitle(note)
      const titleText = title.toLowerCase()
      const bodyText = stripMarkdown(note.content).toLowerCase()
      const combined = `${titleText} ${bodyText}`

      const allTermsPresent = terms.every((term) => combined.includes(term))
      if (!allTermsPresent) {
        return null
      }

      let score = 0
      const matches: string[] = []

      if (titleText.includes(normalizedQuery)) {
        score += 140
        matches.push('title')
      }

      if (bodyText.includes(normalizedQuery)) {
        score += 50
        matches.push('content')
      }

      terms.forEach((term) => {
        if (titleText.includes(term)) {
          score += 32
        }

        if (bodyText.includes(term)) {
          score += 10
        }
      })

      return {
        note,
        score,
        excerpt: getNoteExcerpt(note, normalizedQuery),
        matches,
      }
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      return new Date(b.note.updatedAt || '').getTime() - new Date(a.note.updatedAt || '').getTime()
    })
}
