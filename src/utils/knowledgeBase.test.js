import { describe, expect, it } from 'vitest'

import { getNoteExcerpt, searchNotes } from './knowledgeBase'

const notes = [
  {
    id: 'body-match',
    title: 'Weekly planning',
    content: 'This note mentions launch planning in the body.',
    updatedAt: '2026-03-10T10:00:00.000Z',
    createdAt: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'title-match',
    title: 'Launch checklist',
    content: 'Secondary body copy.',
    updatedAt: '2026-03-09T10:00:00.000Z',
    createdAt: '2026-03-09T10:00:00.000Z',
  },
  {
    id: 'recent-tie-breaker',
    title: 'Sprint retrospective',
    content: 'launch learnings',
    updatedAt: '2026-03-11T10:00:00.000Z',
    createdAt: '2026-03-11T10:00:00.000Z',
  },
]

describe('knowledge base search', () => {
  it('creates excerpts from markdown notes', () => {
    expect(getNoteExcerpt({ content: '# Heading\n\nBody copy for the note.' })).toContain('Heading')
  })

  it('prioritizes title matches and uses updatedAt as a tie breaker', () => {
    const results = searchNotes(notes, 'launch')

    expect(results.map((result) => result.note.id)).toEqual([
      'title-match',
      'recent-tie-breaker',
      'body-match',
    ])
  })
})
