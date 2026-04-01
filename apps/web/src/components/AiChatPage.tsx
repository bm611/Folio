import { useState, useRef, useEffect, useCallback, useMemo, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import {
  ArrowUp02Icon,
  Add01Icon,
  Cancel01Icon,
  StickyNoteIcon,
  SidebarLeftIcon,
  Copy01Icon,
  Tick01Icon,
  ArrowLeft01Icon,
  Search01Icon,
  SparklesIcon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

import Icon from './Icon'
import { streamAiChat } from '../utils/aiChat'
import type { NoteFile } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface AiChatPageProps {
  notes: NoteFile[]
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  onCloseChat?: () => void
}

const EMPTY_STATE_PROMPTS = [
  { id: 'summarize', label: 'Summarize the note I’m looking at', icon: StickyNoteIcon },
  { id: 'search', label: 'Find notes about a topic', icon: Search01Icon },
  { id: 'draft', label: 'Turn rough notes into a draft', icon: PencilEdit01Icon },
  { id: 'brainstorm', label: 'Brainstorm next steps from my notes', icon: SparklesIcon },
] as const

const MENTION_SELECTOR = '[data-mention-id]'
const MULTILINE_TAGS = new Set(['DIV', 'P', 'LI'])

function getNoteTitle(note: Pick<NoteFile, 'title' | 'name'>) {
  return note.title || note.name || 'Untitled'
}

function serializeComposerNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || '').replace(/\u00a0/g, ' ')
  }

  if (!(node instanceof HTMLElement)) {
    return ''
  }

  if (node.dataset.mentionId) {
    const label = node.dataset.mentionLabel?.trim() || node.textContent?.trim() || 'Untitled'
    return `@${label}`
  }

  if (node.tagName === 'BR') {
    return '\n'
  }

  const content = Array.from(node.childNodes).map(serializeComposerNode).join('')

  if (MULTILINE_TAGS.has(node.tagName) && node.nextSibling) {
    return `${content}\n`
  }

  return content
}

function serializeComposer(editor: HTMLElement) {
  return Array.from(editor.childNodes)
    .map(serializeComposerNode)
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
}

function getLastTextNode(node: Node | null): Text | null {
  if (!node) return null

  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text
  }

  const children = Array.from(node.childNodes)
  for (let i = children.length - 1; i >= 0; i -= 1) {
    const child = children[i]
    if (!child) continue

    const found = getLastTextNode(child)
    if (found) return found
  }

  return null
}

function getActiveMentionContext(editor: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return null
  }

  const anchorNode = selection.anchorNode
  if (!anchorNode || !editor.contains(anchorNode)) {
    return null
  }

  let textNode: Text | null = null
  let cursorOffset = 0

  if (anchorNode.nodeType === Node.TEXT_NODE) {
    textNode = anchorNode as Text
    cursorOffset = selection.anchorOffset
  } else if (anchorNode instanceof HTMLElement) {
    const nodeBeforeCursor = anchorNode.childNodes[selection.anchorOffset - 1] ?? null
    textNode = getLastTextNode(nodeBeforeCursor)
    cursorOffset = textNode?.textContent?.length ?? 0
  }

  if (!textNode) {
    return null
  }

  const textBeforeCursor = textNode.textContent?.slice(0, cursorOffset) ?? ''
  const match = textBeforeCursor.match(/(^|\s)@([^\s@]*)$/)
  if (!match) {
    return null
  }

  const startOffset = (match.index ?? 0) + (match[1]?.length ?? 0)
  const range = document.createRange()
  range.setStart(textNode, startOffset)
  range.setEnd(textNode, cursorOffset)

  return {
    query: match[2] ?? '',
    range,
  }
}

function focusComposerEnd(editor: HTMLElement) {
  editor.focus()

  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function createCollapsedRangeAtComposerEnd(editor: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  return range
}

function createMentionIconMarkup() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M7 4.75h10a2.25 2.25 0 0 1 2.25 2.25v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z"/>
      <path d="M8.5 9.25h7"/>
      <path d="M8.5 12h5.5"/>
      <path d="M8.5 14.75h4"/>
    </svg>
  `
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type CodeBlockProps = ComponentPropsWithoutRef<'code'> & {
  children?: ReactNode
}

function CodeBlock({ className, children, ...props }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const isBlock = !!match || (className || '').includes('hljs')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = String(children).replace(/\n$/, '')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isBlock) {
    return (
      <code className="rounded bg-[var(--bg-hover)] px-1.5 py-0.5 text-[0.9em] font-mono text-[var(--accent)]" {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-sm shadow-sm group">
      {language && (
        <div className="flex items-center justify-between bg-[var(--bg-hover)] px-4 py-1.5 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
          <span>{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
            title="Copy code"
          >
            <Icon icon={copied ? Tick01Icon : Copy01Icon} size={12} strokeWidth={2} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {!language && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleCopy}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
            title="Copy code"
          >
            <Icon icon={copied ? Tick01Icon : Copy01Icon} size={14} strokeWidth={2} />
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-4 m-0 bg-transparent border-none">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className={`group ${isUser ? 'flex justify-end' : 'w-full'} ${!isUser ? 'mb-8 mt-2' : ''}`}
    >
      <div
        className={`relative px-3.5 py-2 text-[14.5px] leading-relaxed [text-wrap:pretty] ${
          isUser
            ? 'max-w-[88%] rounded-2xl rounded-tr-sm text-white md:max-w-[82%]'
            : 'w-full px-0 py-0 text-[var(--text-primary)]'
        }`}
        style={
          isUser
            ? {
                background: 'var(--accent)',
                boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 25%, transparent)',
              }
            : undefined
        }
      >
        {isUser ? (
          <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </span>
        ) : (
          <div className="ai-markdown-content w-full overflow-hidden break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children }) => <>{children}</>,
                code: CodeBlock,
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                h1: ({ children }) => <h1 className="mb-3 mt-4 text-xl font-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-3 mt-4 text-lg font-bold">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-bold">{children}</h3>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-[var(--accent)] pl-3 text-[var(--text-muted)] italic my-2">{children}</blockquote>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{children}</a>,
              }}
            >
              {message.content}
            </ReactMarkdown>
            
            {!message.streaming && (
              <div className="absolute -bottom-8 left-0 opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-2">
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-[background,color,border-color,transform] duration-150 hover:border-[var(--border-default)] hover:text-[var(--text-primary)] active:scale-[0.96] shadow-sm"
                  title="Copy response"
                >
                  <Icon icon={copied ? Tick01Icon : Copy01Icon} size={11} strokeWidth={2.2} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        )}
        {message.streaming && (
          <span
            className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-px align-middle"
            style={{
              background: 'var(--text-muted)',
              animation: 'chat-cursor-blink 1s steps(1) infinite',
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AiChatPage({ notes, sidebarCollapsed, onToggleSidebar, onCloseChat }: AiChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [mentionedNotes, setMentionedNotes] = useState<NoteFile[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [highlightedMention, setHighlightedMention] = useState(0)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const activeMentionRangeRef = useRef<Range | null>(null)

  const hasMessages = messages.length > 0

  const closeMentionPicker = useCallback(() => {
    activeMentionRangeRef.current = null
    setMentionQuery(null)
    setHighlightedMention(0)
  }, [])

  const syncComposerState = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    setInputValue(serializeComposer(editor))

    const activeMention = getActiveMentionContext(editor)
    if (!activeMention) {
      closeMentionPicker()
      return
    }

    activeMentionRangeRef.current = activeMention.range.cloneRange()
    setMentionQuery(activeMention.query)
    setHighlightedMention(0)
  }, [closeMentionPicker])

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Auto-resize editor ──────────────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.style.height = 'auto'
    const nextHeight = Math.min(Math.max(editor.scrollHeight, 32), 160)
    editor.style.height = `${nextHeight}px`
    editor.style.overflowY = editor.scrollHeight > 160 ? 'auto' : 'hidden'
  }, [inputValue, mentionedNotes])

  useEffect(() => {
    if (mentionQuery === null) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!composerRef.current?.contains(target)) {
        closeMentionPicker()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [mentionQuery, closeMentionPicker])

  // ── Mention filtering ────────────────────────────────────────────────────
  const filteredMentions = useMemo(
    () =>
      mentionQuery !== null
        ? notes
            .filter((n) => !n.deletedAt)
            .filter((n) => {
              const title = getNoteTitle(n).toLowerCase()
              return title.includes(mentionQuery.toLowerCase())
            })
            .filter((n) => !mentionedNotes.find((m) => m.id === n.id))
            .sort((a, b) => {
              const aTime = Date.parse(a.updatedAt || '') || 0
              const bTime = Date.parse(b.updatedAt || '') || 0
              return bTime - aTime
            })
            .slice(0, 8)
        : [],
    [mentionQuery, notes, mentionedNotes]
  )

  // ── Handle input in contenteditable ─────────────────────────────────────
  const handleEditorInput = useCallback(() => {
    syncComposerState()
  }, [syncComposerState])

  // ── Remove mention ───────────────────────────────────────────────────────
  const removeMention = useCallback((id: string) => {
    const editor = editorRef.current
    if (!editor) return

    const mentionSpan = Array.from(editor.querySelectorAll<HTMLElement>(MENTION_SELECTOR)).find(
      (node) => node.dataset.mentionId === id
    )

    if (mentionSpan) {
      const nextSibling = mentionSpan.nextSibling
      if (nextSibling?.nodeType === Node.TEXT_NODE) {
        const nextText = nextSibling.textContent || ''
        if (nextText.startsWith(' ')) {
          nextSibling.textContent = nextText.slice(1)
        }
        if (!nextSibling.textContent) {
          nextSibling.parentNode?.removeChild(nextSibling)
        }
      }

      mentionSpan.remove()
      editor.normalize()
    }

    setMentionedNotes((prev) => prev.filter((n) => n.id !== id))
    syncComposerState()
    focusComposerEnd(editor)
  }, [syncComposerState])

  // ── Select a mentioned note ──────────────────────────────────────────────
  const selectMention = useCallback(
    (note: NoteFile) => {
      const editor = editorRef.current
      const range = activeMentionRangeRef.current
      if (!editor || !range) return

      range.deleteContents()

      const mentionSpan = document.createElement('span')
      mentionSpan.className = 'mx-1 inline-flex max-w-full select-none items-center gap-2 rounded-full border px-2.5 py-1 align-middle text-[13px] font-semibold leading-none text-[var(--accent)] shadow-[inset_0_1px_0_color-mix(in_srgb,white_28%,transparent)]'
      mentionSpan.dataset.mentionId = note.id
      mentionSpan.dataset.mentionLabel = getNoteTitle(note)
      mentionSpan.contentEditable = 'false'
      mentionSpan.style.background =
        'color-mix(in srgb, var(--accent) 13%, var(--bg-surface))'
      mentionSpan.style.borderColor =
        'color-mix(in srgb, var(--accent) 24%, var(--border-default))'
      mentionSpan.style.boxShadow =
        '0 8px 20px -18px color-mix(in srgb, var(--accent) 55%, transparent), inset 0 1px 0 color-mix(in srgb, white 24%, transparent)'

      const iconSpan = document.createElement('span')
      iconSpan.className = 'flex h-4 w-4 items-center justify-center rounded-full'
      iconSpan.style.background = 'color-mix(in srgb, var(--accent) 15%, transparent)'
      iconSpan.innerHTML = createMentionIconMarkup()

      const labelSpan = document.createElement('span')
      labelSpan.className = 'max-w-[14rem] truncate'
      labelSpan.textContent = getNoteTitle(note)

      const removeBtn = document.createElement('button')
      removeBtn.type = 'button'
      removeBtn.className = 'flex h-4 w-4 items-center justify-center rounded-full opacity-60 transition-[opacity,transform,background-color] duration-150 hover:opacity-100 active:scale-[0.92]'
      removeBtn.dataset.mentionRemove = 'true'
      removeBtn.ariaLabel = `Remove ${getNoteTitle(note)} mention`
      removeBtn.style.background = 'color-mix(in srgb, var(--accent) 0%, transparent)'
      removeBtn.onmouseenter = () => {
        removeBtn.style.background = 'color-mix(in srgb, var(--accent) 18%, transparent)'
      }
      removeBtn.onmouseleave = () => {
        removeBtn.style.background = 'color-mix(in srgb, var(--accent) 0%, transparent)'
      }
      removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      removeBtn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        removeMention(note.id)
      }

      mentionSpan.appendChild(iconSpan)
      mentionSpan.appendChild(labelSpan)
      mentionSpan.appendChild(removeBtn)

      const trailingSpace = document.createTextNode(' ')
      const fragment = document.createDocumentFragment()
      fragment.appendChild(mentionSpan)
      fragment.appendChild(trailingSpace)

      range.insertNode(fragment)

      const selection = window.getSelection()
      if (!selection) return

      const caretRange = document.createRange()
      caretRange.setStart(trailingSpace, trailingSpace.textContent?.length ?? 1)
      caretRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(caretRange)

      setMentionedNotes((prev) => [...prev, note])
      syncComposerState()
      editor.focus()
    },
    [removeMention, syncComposerState]
  )

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const editor = editorRef.current
      const question = (overrideText ?? (editor ? serializeComposer(editor) : inputValue)).trim()
      if (!question || isStreaming) return

      const selectedNotes = mentionedNotes

      setError(null)
      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question }
      const assistantId = crypto.randomUUID()
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setInputValue('')
      setMentionedNotes([])
      closeMentionPicker()
      setIsStreaming(true)
      if (editor) {
        editor.innerHTML = ''
      }

      const abort = new AbortController()
      abortRef.current = abort

      await streamAiChat(
        {
          question,
          noteContents: selectedNotes.map((n) => ({
            title: getNoteTitle(n),
            content: n.content,
          })),
        },
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m))
            )
          },
          onDone: () => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
            )
            setIsStreaming(false)
            abortRef.current = null
          },
          onError: (err) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
            )
            setError(err)
            setIsStreaming(false)
            abortRef.current = null
          },
        },
        abort.signal
      )
    },
    [closeMentionPicker, inputValue, isStreaming, mentionedNotes]
  )

  // ── New chat ──────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setMentionedNotes([])
    setInputValue('')
    closeMentionPicker()
    setError(null)
    setIsStreaming(false)
    if (editorRef.current) editorRef.current.innerHTML = ''
    setTimeout(() => editorRef.current?.focus(), 50)
  }, [closeMentionPicker])

  // ── Keyboard handler ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (mentionQuery !== null && filteredMentions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setHighlightedMention((i) => Math.min(i + 1, filteredMentions.length - 1))
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setHighlightedMention((i) => Math.max(i - 1, 0))
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          const note = filteredMentions[highlightedMention]
          if (note) selectMention(note)
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          closeMentionPicker()
          return
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [closeMentionPicker, mentionQuery, filteredMentions, highlightedMention, selectMention, sendMessage]
  )

  // ─── Shared input box ─────────────────────────────────────────────────────
  const hasDraftText = inputValue.trim().length > 0

  const openMentionPicker = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()

    const selection = window.getSelection()
    let range: Range | null = null

    if (selection && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0)
      const anchorNode = selection.anchorNode

      if (selection.isCollapsed && anchorNode && editor.contains(anchorNode)) {
        range = currentRange.cloneRange()
      }
    }

    if (!range) {
      range = createCollapsedRangeAtComposerEnd(editor)
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }

    activeMentionRangeRef.current = range.cloneRange()
    setMentionQuery('')
    setHighlightedMention(0)
  }, [])

  const applyPromptText = useCallback(
    (text: string) => {
      const editor = editorRef.current
      if (!editor) return

      editor.textContent = text
      closeMentionPicker()
      syncComposerState()
      focusComposerEnd(editor)
    },
    [closeMentionPicker, syncComposerState]
  )

  const inputBox = (
    <div ref={composerRef} className="relative w-full">
      {/* @ mention dropdown */}
      <AnimatePresence>
        {mentionQuery !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ duration: 0.13, ease: [0.2, 0, 0, 1] }}
              className="absolute bottom-full left-0 z-20 mb-3 w-72 max-h-[40vh] overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-1.5 md:max-h-[50vh]"
              style={{ boxShadow: 'var(--dialog-shadow)' }}
              data-mention-picker
              role="listbox"
              aria-label="Mentioned notes"
            >
              <div className="px-3 pb-1.5 pt-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Notes
                </span>
              </div>

              {filteredMentions.length === 0 ? (
                <div className="px-4 pb-3 pt-2 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-2xl"
                      style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}
                    >
                      <Icon icon={StickyNoteIcon} size={16} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">No notes found</p>
                      <p className="text-xs text-[var(--text-muted)]">Try a different title or note name.</p>
                    </div>
                  </div>
                </div>
              ) : (
                filteredMentions.map((note, idx) => (
                  <button
                    key={note.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectMention(note)
                    }}
                    onMouseEnter={() => setHighlightedMention(idx)}
                    className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-[background-color,color] duration-100 ${
                      idx === highlightedMention
                        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    }`}
                    role="option"
                    aria-selected={idx === highlightedMention}
                  >
                    <Icon icon={StickyNoteIcon} size={14} strokeWidth={1.8} className="shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="block truncate text-[13px]">{getNoteTitle(note)}</span>
                  </button>
                ))
              )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative overflow-hidden rounded-[1.9rem] border transition-[border-color,box-shadow,transform] duration-200 focus-within:border-[var(--accent)] md:rounded-[2rem]"
        style={{
          borderColor: 'color-mix(in srgb, var(--border-default) 72%, transparent)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--bg-elevated) 92%, white 8%), color-mix(in srgb, var(--bg-elevated) 98%, var(--bg-primary) 2%))',
          boxShadow:
            '0 1px 0 color-mix(in srgb, white 12%, transparent) inset, 0 18px 36px -28px rgba(15, 23, 42, 0.34), 0 10px 18px -16px rgba(15, 23, 42, 0.24), 0 2px 5px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div className="px-4 pb-3.5 pt-4 md:px-5 md:pb-4 md:pt-4.5">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onKeyUp={handleEditorInput}
            onMouseUp={handleEditorInput}
            onBlur={() => {
              window.setTimeout(() => {
                const activeElement = document.activeElement
                if (!composerRef.current?.contains(activeElement)) {
                  closeMentionPicker()
                }
              }, 0)
            }}
            onKeyDown={handleKeyDown}
            data-placeholder="Ask Aura..."
            className="m-0 min-h-[28px] w-full resize-none bg-transparent text-[15px] leading-[1.6] text-[var(--text-primary)] outline-none empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--text-muted)] md:text-[15.5px]"
            style={{ maxHeight: '160px', overflowY: 'hidden', opacity: isStreaming ? 0.5 : 1 }}
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-3.5 pb-3.5 pt-1 md:px-4 md:pb-4">
          <button
            type="button"
            onClick={openMentionPicker}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[transform,background,color,box-shadow] duration-150 active:scale-[0.96]"
            style={{
              background: 'color-mix(in srgb, var(--bg-hover) 60%, transparent)',
              color: mentionQuery !== null ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 12%, transparent)',
            }}
            aria-label="Insert note mention"
            title="Insert note mention"
          >
            <Icon icon={Add01Icon} size={16} strokeWidth={2.1} />
          </button>

          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!hasDraftText || isStreaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[transform,opacity,background,color,box-shadow] duration-150 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: hasDraftText && !isStreaming ? 'var(--accent)' : 'var(--bg-hover)',
              color: hasDraftText && !isStreaming ? 'white' : 'var(--text-muted)',
              boxShadow:
                hasDraftText && !isStreaming
                  ? '0 10px 24px -16px color-mix(in srgb, var(--accent) 70%, transparent)'
                  : 'inset 0 1px 0 color-mix(in srgb, white 10%, transparent)',
            }}
            aria-label="Send message"
          >
            <Icon icon={ArrowUp02Icon} size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes chat-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <div className="relative flex flex-1 min-w-0 flex-col max-md:rounded-none rounded-2xl bg-[var(--bg-primary)] overflow-hidden">

        {/* ── Persistent top bar ───────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between px-4 py-2 md:px-5">
          {/* Left section: Sidebar toggle (desktop) & Back button (mobile) */}
          <div className="flex items-center">
            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="relative hidden md:flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.96]"
                title="Open sidebar (Cmd+B)"
              >
                <Icon icon={SidebarLeftIcon} size={22} strokeWidth={1.5} style={{ transform: 'scaleX(-1)' }} />
              </button>
            ) : (
              <div className="hidden md:block h-10 w-10" />
            )}
            
            <button
              type="button"
              onClick={onCloseChat}
              className="relative flex md:hidden h-10 w-10 items-center justify-center -ml-2 rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.96]"
              title="Back to notes"
            >
              <Icon icon={ArrowLeft01Icon} size={24} strokeWidth={1.8} />
            </button>
          </div>

          {/* New Chat — only when conversation is active */}
          <AnimatePresence>
            {hasMessages && (
              <motion.button
                initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
                type="button"
                onClick={handleNewChat}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-[background,color,border-color,transform] duration-150 hover:border-[var(--border-default)] hover:text-[var(--text-primary)] active:scale-[0.96]"
              >
                <Icon icon={Add01Icon} size={12} strokeWidth={2.2} />
                New Chat
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {!hasMessages && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              className="flex flex-1 flex-col overflow-hidden"
              style={{ zIndex: 1 }}
            >
              {/* Scrollable greeting area — mobile: top-aligned, desktop: vertically centered */}
              <div className="flex flex-1 flex-col overflow-y-auto px-5 md:items-center md:justify-center md:px-6">
                <div className="mx-auto flex min-h-full w-full max-w-[40rem] flex-col antialiased md:min-h-0">
                  {/* Greeting */}
                  <motion.div
                    initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                    className="order-1 mb-6 mt-8 pl-4 md:mb-5 md:mt-0 md:pl-5"
                  >
                    <h2
                      className="text-[1.6rem] font-bold tracking-tight md:text-[2rem]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Ask about your notes
                    </h2>
                  </motion.div>

                  {/* Input — one shared responsive instance */}
                  <motion.div
                    initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.35, delay: 0.07, ease: [0.2, 0, 0, 1] }}
                    className="order-3 mt-auto pb-4 pt-6 md:order-2 md:mt-0 md:pb-0 md:pt-0"
                  >
                    {inputBox}
                  </motion.div>

                  {/* Suggested prompts */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.14, ease: [0.2, 0, 0, 1] }}
                    className="order-2 mt-5 flex flex-col gap-1.5 pl-4 md:order-3 md:mt-6 md:gap-2 md:pl-5"
                  >
                    {EMPTY_STATE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        onClick={() => applyPromptText(prompt.label)}
                        className="group flex w-fit max-w-full items-center gap-3 rounded-2xl py-1.5 pr-2 text-left text-[15px] font-medium text-[var(--text-secondary)] transition-[transform,color] duration-150 hover:text-[var(--text-primary)] active:scale-[0.985]"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[background,color] duration-150"
                          style={{
                            background: 'color-mix(in srgb, var(--bg-hover) 54%, transparent)',
                            color: 'var(--accent)',
                          }}
                        >
                          <Icon icon={prompt.icon} size={15} strokeWidth={1.9} />
                        </span>
                        <span className="truncate">{prompt.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Conversation view ────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {hasMessages && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
              <div 
                  className="mx-auto flex flex-col gap-3"
                  style={{ maxWidth: '860px' }}
                >
                  {/* Fade blur at bottom */}
                  <div 
                    className="pointer-events-none h-16 -mb-4"
                    style={{
                      background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
                      maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
                    }}
                  />
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input pinned at bottom */}
              <div className="shrink-0 px-4 pt-3 pb-4 md:px-6 md:pt-4 md:pb-5">
                <div 
                  className="mx-auto"
                  style={{ maxWidth: '860px' }}
                >
                  {inputBox}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error toast ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border px-5 py-2.5 text-sm"
              style={{
                borderColor: 'var(--danger)',
                background: 'color-mix(in srgb, var(--danger) 12%, var(--bg-elevated))',
                color: 'var(--danger)',
                boxShadow: 'var(--neu-shadow)',
              }}
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="relative shrink-0 opacity-60 transition-[opacity,transform] hover:opacity-100 active:scale-[0.96] after:absolute after:-inset-2"
              >
                <Icon icon={Cancel01Icon} size={13} strokeWidth={2.2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  )
}
