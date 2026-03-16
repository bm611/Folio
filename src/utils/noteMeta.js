const createdAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function normalizeNote(note) {
  if (note.type === 'folder') {
    return {
      ...note,
      name: typeof note.name === 'string' ? note.name : 'Untitled',
      children: Array.isArray(note.children) ? note.children.map(normalizeNote) : [],
    }
  }

  const fallbackTimestamp = note.updatedAt || note.createdAt || new Date().toISOString()
  const contentDoc =
    note.contentDoc && typeof note.contentDoc === 'object' && !Array.isArray(note.contentDoc)
      ? note.contentDoc
      : undefined

  return {
    ...note,
    title: typeof note.title === 'string' ? note.title : '',
    content: typeof note.content === 'string' ? note.content : '',
    contentDoc,
    editorVersion: note.editorVersion === 2 ? 2 : undefined,
    createdAt: note.createdAt || fallbackTimestamp,
    updatedAt: note.updatedAt || note.createdAt || fallbackTimestamp,
    wordGoal: typeof note.wordGoal === 'number' && note.wordGoal > 0 ? note.wordGoal : null,
    tags: Array.isArray(note.tags) ? note.tags.filter(t => typeof t === 'string' && t.trim()) : [],
  }
}

export function formatCreatedAt(createdAt) {
  const parsed = new Date(createdAt)

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown'
  }

  return createdAtFormatter.format(parsed)
}

export function countBodyWords(content = '') {
  const plainText = content
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

  if (!plainText) {
    return 0
  }

  const words = plainText.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu)
  return words?.length ?? 0
}

export function getNoteDisplayTitle(note) {
  return note?.title?.trim() || 'Untitled'
}

export function estimateReadTime(content = '') {
  const words = countBodyWords(content)
  if (words === 0) return ''
  const minutes = Math.round(words / 200)
  return minutes < 1 ? '<1 min read' : `~${minutes} min read`
}
