import type { TreeNode, NoteFile, NoteFolder } from '../types'

const createdAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function normalizeNote(note: TreeNode): TreeNode {
  if (note.type === 'folder') {
    return {
      ...note,
      name: typeof note.name === 'string' ? note.name : 'Untitled',
      children: Array.isArray((note as NoteFolder).children) ? (note as NoteFolder).children.map(normalizeNote) : [],
    } as NoteFolder
  }

  const fileNote = note as NoteFile
  const fallbackTimestamp = fileNote.updatedAt || fileNote.createdAt || new Date().toISOString()
  const contentDoc =
    fileNote.contentDoc && typeof fileNote.contentDoc === 'object' && !Array.isArray(fileNote.contentDoc)
      ? fileNote.contentDoc
      : undefined

  return {
    ...fileNote,
    title: typeof fileNote.title === 'string' ? fileNote.title : '',
    content: typeof fileNote.content === 'string' ? fileNote.content : '',
    contentDoc,
    editorVersion: fileNote.editorVersion === 2 ? 2 : undefined,
    createdAt: fileNote.createdAt || fallbackTimestamp,
    updatedAt: fileNote.updatedAt || fileNote.createdAt || fallbackTimestamp,
    wordGoal: typeof fileNote.wordGoal === 'number' && fileNote.wordGoal > 0 ? fileNote.wordGoal : null,
    tags: Array.isArray(fileNote.tags) ? fileNote.tags.filter((t: string) => typeof t === 'string' && t.trim()) : [],
  } as NoteFile
}

export function formatCreatedAt(createdAt: string): string {
  const parsed = new Date(createdAt)

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown'
  }

  return createdAtFormatter.format(parsed)
}

export function countBodyWords(content: string = ''): number {
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

  const words = plainText.match(/\b[\p{L}\p{N}][\p{L}\p{N}''-]*\b/gu)
  return words?.length ?? 0
}

export function getNoteDisplayTitle(note: { title?: string }): string {
  return note?.title?.trim() || 'Untitled'
}

export function estimateReadTime(content: string = ''): string {
  const words = countBodyWords(content)
  if (words === 0) return ''
  const minutes = Math.round(words / 200)
  return minutes < 1 ? '<1 min read' : `~${minutes} min read`
}
