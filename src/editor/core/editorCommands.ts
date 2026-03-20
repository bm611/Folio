import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import { getEditorCommandById } from '../../utils/editorCommands'

interface CommandOptions {
  range?: { from: number; to: number }
}

function formatToday(): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date())
}

function getDefaultCalloutAttrs() {
  return {
    calloutKind: 'note',
    title: 'Note',
    foldable: false,
    defaultCollapsed: false,
  }
}

export function runAuraEditorCommand(editor: Editor, commandId: string, options: CommandOptions = {}): boolean {
  if (!editor) {
    return false
  }

  const command = getEditorCommandById(commandId)
  if (!command) {
    return false
  }

  const chain = editor.chain().focus(undefined, { scrollIntoView: false })

  if (options.range) {
    chain.deleteRange(options.range)
  }

  switch (commandId) {
    case 'heading-1':
      return chain.toggleHeading({ level: 1 }).run()
    case 'heading-2':
      return chain.toggleHeading({ level: 2 }).run()
    case 'heading-3':
      return chain.toggleHeading({ level: 3 }).run()
    case 'todo':
      return chain
        .insertContent({
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph' }],
            },
          ],
        })
        .command(({ tr }) => {
          const { doc } = tr
          const resolvedPos = tr.selection.$from
          for (let i = resolvedPos.pos - 1; i >= 0; i--) {
            const node = doc.nodeAt(i)
            if (node && node.type.name === 'taskItem') {
              tr.setSelection(TextSelection.near(doc.resolve(i + 2)))
              return true
            }
          }
          return true
        })
        .run()
    case 'bullets':
      return chain.toggleBulletList().run()
    case 'numbered':
      return chain.toggleOrderedList().run()
    case 'quote':
      return chain.toggleBlockquote().run()
    case 'callout-note':
      return chain
        .insertContent({
          type: 'callout',
          attrs: { ...getDefaultCalloutAttrs(), calloutKind: 'note', title: 'Note' },
          content: [{ type: 'paragraph' }],
        })
        .run()
    case 'callout-tip':
      return chain
        .insertContent({
          type: 'callout',
          attrs: { ...getDefaultCalloutAttrs(), calloutKind: 'tip', title: 'Tip' },
          content: [{ type: 'paragraph' }],
        })
        .run()
    case 'callout-warning':
      return chain
        .insertContent({
          type: 'callout',
          attrs: { ...getDefaultCalloutAttrs(), calloutKind: 'warning', title: 'Warning' },
          content: [{ type: 'paragraph' }],
        })
        .run()
    case 'callout-caution':
      return chain
        .insertContent({
          type: 'callout',
          attrs: { ...getDefaultCalloutAttrs(), calloutKind: 'caution', title: 'Caution' },
          content: [{ type: 'paragraph' }],
        })
        .run()
    case 'callout-important':
      return chain
        .insertContent({
          type: 'callout',
          attrs: { ...getDefaultCalloutAttrs(), calloutKind: 'important', title: 'Important' },
          content: [{ type: 'paragraph' }],
        })
        .run()
    case 'code-block':
      return chain.toggleCodeBlock().run()
    case 'table':
      return chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    case 'divider':
      return chain.setHorizontalRule().run()
    case 'today':
      return chain.insertContent(formatToday()).run()
    case 'ai': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage = editor.storage as any
      const currentNoteId = storage.aiPromptBlock?.currentNoteId ?? ''
      const currentNoteTitle = storage.aiPromptBlock?.currentNoteTitle ?? ''
      return chain
        .insertContent({
          type: 'aiPromptBlock',
          attrs: { currentNoteId, currentNoteTitle },
        })
        .run()
    }
    default:
      return false
  }
}
