import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { textblockTypeInputRule, wrappingInputRule } from '@tiptap/core'
import { createLowlight, all } from 'lowlight'
import { CalloutNode } from '../extensions/CalloutNode'
import { SlashCommand } from '../extensions/SlashCommand'
import { MarkdownPaste } from '../extensions/MarkdownPaste'

const lowlight = createLowlight(all)

const AuraTaskList = TaskList.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*(\[\s\])$/,
        type: this.type,
        getAttributes: () => ({ checked: false }),
      }),
    ]
  },
})

const AuraCodeBlockLowlight = CodeBlockLowlight.extend({
  addInputRules() {
    const parentRules = this.parent?.() ?? []
    return [
      ...parentRules,
      textblockTypeInputRule({
        find: /^```([a-z]+)?$/,
        type: this.type,
        getAttributes: (match) => ({ language: match?.[1] || null }),
      }),
    ]
  },
})

export function createAuraEditorExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: false,
      codeBlock: false,
    }),
    Placeholder.configure({
      includeChildren: true,
      placeholder: ({ editor, node, pos }) => {
        if (node.type.name === 'taskItem') {
          return 'To-do'
        }

        if (node.type.name === 'paragraph') {
          const $pos = editor.state.doc.resolve(pos)
          const inTaskItem = $pos.depth > 0 && $pos.node($pos.depth - 1)?.type?.name === 'taskItem'
          if (inTaskItem) {
            return 'To-do'
          }
        }

        return "Type '/' for commands, or just start writing..."
      },
    }),
    Link.configure({
      autolink: true,
      defaultProtocol: 'https',
      openOnClick: false,
    }),
    AuraTaskList,
    TaskItem.configure({
      nested: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    AuraCodeBlockLowlight.configure({
      lowlight,
    }),
    CalloutNode,
    SlashCommand,
    MarkdownPaste,
  ]
}
