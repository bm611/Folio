import MarkdownIt from 'markdown-it'
import markdownItTaskLists from 'markdown-it-task-lists'

interface DocNode {
  type: string
  attrs?: Record<string, unknown>
  marks?: DocMark[]
  content?: DocNode[]
  text?: string
}

interface DocMark {
  type: string
  attrs?: Record<string, unknown>
}

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
})

markdown.use(markdownItTaskLists, { enabled: true })

function normalizeTaskListHtml(html: string): string {
  return html
    .replace(/<li class="task-list-item(?: enabled)?"><input class="task-list-item-checkbox" checked="checked" disabled="disabled" type="checkbox">/g, '<li data-type="taskItem" data-checked="true">')
    .replace(/<li class="task-list-item(?: enabled)?"><input class="task-list-item-checkbox" disabled="disabled" type="checkbox">/g, '<li data-type="taskItem" data-checked="false">')
    .replaceAll('<ul class="contains-task-list">', '<ul data-type="taskList">')
    .replace(/<li class="task-list-item(?: enabled)?">/g, '<li data-type="taskItem" data-checked="false">')
}

export function markdownToHtml(content: string = ''): string {
  if (!content.trim()) {
    return '<p></p>'
  }

  return normalizeTaskListHtml(markdown.render(content))
}

function escapeMarkdownText(text: string = ''): string {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll('*', '\\*')
    .replaceAll('_', '\\_')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('`', '\\`')
}

function wrapCode(text: string = ''): string {
  const fence = text.includes('`') ? '``' : '`'
  return `${fence}${text}${fence}`
}

function renderTextNode(node: DocNode): string {
  const text = node?.text || ''
  const marks = node?.marks || []

  if (!marks.length) {
    return escapeMarkdownText(text)
  }

  const codeMark = marks.find((mark) => mark.type === 'code')
  if (codeMark) {
    return wrapCode(text)
  }

  let value = escapeMarkdownText(text)

  marks.forEach((mark) => {
    if (mark.type === 'link') {
      value = `[${value}](${(mark.attrs?.href as string) || ''})`
      return
    }

    if (mark.type === 'bold') {
      value = `**${value}**`
      return
    }

    if (mark.type === 'italic') {
      value = `*${value}*`
      return
    }

    if (mark.type === 'strike') {
      value = `~~${value}~~`
    }
  })

  return value
}

function renderInline(nodes: DocNode[] = []): string {
  return nodes
    .map((node) => {
      if (!node) return ''
      if (node.type === 'text') return renderTextNode(node)
      if (node.type === 'hardBreak') return '  \n'
      if (node.type === 'paragraph') return renderInline(node.content || [])
      return renderInline(node.content || [])
    })
    .join('')
}

function indentLines(text: string = '', spaces: number = 2): string {
  const indent = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line ? `${indent}${line}` : indent.trimEnd()))
    .join('\n')
}

function prefixBlock(text: string = '', prefix: string = '> '): string {
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n')
}

function renderListItemContent(node: DocNode, depth: number, listType: 'bullet' | 'ordered', index: number = 1): string {
  const children = node.content || []
  const firstChild = children[0]
  const rest = children.slice(1)

  let lead = ''
  if (firstChild?.type === 'paragraph') {
    lead = renderInline(firstChild.content || [])
  } else if (firstChild) {
    lead = renderNode(firstChild, depth + 1)
  }

  const prefix = listType === 'ordered' ? `${index}. ` : '- '
  const base = `${prefix}${lead}`.trimEnd()

  if (!rest.length) {
    return base
  }

  const nested = rest
    .map((child) => renderNode(child, depth + 1))
    .filter(Boolean)
    .join('\n')

  return `${base}\n${indentLines(nested)}`
}

function renderTaskItemContent(node: DocNode, depth: number): string {
  const children = node.content || []
  const firstChild = children[0]
  const rest = children.slice(1)
  const prefix = `- [${node.attrs?.checked ? 'x' : ' '}] `
  const lead = firstChild?.type === 'paragraph' ? renderInline(firstChild.content || []) : renderNode(firstChild!, depth + 1)
  const base = `${prefix}${lead || ''}`.trimEnd()

  if (!rest.length) {
    return base
  }

  const nested = rest
    .map((child) => renderNode(child, depth + 1))
    .filter(Boolean)
    .join('\n')

  return `${base}\n${indentLines(nested)}`
}

function renderTableCell(node: DocNode): string {
  return (node.content || [])
    .map((child) => {
      if (child.type === 'paragraph') {
        return renderInline(child.content || [])
      }

      return renderInline(child.content || [])
    })
    .join(' ')
    .replace(/\n+/g, ' ')
    .trim()
}

function renderTable(node: DocNode): string {
  const rows = node.content || []
  if (!rows.length) return ''

  const headerCells = rows[0]?.content || []
  const header = headerCells.map(renderTableCell)
  const divider = header.map(() => '---')
  const bodyRows = rows.slice(1).map((row) => (row.content || []).map(renderTableCell))

  return [
    `| ${header.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
    ...bodyRows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

function renderNode(node: DocNode, depth: number = 0): string {
  if (!node) return ''

  switch (node.type) {
    case 'paragraph':
      return renderInline(node.content || [])
    case 'heading':
      return `${'#'.repeat((node.attrs?.level as number) || 1)} ${renderInline(node.content || [])}`.trim()
    case 'bulletList':
      return (node.content || []).map((item) => renderListItemContent(item, depth, 'bullet')).join('\n')
    case 'orderedList': {
      const start = Number(node.attrs?.start || 1)
      return (node.content || [])
        .map((item, index) => renderListItemContent(item, depth, 'ordered', start + index))
        .join('\n')
    }
    case 'taskList':
      return (node.content || []).map((item) => renderTaskItemContent(item, depth)).join('\n')
    case 'blockquote': {
      const rendered = renderNodes(node.content || []).trim()
      return rendered ? prefixBlock(rendered, '> ') : '>'
    }
    case 'codeBlock': {
      const language = (node.attrs?.language as string) || ''
      const code = (node.content || []).map((child) => child.text || '').join('')
      return `\`\`\`${language}\n${code}\n\`\`\``
    }
    case 'horizontalRule':
      return '---'
    case 'table':
      return renderTable(node)
    default:
      return renderNodes(node.content || [])
  }
}

function renderNodes(nodes: DocNode[] = []): string {
  return nodes
    .map((node) => renderNode(node))
    .filter((value) => value !== '')
    .join('\n\n')
}

export function docToMarkdown(doc: DocNode | Record<string, unknown> | null): string {
  if (!doc || !('content' in doc) || !Array.isArray(doc.content) || !doc.content.length) {
    return ''
  }

  return renderNodes(doc.content as DocNode[]).replace(/\n{3,}/g, '\n\n').trim()
}
