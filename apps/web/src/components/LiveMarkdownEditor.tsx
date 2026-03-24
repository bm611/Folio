import { useEffect, useMemo, useRef } from 'react'

import { EditorContent, useEditor } from '@tiptap/react'
import type { JSONContent, Editor } from '@tiptap/react'

import { createFolioEditorExtensions } from '../editor/core/extensions'
import { runFolioEditorCommand } from '../editor/core/editorCommands'
import { docToMarkdown, markdownToDoc } from '../editor/markdown/markdownConversion'
import TableBubbleMenu from './TableBubbleMenu'
import type { NoteFile } from '../types'

export interface EditorPayload {
  content: string
  contentDoc: JSONContent
  editorVersion: number
}

export interface EditorApi {
  focus: () => void
  runCommand: (commandId: string) => void
  getEditor: () => Editor | null
}

interface LiveMarkdownEditorProps {
  value: string
  contentDoc?: JSONContent
  notes?: NoteFile[]
  currentNoteId?: string
  currentNoteTitle?: string
  wideMode?: boolean
  onChange: (payload: EditorPayload) => void
  onRegisterEditorApi?: (api: EditorApi | null) => void
}

function sanitizeDoc(doc: JSONContent | undefined, extensions: ReturnType<typeof createFolioEditorExtensions>): JSONContent {
  if (!doc || doc.type !== 'doc') {
    return markdownToDoc('', extensions)
  }

  return doc
}

export default function LiveMarkdownEditor({
  value,
  contentDoc,
  notes,
  currentNoteId,
  currentNoteTitle,
  wideMode,
  onChange,
  onRegisterEditorApi,
}: LiveMarkdownEditorProps) {
  const extensions = useMemo(() => createFolioEditorExtensions(), [])
  const lastSerializedRef = useRef<string | null>(null)
  const debounceRef = useRef<number | undefined>(undefined)
  const initialDoc = useMemo(
    () => (contentDoc ? sanitizeDoc(contentDoc, extensions) : markdownToDoc(value, extensions)),
    [contentDoc, extensions, value]
  )
  const initialPayload = useMemo(
    () =>
      JSON.stringify({
        content: value,
        contentDoc: contentDoc || null,
        editorVersion: contentDoc ? 2 : undefined,
      }),
    [contentDoc, value]
  )

  const editor = useEditor({
    extensions,
    content: initialDoc,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'aura-prosemirror',
        spellcheck: 'true',
      },
    },
  })

  // ─── Sync notes + current note info into editor.storage for AiPromptBlock ───
  useEffect(() => {
    if (!editor) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = editor.storage as any
    if (storage.aiPromptBlock) {
      storage.aiPromptBlock.notes = (notes ?? []).map((n) => ({
        id: n.id,
        title: n.title || 'Untitled',
        content: n.content,
      }))
      storage.aiPromptBlock.currentNoteId = currentNoteId ?? ''
      storage.aiPromptBlock.currentNoteTitle = currentNoteTitle ?? ''
    }
  }, [editor, notes, currentNoteId, currentNoteTitle])

  useEffect(() => {
    if (!editor) {
      return undefined
    }

    const emitChange = () => {
      const nextDoc = editor.getJSON()
      const nextMarkdown = docToMarkdown(nextDoc)
      const nextPayload: EditorPayload = {
        content: nextMarkdown,
        contentDoc: nextDoc,
        editorVersion: 2,
      }

      const serialized = JSON.stringify(nextPayload)
      if (serialized === lastSerializedRef.current) {
        return
      }

      lastSerializedRef.current = serialized
      onChange(nextPayload)
    }

    const handleUpdate = () => {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(emitChange, 120)
    }

    editor.on('update', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
      window.clearTimeout(debounceRef.current)
    }
  }, [editor, onChange])

  useEffect(() => {
    lastSerializedRef.current = initialPayload
  }, [initialPayload])

  useEffect(() => {
    if (!editor) {
      return undefined
    }

    const api: EditorApi = {
      focus() {
        editor.chain().focus('end', { scrollIntoView: false }).run()
      },
      runCommand(commandId: string) {
        runFolioEditorCommand(editor, commandId)
      },
      getEditor() {
        return editor
      },
    }

    onRegisterEditorApi?.(api)

    return () => {
      onRegisterEditorApi?.(null)
    }
  }, [editor, onRegisterEditorApi])

  if (!editor) {
    return null
  }

  return (
    <div className={`aura-editor${wideMode ? ' aura-editor--wide' : ''}`}>
      <EditorContent editor={editor} />
      <TableBubbleMenu editor={editor} />
    </div>
  )
}
