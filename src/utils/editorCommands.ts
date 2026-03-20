const CURSOR_TOKEN = '__CURSOR__'
const SELECTION_TOKEN = '__SELECTION__'

export interface SnippetResult {
  text: string
  cursorOffset: number
}

export interface EditorCommand {
  id: string
  title: string
  trigger: string
  keywords: string[]
  template?: string
  build?: (selectedText?: string) => SnippetResult
}

function formatToday(): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date())
}

function createSnippetResult(template: string, selectedText: string = ''): SnippetResult {
  const textWithSelection = template.replaceAll(SELECTION_TOKEN, selectedText)
  const cursorIndex = textWithSelection.indexOf(CURSOR_TOKEN)
  const text = textWithSelection.replace(CURSOR_TOKEN, '')

  return {
    text,
    cursorOffset: cursorIndex === -1 ? text.length : cursorIndex,
  }
}

export const EDITOR_COMMANDS: EditorCommand[] = [
  {
    id: 'heading-1',
    title: 'Heading 1',
    trigger: 'h1',
    keywords: ['title', 'header', 'heading'],
    template: '# __SELECTION____CURSOR__',
  },
  {
    id: 'heading-2',
    title: 'Heading 2',
    trigger: 'h2',
    keywords: ['section', 'heading'],
    template: '## __SELECTION____CURSOR__',
  },
  {
    id: 'heading-3',
    title: 'Heading 3',
    trigger: 'h3',
    keywords: ['subheading', 'heading'],
    template: '### __SELECTION____CURSOR__',
  },
  {
    id: 'todo',
    title: 'To-do item',
    trigger: 'todo',
    keywords: ['task', 'checkbox', 'checklist'],
    template: '- [ ] __SELECTION____CURSOR__',
  },
  {
    id: 'bullets',
    title: 'Bullet list',
    trigger: 'bullets',
    keywords: ['list', 'unordered'],
    template: '- __SELECTION____CURSOR__',
  },
  {
    id: 'numbered',
    title: 'Numbered list',
    trigger: 'numbered',
    keywords: ['list', 'ordered'],
    template: '1. __SELECTION____CURSOR__',
  },
  {
    id: 'quote',
    title: 'Quote',
    trigger: 'quote',
    keywords: ['blockquote', 'citation'],
    template: '> __SELECTION____CURSOR__',
  },
  {
    id: 'callout-note',
    title: 'Note',
    trigger: 'note',
    keywords: ['info', 'callout', 'admonition'],
    template: '> [!note] __CURSOR__\n> __SELECTION__',
  },
  {
    id: 'callout-tip',
    title: 'Tip',
    trigger: 'tip',
    keywords: ['advice', 'callout', 'suggestion', 'idea'],
    template: '> [!tip] __CURSOR__\n> __SELECTION__',
  },
  {
    id: 'callout-warning',
    title: 'Warning',
    trigger: 'warning',
    keywords: ['alert', 'callout', 'caution'],
    template: '> [!warning] __CURSOR__\n> __SELECTION__',
  },
  {
    id: 'callout-caution',
    title: 'Caution',
    trigger: 'caution',
    keywords: ['alert', 'callout', 'warning', 'danger'],
    template: '> [!caution] __CURSOR__\n> __SELECTION__',
  },
  {
    id: 'callout-important',
    title: 'Important',
    trigger: 'important',
    keywords: ['highlight', 'callout', 'attention'],
    template: '> [!important] __CURSOR__\n> __SELECTION__',
  },
  {
    id: 'code-block',
    title: 'Code block',
    trigger: 'code',
    keywords: ['snippet', 'fence', 'programming'],
    template: '```js\n__SELECTION____CURSOR__\n```',
  },
  {
    id: 'table',
    title: 'Table',
    trigger: 'table',
    keywords: ['columns', 'grid'],
    template: '| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| __SELECTION____CURSOR__ |  |  |',
  },
  {
    id: 'divider',
    title: 'Divider',
    trigger: 'divider',
    keywords: ['rule', 'separator', 'hr'],
    template: '---\n__CURSOR__',
  },
  {
    id: 'today',
    title: 'Today',
    trigger: 'today',
    keywords: ['date', 'now'],
    build() {
      return createSnippetResult(`${formatToday()}${CURSOR_TOKEN}`)
    },
  },
  {
    id: 'ai',
    title: 'Ask AI',
    trigger: 'ai',
    keywords: ['ai', 'ask', 'chat', 'question', 'gpt', 'generate', 'summarize'],
  },
]

export function getEditorCommands(query: string = ''): EditorCommand[] {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return EDITOR_COMMANDS
  }

  return EDITOR_COMMANDS.filter((command) => {
    const haystack = [command.trigger, command.title, ...(command.keywords || [])].join(' ').toLowerCase()
    return haystack.includes(normalized)
  })
}

export function getEditorCommandById(commandId: string): EditorCommand | null {
  return EDITOR_COMMANDS.find((command) => command.id === commandId) || null
}

export function buildCommandInsertion(command: EditorCommand | null, selectedText: string = ''): SnippetResult | null {
  if (!command) {
    return null
  }

  if (typeof command.build === 'function') {
    return command.build(selectedText)
  }

  return createSnippetResult(command.template!, selectedText)
}
