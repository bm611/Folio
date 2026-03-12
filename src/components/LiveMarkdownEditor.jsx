import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildCommandInsertion, getEditorCommandById, getEditorCommands } from '../utils/editorCommands'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import sql from 'highlight.js/lib/languages/sql'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import yaml from 'highlight.js/lib/languages/yaml'
import ruby from 'highlight.js/lib/languages/ruby'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import php from 'highlight.js/lib/languages/php'
import {
  IconPencil, IconFlame, IconInfoCircle, IconAlertTriangle, IconAlertOctagon,
  IconBug, IconList, IconMessageCircle, IconCircleCheck, IconHelpCircle,
  IconCircleX, IconFileText, IconAlertCircle, IconClipboardList,
  IconChevronDown, IconSquare, IconSquareCheck, IconX,
} from '@tabler/icons-react'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('jsx', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('rb', ruby)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('kt', kotlin)
hljs.registerLanguage('php', php)

function highlightCode(code, language) {
  if (!code) return ''
  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value
    }
    return hljs.highlightAuto(code).value
  } catch {
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

let blockIdCounter = 0

function makeBlock(raw = '') {
  blockIdCounter += 1
  return { id: `block-${blockIdCounter}`, raw }
}

function contentToBlocks(content = '') {
  const lines = typeof content === 'string' ? content.split('\n') : ['']
  const blocks = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (/^```/.test(line)) {
      const fencedLines = [line]

      while (index + 1 < lines.length) {
        index += 1
        fencedLines.push(lines[index])

        if (/^```/.test(lines[index])) {
          break
        }
      }

      blocks.push(makeBlock(fencedLines.join('\n')))
      continue
    }

    // Group Obsidian callouts: > [!type] on first line, then consecutive > lines
    if (/^> \[!/.test(line)) {
      const calloutLines = [line]

      while (index + 1 < lines.length && /^> /.test(lines[index + 1])) {
        index += 1
        calloutLines.push(lines[index])
      }

      blocks.push(makeBlock(calloutLines.join('\n')))
      continue
    }

    // Group Markdown tables: consecutive lines that start with |
    if (/^\|/.test(line)) {
      const tableLines = [line]

      while (index + 1 < lines.length && /^\|/.test(lines[index + 1])) {
        index += 1
        tableLines.push(lines[index])
      }

      blocks.push(makeBlock(tableLines.join('\n')))
      continue
    }

    blocks.push(makeBlock(line))
  }

  return blocks.length ? blocks : [makeBlock('')]
}

function blocksToContent(blocks) {
  return blocks.map((block) => block.raw).join('\n')
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function parseInline(text) {
  return escapeHtml(text)
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

function getBlockType(line) {
  if (/^# /.test(line)) return { type: 'h1', content: line.slice(2) }
  if (/^## /.test(line)) return { type: 'h2', content: line.slice(3) }
  if (/^### /.test(line)) return { type: 'h3', content: line.slice(4) }
  // Obsidian callout: > [!type][-+]? Optional title\n> body lines...
  const calloutMatch = line.match(/^> \[!([A-Za-z-]+)\]([+-])?\s*(.*)/)
  if (calloutMatch) {
    const calloutType = calloutMatch[1].toLowerCase()
    const foldChar = calloutMatch[2] || ''        // '-' = collapsed, '+' = expanded, '' = not foldable
    const titleRest = calloutMatch[3] || ''
    const allLines = line.split('\n')
    const bodyLines = allLines.slice(1).map(l => l.replace(/^> ?/, ''))
    const body = bodyLines.join('\n').trim()
    return {
      type: 'callout',
      content: body,
      label: calloutType,
      calloutTitle: titleRest.trim() || calloutType.charAt(0).toUpperCase() + calloutType.slice(1),
      foldable: foldChar === '-' || foldChar === '+',
      defaultCollapsed: foldChar === '-',
    }
  }
  if (/^> /.test(line)) return { type: 'blockquote', content: line.slice(2) }
  if (/^- \[x\] /i.test(line)) return { type: 'checkedTask', content: line.slice(6) }
  if (/^- \[ \] /.test(line)) return { type: 'task', content: line.slice(6) }
  if (/^[-*] /.test(line)) return { type: 'li', content: line.slice(2) }
  if (/^\d+\. /.test(line)) return { type: 'oli', content: line.replace(/^\d+\. /, '') }
  if (/^---$/.test(line.trim())) return { type: 'hr', content: '' }
  if (/^\|/.test(line)) {
    const parsed = parseMarkdownTable(line)
    if (parsed) {
      return { type: 'table', headerRow: parsed.headerRow, dataRows: parsed.dataRows }
    }
  }
  if (/^```/.test(line)) {
    const lines = line.split('\n')
    const language = lines[0].slice(3).trim()
    const hasClosingFence = lines.length > 1 && /^```/.test(lines.at(-1) || '')
    const content = hasClosingFence ? lines.slice(1, -1).join('\n') : lines.slice(1).join('\n')
    return { type: 'codeblock', content, language, isOpen: !hasClosingFence }
  }
  return { type: 'p', content: line }
}

function isFencedCodeBlock(raw = '') {
  return /^```/.test(raw)
}

// ── Table helpers ──────────────────────────────────────────────────────────

function isMarkdownTableRaw(raw = '') {
  const lines = raw.trim().split('\n')
  return lines.length >= 2 && lines.every((l) => /^\|/.test(l.trim()))
}

function parseTableRow(line) {
  // Split on | but ignore leading/trailing pipes
  return line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())
}

function parseMarkdownTable(raw) {
  const lines = raw.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return null

  const headerRow = parseTableRow(lines[0])
  // lines[1] is the separator row — skip it
  const dataRows = lines.slice(2).map(parseTableRow)

  // Normalise: all rows should have the same number of cols as header
  const cols = headerRow.length
  const normalize = (row) => {
    const r = [...row]
    while (r.length < cols) r.push('')
    return r.slice(0, cols)
  }

  return { headerRow, dataRows: dataRows.map(normalize) }
}

function serializeTable(headerRow, dataRows) {
  const colWidths = headerRow.map((h, ci) =>
    Math.max(h.length, 3, ...dataRows.map((r) => (r[ci] ?? '').length))
  )

  const pad = (str, w) => ` ${str.padEnd(w)} `
  const headerLine = `|${headerRow.map((h, i) => pad(h, colWidths[i])).join('|')}|`
  const sepLine = `|${colWidths.map((w) => ` ${'-'.repeat(w)} `).join('|')}|`
  const dataLines = dataRows.map(
    (row) => `|${row.map((c, i) => pad(c ?? '', colWidths[i])).join('|')}|`
  )
  return [headerLine, sepLine, ...dataLines].join('\n')
}

function resizeTextarea(element) {
  if (!element) {
    return
  }

  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

function getOrderedListNumber(blocks, index) {
  let number = 0

  for (let cursor = index; cursor >= 0; cursor -= 1) {
    if (/^\d+\. /.test(blocks[cursor].raw)) {
      number += 1
    } else if (cursor !== index && blocks[cursor].raw.trim()) {
      break
    }
  }

  return number || 1
}

const calloutIcons = {
  note: IconPencil,
  tip: IconFlame,
  info: IconInfoCircle,
  warning: IconAlertTriangle,
  danger: IconAlertOctagon,
  bug: IconBug,
  example: IconList,
  quote: IconMessageCircle,
  success: IconCircleCheck,
  question: IconHelpCircle,
  failure: IconCircleX,
  abstract: IconFileText,
  todo: IconClipboardList,
  important: IconAlertCircle,
  caution: IconAlertTriangle,
}

// ── TableEditor ────────────────────────────────────────────────────────────

function TableEditor({ initHeaders, initRows, onUpdate, onBlurBlock, onDelete }) {
  const [headers, setHeaders] = useState(() => initHeaders)
  const [rows, setRows] = useState(() => initRows)
  const cellRefs = useRef({})
  // When the component remounts (because raw changed after addCol/addRow),
  // this ref tells the mount effect which cell to focus instead of defaulting to h-0.
  const pendingFocusKey = useRef('h-0')

  // Auto-focus the pending cell on mount
  useEffect(() => {
    const key = pendingFocusKey.current
    window.requestAnimationFrame(() => {
      cellRefs.current[key]?.focus()
    })
  }, [])

  const focusCell = (key) => {
    window.requestAnimationFrame(() => cellRefs.current[key]?.focus())
  }

  const commit = (nextHeaders, nextRows) => {
    onUpdate(serializeTable(nextHeaders, nextRows))
  }

  const updateHeader = (ci, val) => {
    const next = [...headers]
    next[ci] = val
    setHeaders(next)
    commit(next, rows)
  }

  const updateCell = (ri, ci, val) => {
    const next = rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? val : c)) : r))
    setRows(next)
    commit(headers, next)
  }

  const addRow = () => {
    const newRow = headers.map(() => '')
    const next = [...rows, newRow]
    const newRi = next.length - 1
    pendingFocusKey.current = `r-${newRi}-0`
    setRows(next)
    commit(headers, next)
    focusCell(`r-${newRi}-0`)
  }

  const deleteRow = (ri) => {
    if (rows.length <= 1) return
    const next = rows.filter((_, i) => i !== ri)
    const focusRi = Math.min(ri, next.length - 1)
    pendingFocusKey.current = `r-${focusRi}-0`
    setRows(next)
    commit(headers, next)
    focusCell(`r-${focusRi}-0`)
  }

  const addCol = () => {
    const nextHeaders = [...headers, '']
    const nextRows = rows.map((r) => [...r, ''])
    const newCi = nextHeaders.length - 1
    pendingFocusKey.current = `h-${newCi}`
    setHeaders(nextHeaders)
    setRows(nextRows)
    commit(nextHeaders, nextRows)
    focusCell(`h-${newCi}`)
  }

  const deleteCol = (ci) => {
    if (headers.length <= 1) return
    const nextHeaders = headers.filter((_, i) => i !== ci)
    const nextRows = rows.map((r) => r.filter((_, i) => i !== ci))
    const focusCi = Math.min(ci, nextHeaders.length - 1)
    pendingFocusKey.current = `h-${focusCi}`
    setHeaders(nextHeaders)
    setRows(nextRows)
    commit(nextHeaders, nextRows)
    focusCell(`h-${focusCi}`)
  }

  const handleKeyDown = (e, currentKey, ri, ci, isHeader) => {
    const colCount = headers.length

    if (e.key === 'Escape') {
      e.preventDefault()
      onBlurBlock()
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const rowCount = rows.length

      if (e.shiftKey) {
        // Move to previous cell
        if (isHeader && ci === 0) return
        if (isHeader) {
          focusCell(`h-${ci - 1}`)
        } else if (ci === 0 && ri === 0) {
          focusCell(`h-${colCount - 1}`)
        } else if (ci === 0) {
          focusCell(`r-${ri - 1}-${colCount - 1}`)
        } else {
          focusCell(`r-${ri}-${ci - 1}`)
        }
      } else {
        // Move to next cell, or add row if at the very end
        if (isHeader && ci < colCount - 1) {
          focusCell(`h-${ci + 1}`)
        } else if (isHeader && ci === colCount - 1 && rowCount > 0) {
          focusCell(`r-0-0`)
        } else if (!isHeader && ci < colCount - 1) {
          focusCell(`r-${ri}-${ci + 1}`)
        } else if (!isHeader && ri < rowCount - 1) {
          focusCell(`r-${ri + 1}-0`)
        } else if (!isHeader) {
          // Last cell of last row → add a new row
          addRow()
        }
      }
    }
  }

  return (
    <div className="md-table-editor">
      <div className="md-table-scroll">
        <table className="md-table">
          <thead>
            <tr>
              {headers.map((h, ci) => (
                <th key={ci} className="md-table-th">
                  <div className="md-table-cell-wrap">
                    <input
                      ref={(el) => { cellRefs.current[`h-${ci}`] = el }}
                      className="md-table-input md-table-input--header"
                      value={h}
                      placeholder="Header"
                      onChange={(e) => updateHeader(ci, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, `h-${ci}`, -1, ci, true)}
                    />
                    {headers.length > 1 ? (
                      <button
                        type="button"
                        className="md-table-del-col"
                        title="Delete column"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => deleteCol(ci)}
                        aria-label="Delete column"
                      >
                        <IconX size={10} stroke={2} />
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
              {/* Add column button */}
              <th className="md-table-th md-table-th--add">
                <button
                  type="button"
                  className="md-table-add-col"
                  title="Add column"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addCol}
                  aria-label="Add column"
                >
                  +
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="md-table-row">
                {row.map((cell, ci) => (
                  <td key={ci} className="md-table-td">
                    <input
                      ref={(el) => { cellRefs.current[`r-${ri}-${ci}`] = el }}
                      className="md-table-input"
                      value={cell}
                      placeholder=""
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, `r-${ri}-${ci}`, ri, ci, false)}
                    />
                  </td>
                ))}
                {/* Delete row button — extra cell aligned to add-col column */}
                <td className="md-table-td md-table-td--ctrl">
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      className="md-table-del-row"
                      title="Delete row"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => deleteRow(ri)}
                      aria-label="Delete row"
                    >
                      <IconX size={10} stroke={2} />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="md-table-add-row"
        onMouseDown={(e) => e.preventDefault()}
        onClick={addRow}
      >
        + Add row
      </button>
      <button
        type="button"
        className="md-table-delete-table"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onDelete}
        title="Delete table"
      >
        Delete table
      </button>
    </div>
  )
}

function Block({
  block,
  index,
  blocks,
  isFocused,
  onUpdate,
  onFocus,
  onKeyDown,
  onPaste,
  onSelectionChange,
  registerInput,
  onBlurBlock,
  onDeleteBlock,
}) {
  const { raw } = block
  const { type, content, label, language, calloutTitle, foldable, defaultCollapsed, headerRow, dataRows } = getBlockType(raw)
  const html = parseInline(content ?? '')
  const textareaRef = useRef(null)
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)

  useEffect(() => {
    if (isFocused) {
      resizeTextarea(textareaRef.current)
    }
  }, [isFocused, raw])

  const placeholders = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    p: "Type '/' for commands, or just start writing...",
  }

  const placeholder = placeholders[type] || ''
  const isEmpty = raw.trim() === ''

  if (!isFocused) {
    if (isEmpty) {
      return (
        <button
          type="button"
          className="notion-block-empty"
          onClick={() => onFocus(index)}
          aria-label="Start typing"
        >
          {placeholder && blocks.length === 1 ? (
            <span className="notion-block-placeholder">{placeholder}</span>
          ) : null}
        </button>
      )
    }

    return (
      <div
        className="notion-block-rendered"
        onClick={() => onFocus(index)}
        data-index={index}
        style={{ cursor: 'text' }}
      >
        {type === 'h1' ? <h1 dangerouslySetInnerHTML={{ __html: html }} /> : null}
        {type === 'h2' ? <h2 dangerouslySetInnerHTML={{ __html: html }} /> : null}
        {type === 'h3' ? <h3 dangerouslySetInnerHTML={{ __html: html }} /> : null}
        {type === 'blockquote' ? <blockquote dangerouslySetInnerHTML={{ __html: html }} /> : null}
        {type === 'callout' ? (() => {
          const IconComponent = calloutIcons[label] || calloutIcons.note
          return (
            <div className={`obsidian-callout obsidian-callout-${label}`}>
              <div
                className="obsidian-callout-header"
                onClick={foldable ? (e) => {
                  e.stopPropagation()
                  setCollapsed(prev => !prev)
                } : undefined}
              >
                <span className="obsidian-callout-icon"><IconComponent size={16} /></span>
                <span className="obsidian-callout-title">{calloutTitle}</span>
                {foldable ? (
                  <span className={`obsidian-callout-fold ${collapsed ? 'is-collapsed' : ''}`}>
                    <IconChevronDown size={14} stroke={1.5} />
                  </span>
                ) : null}
              </div>
              {(!foldable || !collapsed) && content ? (
                <div className="obsidian-callout-body">
                  {content.split('\n').map((line, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
                  ))}
                </div>
              ) : null}
            </div>
          )
        })() : null}
        {type === 'checkedTask' ? (
          <div className="notion-task notion-task-checked">
            <span
              className="notion-task-icon"
              onClick={(e) => {
                e.stopPropagation()
                onUpdate(index, raw.replace(/^- \[[xX]\]\s*/, '- [ ] '))
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <IconSquareCheck size={16} stroke={1.5} />
            </span>
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : null}
        {type === 'task' ? (
          <div className="notion-task">
            <span
              className="notion-task-icon"
              onClick={(e) => {
                e.stopPropagation()
                onUpdate(index, raw.replace(/^- \[\s\]\s*/, '- [x] '))
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <IconSquare size={16} stroke={1.5} />
            </span>
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : null}
        {type === 'li' ? (
          <div className="notion-list-item">
            <span className="notion-bullet">•</span>
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : null}
        {type === 'oli' ? (
          <div className="notion-list-item">
            <span className="notion-bullet notion-bullet-ordered">{getOrderedListNumber(blocks, index)}.</span>
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : null}
        {type === 'hr' ? <hr /> : null}
        {type === 'table' ? (
          <div className="md-table-readonly-wrap">
            <table className="md-table md-table--readonly">
              <thead>
                <tr>
                  {(headerRow || []).map((h, i) => (
                    <th key={i}><span dangerouslySetInnerHTML={{ __html: parseInline(h) }} /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(dataRows || []).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}><span dangerouslySetInnerHTML={{ __html: parseInline(cell) }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {type === 'codeblock' ? (
          <pre data-language={language || undefined}>
            <code
              className={language ? `hljs language-${language}` : 'hljs'}
              dangerouslySetInnerHTML={{ __html: highlightCode(content, language) }}
            />
          </pre>
        ) : null}
        {type === 'p' ? <p dangerouslySetInnerHTML={{ __html: html }} /> : null}
      </div>
    )
  }

  return (
    <div className="notion-block-edit" data-index={index} data-block-type={type}>
      {type === 'table' && headerRow ? (
        <TableEditor
          initHeaders={headerRow}
          initRows={dataRows || []}
          onUpdate={(nextRaw) => onUpdate(index, nextRaw)}
          onBlurBlock={onBlurBlock}
          onDelete={onDeleteBlock}
        />
      ) : (
        <textarea
          ref={(element) => {
            textareaRef.current = element
            registerInput(index, element)
            resizeTextarea(element)
          }}
          value={raw}
          placeholder={blocks.length === 1 && index === 0 ? placeholder : ''}
          onChange={(event) => onUpdate(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(event, index)}
          onPaste={(event) => onPaste(event, index)}
          onFocus={() => onFocus(index)}
          onSelect={(event) => onSelectionChange(index, event.currentTarget.selectionStart, event.currentTarget.selectionEnd)}
          onClick={(event) => onSelectionChange(index, event.currentTarget.selectionStart, event.currentTarget.selectionEnd)}
          onKeyUp={(event) => onSelectionChange(index, event.currentTarget.selectionStart, event.currentTarget.selectionEnd)}
          rows={1}
          onInput={(event) => resizeTextarea(event.currentTarget)}
        />
      )}
    </div>
  )
}

function getSlashQuery(text) {
  const trimmed = text.trimStart()

  if (!/^\/[a-z0-9-]*$/i.test(trimmed)) {
    return null
  }

  return trimmed.slice(1)
}

function applyInsertion(blocks, index, selection, insertion) {
  const currentBlock = blocks[index] ?? makeBlock('')
  const start = selection?.start ?? currentBlock.raw.length
  const end = selection?.end ?? start
  const nextRaw = `${currentBlock.raw.slice(0, start)}${insertion.text}${currentBlock.raw.slice(end)}`
  const replacementBlocks = /^```[\s\S]*\n```$/.test(nextRaw) || isMarkdownTableRaw(nextRaw)
    ? [makeBlock(nextRaw)]
    : nextRaw.split('\n').map((line) => makeBlock(line))
  const nextBlocks = [...blocks]
  nextBlocks.splice(index, 1, ...replacementBlocks)

  let remainingOffset = start + insertion.cursorOffset
  let focusIndex = index
  let caret = 0

  replacementBlocks.some((block, blockOffset) => {
    if (remainingOffset <= block.raw.length) {
      focusIndex = index + blockOffset
      caret = remainingOffset
      return true
    }

    remainingOffset -= block.raw.length + 1
    return false
  })

  if (remainingOffset > 0) {
    focusIndex = index + replacementBlocks.length - 1
    caret = replacementBlocks[replacementBlocks.length - 1].raw.length
  }

  return { nextBlocks, focusIndex, caret }
}

function applyPaste(blocks, index, selection, text) {
  const currentBlock = blocks[index] ?? makeBlock('')
  const start = selection?.start ?? currentBlock.raw.length
  const end = selection?.end ?? start
  const prefix = currentBlock.raw.slice(0, start)
  const suffix = currentBlock.raw.slice(end)

  // If the current block is a code block, just insert the text as raw string rather than splitting it
  if (/^```/.test(currentBlock.raw)) {
    const newRaw = `${prefix}${text}${suffix}`
    const nextBlocks = [...blocks]
    nextBlocks[index] = makeBlock(newRaw)
    return { nextBlocks, focusIndex: index, caret: prefix.length + text.length }
  }

  const insertedBlocks = contentToBlocks(text).map((block) => block.raw)

  if (insertedBlocks.length === 0) {
    return { nextBlocks: blocks, focusIndex: index, caret: start }
  }

  insertedBlocks[0] = `${prefix}${insertedBlocks[0]}`
  insertedBlocks[insertedBlocks.length - 1] = `${insertedBlocks.at(-1) ?? ''}${suffix}`

  const replacementBlocks = insertedBlocks.map((raw) => makeBlock(raw))
  const nextBlocks = [...blocks]
  nextBlocks.splice(index, 1, ...replacementBlocks)

  const focusIndex = index + replacementBlocks.length - 1
  const caret = Math.max((replacementBlocks.at(-1)?.raw.length ?? 0) - suffix.length, 0)

  return { nextBlocks, focusIndex, caret }
}

export default function LiveMarkdownEditor({
  value,
  onChange,
  onRegisterEditorApi,
}) {
  const [blocks, setBlocks] = useState(() => contentToBlocks(value))
  const [focusedIndex, setFocusedIndex] = useState(() => (value.trim() ? null : 0))
  const [slashActiveIndex, setSlashActiveIndex] = useState(0)
  const inputRefs = useRef({})
  const containerRef = useRef(null)
  const blocksRef = useRef(blocks)
  const pendingFocusRef = useRef(null)
  const selectionRef = useRef({ index: 0, start: 0, end: 0 })
  const onChangeRef = useRef(onChange)
  const onRegisterEditorApiRef = useRef(onRegisterEditorApi)
  const lastEmittedRef = useRef(value)

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      const next = contentToBlocks(value)
      blocksRef.current = next
      setBlocks(next)
      setFocusedIndex(null)
      lastEmittedRef.current = value
    }
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onRegisterEditorApiRef.current = onRegisterEditorApi
  }, [onRegisterEditorApi])

  useEffect(() => {
    const pendingFocus = pendingFocusRef.current

    if (!pendingFocus) {
      return
    }

    window.requestAnimationFrame(() => {
      const element = inputRefs.current[pendingFocus.index]

      if (element) {
        element.focus()

        if (pendingFocus.selectAll) {
          element.setSelectionRange(0, element.value.length)
          resizeTextarea(element)
          selectionRef.current = {
            index: pendingFocus.index,
            start: 0,
            end: element.value.length,
          }
        } else {
          element.setSelectionRange(pendingFocus.caret, pendingFocus.caret)
          resizeTextarea(element)
          selectionRef.current = {
            index: pendingFocus.index,
            start: pendingFocus.caret,
            end: pendingFocus.caret,
          }
        }
      }

      pendingFocusRef.current = null
    })
  }, [blocks, focusedIndex])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setFocusedIndex(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const commitBlocks = useCallback((nextBlocks, focus = null) => {
    blocksRef.current = nextBlocks
    setBlocks(nextBlocks)
    const content = blocksToContent(nextBlocks)
    lastEmittedRef.current = content
    onChangeRef.current(content)

    if (focus) {
      pendingFocusRef.current = focus
      setFocusedIndex(focus.index)
    }
  }, [])

  const focusBlock = useCallback((index, caret = 0) => {
    pendingFocusRef.current = { index, caret }
    setFocusedIndex(index)
  }, [])

  const handleUpdate = useCallback((index, nextRaw) => {
    const nextBlocks = [...blocksRef.current]
    const codeFenceMatch = nextRaw.match(/^```([\w#+.-]*)$/)

    if (codeFenceMatch) {
      const language = codeFenceMatch[1] || ''
      const openingFence = language ? `\`\`\`${language}` : '```'
      const fencedBlock = `${openingFence}\n\n\`\`\``
      nextBlocks[index] = makeBlock(fencedBlock)
      commitBlocks(nextBlocks, { index, caret: openingFence.length + 1 })
      return
    }

    nextBlocks[index] = { ...nextBlocks[index], raw: nextRaw }
    commitBlocks(nextBlocks)
    selectionRef.current = {
      index,
      start: nextRaw.length,
      end: nextRaw.length,
    }
  }, [commitBlocks])

  const handleDeleteBlock = useCallback((index) => {
    const nextBlocks = [...blocksRef.current]
    nextBlocks.splice(index, 1)
    // Always leave at least one empty block
    if (nextBlocks.length === 0) nextBlocks.push(makeBlock(''))
    const focusIdx = Math.max(0, index - 1)
    setFocusedIndex(null)
    commitBlocks(nextBlocks, { index: focusIdx, caret: nextBlocks[focusIdx]?.raw.length ?? 0 })
  }, [commitBlocks])

  const handleSelectionChange = useCallback((index, start, end) => {
    selectionRef.current = { index, start, end }
  }, [])

  const handlePaste = useCallback((event, index) => {
    const pastedText = event.clipboardData?.getData('text/plain') ?? ''

    if (!pastedText.includes('\n')) {
      return
    }

    event.preventDefault()

    const selection = selectionRef.current.index === index
      ? { start: selectionRef.current.start, end: selectionRef.current.end }
      : {
          start: blocksRef.current[index]?.raw.length ?? 0,
          end: blocksRef.current[index]?.raw.length ?? 0,
        }

    const { nextBlocks, focusIndex, caret } = applyPaste(blocksRef.current, index, selection, pastedText)
    commitBlocks(nextBlocks, { index: focusIndex, caret })
  }, [commitBlocks])

  const runEditorCommand = useCallback((commandId) => {
    const command = getEditorCommandById(commandId)
    const insertion = buildCommandInsertion(command)

    if (!insertion) {
      return
    }

    const baseBlocks = blocksRef.current.length ? blocksRef.current : [makeBlock('')]
    const index = focusedIndex ?? Math.max(baseBlocks.length - 1, 0)
    const selection = selectionRef.current.index === index
      ? { start: selectionRef.current.start, end: selectionRef.current.end }
      : { start: baseBlocks[index]?.raw.length ?? 0, end: baseBlocks[index]?.raw.length ?? 0 }
    const { nextBlocks, focusIndex, caret } = applyInsertion(baseBlocks, index, selection, insertion)

    commitBlocks(nextBlocks, { index: focusIndex, caret })
  }, [commitBlocks, focusedIndex])

  useEffect(() => {
    onRegisterEditorApiRef.current?.({
      focus() {
        const index = focusedIndex ?? Math.max(blocksRef.current.length - 1, 0)
        focusBlock(index, blocksRef.current[index]?.raw.length ?? 0)
      },
      runCommand(commandId) {
        runEditorCommand(commandId)
      },
    })

    return () => {
      onRegisterEditorApiRef.current?.(null)
    }
  }, [focusBlock, focusedIndex, runEditorCommand])

  const slashQuery = focusedIndex === null ? null : getSlashQuery(blocks[focusedIndex]?.raw || '')
  const slashCommands = useMemo(
    () => (slashQuery === null ? [] : getEditorCommands(slashQuery).slice(0, 8)),
    [slashQuery]
  )
  const activeSlashIndex = Math.min(slashActiveIndex, Math.max(slashCommands.length - 1, 0))

  const applySlashCommand = useCallback((command) => {
    if (focusedIndex === null) {
      return
    }

    const insertion = buildCommandInsertion(command)

    if (!insertion) {
      return
    }

    const block = blocksRef.current[focusedIndex]
    const slashStart = block.raw.indexOf('/')
    const { nextBlocks, focusIndex, caret } = applyInsertion(
      blocksRef.current,
      focusedIndex,
      {
        start: slashStart === -1 ? 0 : slashStart,
        end: block.raw.length,
      },
      insertion
    )

    commitBlocks(nextBlocks, { index: focusIndex, caret })
  }, [commitBlocks, focusedIndex])

  const handleKeyDown = useCallback((event, index) => {
    const currentBlock = blocksRef.current[index]

    // Ctrl/Cmd+A: if entire current block is already selected, merge all
    // blocks into one so the user can select all content natively
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      const target = event.currentTarget
      const isFullySelected =
        target.selectionStart === 0 && target.selectionEnd === target.value.length

      if (isFullySelected && blocksRef.current.length > 1) {
        event.preventDefault()
        const fullContent = blocksToContent(blocksRef.current)
        const merged = [makeBlock(fullContent)]
        commitBlocks(merged)
        pendingFocusRef.current = { index: 0, caret: 0, selectAll: true }
        setFocusedIndex(0)
        return
      }
    }

    if (slashCommands.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSlashActiveIndex((current) => Math.min(current + 1, slashCommands.length - 1))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSlashActiveIndex((current) => Math.max(current - 1, 0))
        return
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        applySlashCommand(slashCommands[activeSlashIndex])
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        const nextBlocks = [...blocksRef.current]
        const current = nextBlocks[index]
        nextBlocks[index] = { ...current, raw: current.raw.replace(/^\/[a-z0-9-]*$/i, '') }
        commitBlocks(nextBlocks)
        return
      }
    }

    // Inside a fenced code block: allow Enter to add newlines normally,
    // but Escape exits the block by creating a new empty block below.
    // Also, pressing Enter right after the closing backticks exits the block.
    if (isFencedCodeBlock(currentBlock.raw)) {
      if (event.key === 'Escape') {
        event.preventDefault()
        const nextBlocks = [...blocksRef.current]
        nextBlocks.splice(index + 1, 0, makeBlock(''))
        commitBlocks(nextBlocks, { index: index + 1, caret: 0 })
        return
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        const target = event.currentTarget
        const caretPos = target.selectionStart || 0
        
        // If cursor is at the very end and the text ends with closing backticks
        if (caretPos === currentBlock.raw.length && currentBlock.raw.endsWith('```') && currentBlock.raw.trim().length > 3) {
          event.preventDefault()
          const nextBlocks = [...blocksRef.current]
          nextBlocks.splice(index + 1, 0, makeBlock(''))
          commitBlocks(nextBlocks, { index: index + 1, caret: 0 })
          return
        }
        
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      const target = event.currentTarget
      const caretPos = target.selectionStart || 0
      
      const currentRaw = currentBlock.raw
      const textBeforeCaret = currentRaw.slice(0, caretPos)
      const textAfterCaret = currentRaw.slice(caretPos)
      
      const listMatch = textBeforeCaret.match(/^(\s*(?:[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+))(.*)$/)
      
      const nextBlocks = [...blocksRef.current]

      if (listMatch) {
        const prefix = listMatch[1]
        const content = listMatch[2]

        if (content.trim() === '' && textAfterCaret.trim() === '') {
          // Empty list item -> turn current block into empty paragraph
          nextBlocks[index] = makeBlock('')
          commitBlocks(nextBlocks, { index, caret: 0 })
          return
        } else {
          // Non-empty list item -> create new list item below
          let nextPrefix = prefix
          const numberMatch = prefix.match(/^(\s*)(\d+)(\.\s+)$/)
          if (numberMatch) {
            const nextNumber = parseInt(numberMatch[2], 10) + 1
            nextPrefix = `${numberMatch[1]}${nextNumber}${numberMatch[3]}`
          } else if (/\[[xX]\]/.test(prefix)) {
            nextPrefix = prefix.replace(/\[[xX]\]/, '[ ]')
          }
          
          nextBlocks[index] = makeBlock(textBeforeCaret)
          nextBlocks.splice(index + 1, 0, makeBlock(nextPrefix + textAfterCaret))
          commitBlocks(nextBlocks, { index: index + 1, caret: nextPrefix.length })
          return
        }
      }

      nextBlocks[index] = makeBlock(textBeforeCaret)
      nextBlocks.splice(index + 1, 0, makeBlock(textAfterCaret))
      commitBlocks(nextBlocks, { index: index + 1, caret: 0 })
      return
    }

    if (event.key === 'Backspace' && blocksRef.current[index].raw === '' && blocksRef.current.length > 1) {
      event.preventDefault()
      const nextBlocks = [...blocksRef.current]
      nextBlocks.splice(index, 1)
      const previousIndex = Math.max(0, index - 1)
      commitBlocks(nextBlocks, {
        index: previousIndex,
        caret: nextBlocks[previousIndex].raw.length,
      })
      return
    }

    if (event.key === 'ArrowUp' && index > 0) {
      const target = event.currentTarget
      if (target.selectionStart === 0 && target.selectionEnd === 0) {
        event.preventDefault()
        focusBlock(index - 1, blocksRef.current[index - 1].raw.length)
      }
      return
    }

    if (event.key === 'ArrowDown' && index < blocksRef.current.length - 1) {
      const target = event.currentTarget
      if (target.selectionStart === target.value.length && target.selectionEnd === target.value.length) {
        event.preventDefault()
        focusBlock(index + 1, 0)
      }
    }
  }, [activeSlashIndex, applySlashCommand, commitBlocks, focusBlock, slashCommands])

  const handleClickBottom = useCallback(() => {
    const lastIndex = blocksRef.current.length - 1
    const lastBlock = blocksRef.current[lastIndex]

    // If the last block is empty, just focus it
    if (lastBlock && lastBlock.raw === '') {
      focusBlock(lastIndex, 0)
      return
    }

    // Otherwise, create a new empty block at the end
    const nextBlocks = [...blocksRef.current, makeBlock('')]
    commitBlocks(nextBlocks, { index: nextBlocks.length - 1, caret: 0 })
  }, [commitBlocks, focusBlock])

  return (
    <div ref={containerRef} className="notion-editor">
      <div className="notion-blocks">
        {blocks.map((block, index) => (
          <div key={block.id} className="notion-block-row">
            <Block
              block={block}
              index={index}
              blocks={blocks}
              isFocused={focusedIndex === index}
              onUpdate={handleUpdate}
              onFocus={(nextIndex) => focusBlock(nextIndex, blocksRef.current[nextIndex]?.raw.length ?? 0)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onSelectionChange={handleSelectionChange}
              registerInput={(nextIndex, element) => {
                if (element) {
                  inputRefs.current[nextIndex] = element
                } else {
                  delete inputRefs.current[nextIndex]
                }
              }}
              onBlurBlock={() => setFocusedIndex(null)}
              onDeleteBlock={() => handleDeleteBlock(index)}
            />

            {focusedIndex === index && slashCommands.length > 0 ? (
              <div className="notion-slash-menu">
                {slashCommands.map((command, commandIndex) => (
                  <button
                    key={command.id}
                    type="button"
                    className={`notion-slash-item ${commandIndex === activeSlashIndex ? 'is-active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applySlashCommand(command)}
                  >
                    <span className="notion-slash-trigger">/{command.trigger}</span>
                    <span className="notion-slash-title">{command.title}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {/* Clickable zone below all blocks to create/focus a new block */}
      <button
        type="button"
        className="notion-block-empty"
        onClick={handleClickBottom}
        style={{ minHeight: '8rem' }}
        aria-label="Add new block"
      />
    </div>
  )
}
