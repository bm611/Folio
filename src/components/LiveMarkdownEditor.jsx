import { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { createAuraEditorExtensions } from '../editor/core/extensions'
import { runAuraEditorCommand } from '../editor/core/editorCommands'
import { docToMarkdown, markdownToDoc } from '../editor/markdown/markdownConversion'
import TableBubbleMenu from './TableBubbleMenu'

function sanitizeDoc(doc, extensions) {
  if (!doc || doc.type !== 'doc') {
    return markdownToDoc('', extensions)
  }

  return doc
}

export default function LiveMarkdownEditor({
  value,
  contentDoc,
  onChange,
  onRegisterEditorApi,
}) {
  const extensions = useMemo(() => createAuraEditorExtensions(), [])
  const lastSerializedRef = useRef(null)
  const debounceRef = useRef(null)
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

  useEffect(() => {
    if (!editor) {
      return undefined
    }

    const emitChange = () => {
      const nextDoc = editor.getJSON()
      const nextMarkdown = docToMarkdown(nextDoc)
      const nextPayload = {
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

    const api = {
      focus() {
        editor.chain().focus('end', { scrollIntoView: false }).run()
      },
      runCommand(commandId) {
        runAuraEditorCommand(editor, commandId)
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
    <div className="aura-editor">
      <TableBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
