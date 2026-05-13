import type { NoteFile } from '../types'
import { docToMarkdown } from '../editor/markdown/markdownConversion'

function getFileName(note: NoteFile): string {
  const title = note.title?.trim() || 'untitled'
  return (
    title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '.md'
  )
}

function exportBrowserDownload(markdown: string, fileName: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportNoteAsMarkdown(note: NoteFile): void {
  const markdown = note.contentDoc ? docToMarkdown(note.contentDoc) : note.content || ''
  const fileName = getFileName(note)
  exportBrowserDownload(markdown, fileName)
}
