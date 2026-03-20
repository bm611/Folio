import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CodeBlockView from '../extensions/CodeBlockView'
import { AuraTaskItem } from '../extensions/TaskItemNode'
import TaskList from '@tiptap/extension-task-list'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { textblockTypeInputRule, wrappingInputRule } from '@tiptap/core'
import type { Extensions } from '@tiptap/core'
import { createLowlight, all } from 'lowlight'
import { CalloutNode } from '../extensions/CalloutNode'
import { SlashCommand } from '../extensions/SlashCommand'
import { MarkdownPaste } from '../extensions/MarkdownPaste'
import { AiPromptBlock } from '../extensions/AiPromptBlock'
import TableView from '../extensions/TableView'

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

const AuraTable = Table.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableView)
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
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView)
  },
})

export function createAuraEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: false,
      codeBlock: false,
    }),

    Link.configure({
      autolink: true,
      defaultProtocol: 'https',
      openOnClick: false,
    }),
    AuraTaskList,
    AuraTaskItem.configure({
      nested: true,
    }),
    AuraTable.configure({
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
    AiPromptBlock,
  ]
}
