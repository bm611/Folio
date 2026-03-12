const CURSOR_TOKEN = '__CURSOR__'
const SELECTION_TOKEN = '__SELECTION__'

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date())
}

function createSnippetResult(template, selectedText = '') {
  const textWithSelection = template.replaceAll(SELECTION_TOKEN, selectedText)
  const cursorIndex = textWithSelection.indexOf(CURSOR_TOKEN)
  const text = textWithSelection.replace(CURSOR_TOKEN, '')

  return {
    text,
    cursorOffset: cursorIndex === -1 ? text.length : cursorIndex,
  }
}

export const EDITOR_COMMANDS = [
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
    id: 'callout',
    title: 'Callout',
    trigger: 'callout',
    keywords: ['info', 'note', 'admonition', 'tip', 'warning'],
    template: '> [!note] __CURSOR__\n> __SELECTION__',
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
]

export function getEditorCommands(query = '') {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return EDITOR_COMMANDS
  }

  return EDITOR_COMMANDS.filter((command) => {
    const haystack = [command.trigger, command.title, ...(command.keywords || [])].join(' ').toLowerCase()
    return haystack.includes(normalized)
  })
}

export function getEditorCommandById(commandId) {
  return EDITOR_COMMANDS.find((command) => command.id === commandId) || null
}

export function buildCommandInsertion(command, selectedText = '') {
  if (!command) {
    return null
  }

  if (typeof command.build === 'function') {
    return command.build(selectedText)
  }

  return createSnippetResult(command.template, selectedText)
}
