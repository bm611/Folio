import { getEditorCommandById } from '../../utils/editorCommands'

function formatToday() {
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

export function runAuraEditorCommand(editor, commandId, options = {}) {
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
        .run()
    case 'bullets':
      return chain.toggleBulletList().run()
    case 'numbered':
      return chain.toggleOrderedList().run()
    case 'quote':
      return chain.toggleBlockquote().run()
    case 'callout':
      return chain
        .insertContent({
          type: 'callout',
          attrs: getDefaultCalloutAttrs(),
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
    default:
      return false
  }
}
