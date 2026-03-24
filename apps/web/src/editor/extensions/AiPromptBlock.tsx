import { useState, useRef, useEffect, useCallback } from 'react'

import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { Fragment, Slice } from '@tiptap/pm/model'

import { streamAiChat } from '../../utils/aiChat'
import { markdownToDoc } from '../markdown/markdownConversion'
import { createFolioEditorExtensions } from '../core/extensions'

// ─── Types ──────────────────────────────────────────────────────

interface NoteRef {
  id: string
  title: string
}

export interface StoredNote {
  id: string
  title: string
  content: string
}

// ─── React View ─────────────────────────────────────────────────

function AiPromptView({ node, editor, getPos, deleteNode }: NodeViewProps) {
  const currentNoteId = (node.attrs.currentNoteId as string) || ''
  const currentNoteTitle = (node.attrs.currentNoteTitle as string) || ''

  const [mentions, setMentions] = useState<NoteRef[]>(() => {
    if (currentNoteId) {
      return [{ id: currentNoteId, title: currentNoteTitle || 'Untitled' }]
    }
    return []
  })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle')
  const [streamedContent, setStreamedContent] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // @ mention search state
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const mentionInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Focus the query input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // Get notes from editor storage
  const getNotes = useCallback((): StoredNote[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage = editor.storage as any
    return (storage.aiPromptBlock?.notes as StoredNote[]) ?? []
  }, [editor])

  // Filter notes for mention dropdown
  const getFilteredNotes = useCallback(() => {
    const allNotes = getNotes()
    const mentionedIds = new Set(mentions.map((m) => m.id))
    const lower = mentionSearch.toLowerCase()
    return allNotes
      .filter((n) => !mentionedIds.has(n.id))
      .filter((n) => (n.title || 'Untitled').toLowerCase().includes(lower))
      .slice(0, 8)
  }, [getNotes, mentions, mentionSearch])

  const addMention = useCallback((note: StoredNote) => {
    setMentions((prev) => [...prev, { id: note.id, title: note.title || 'Untitled' }])
    setMentionSearch('')
    setShowMentionDropdown(false)
    setSelectedMentionIndex(0)
    inputRef.current?.focus()
  }, [])

  const removeMention = useCallback((id: string) => {
    setMentions((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const handleMentionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = getFilteredNotes()

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIndex((i) => Math.min(i + 1, items.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && items.length > 0) {
        e.preventDefault()
        const selected = items[selectedMentionIndex]
        if (selected) {
          addMention(selected)
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowMentionDropdown(false)
        inputRef.current?.focus()
        return
      }
      if (e.key === 'Backspace' && mentionSearch === '') {
        e.preventDefault()
        setShowMentionDropdown(false)
        inputRef.current?.focus()
      }
    },
    [getFilteredNotes, selectedMentionIndex, addMention, mentionSearch]
  )

  const replaceBlockWithRichText = useCallback(
    (markdown: string) => {
      const pos = typeof getPos === 'function' ? getPos() : null
      if (pos == null) return

      const extensions = createFolioEditorExtensions()
      const doc = markdownToDoc(markdown, extensions)
      const contentNodes = doc.content ?? []

      if (contentNodes.length === 0) {
        deleteNode()
        return
      }

      try {
        const pmNodes = contentNodes.map((nodeJson) =>
          editor.state.schema.nodeFromJSON(nodeJson)
        )

        const nodeAtPos = editor.state.doc.nodeAt(pos)
        if (!nodeAtPos) return
        const nodeSize = nodeAtPos.nodeSize

        const { tr } = editor.state
        const slice = new Slice(Fragment.from(pmNodes), 0, 0)
        tr.replace(pos, pos + nodeSize, slice)
        editor.view.dispatch(tr)
      } catch {
        // Fallback: use editor chain API
        const nodeAtPos = editor.state.doc.nodeAt(pos)
        if (!nodeAtPos) return
        const nodeSize = nodeAtPos.nodeSize

        editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + nodeSize })
          .insertContentAt(pos, contentNodes)
          .run()
      }
    },
    [editor, getPos, deleteNode]
  )

  const handleSend = useCallback(() => {
    if (status === 'streaming') return
    if (!query.trim() && mentions.length === 0) return

    setStatus('streaming')
    setStreamedContent('')
    setErrorMessage('')

    const allNotes = getNotes()
    const noteContents = mentions
      .map((m) => {
        const note = allNotes.find((n) => n.id === m.id)
        if (!note) return null
        return { title: note.title || 'Untitled', content: note.content }
      })
      .filter((n): n is { title: string; content: string } => n !== null)

    if (abortRef.current) {
      abortRef.current.abort()
    }
    const abort = new AbortController()
    abortRef.current = abort

    let accumulated = ''

    streamAiChat(
      {
        question: query.trim() || 'Summarize the referenced notes.',
        noteContents,
      },
      {
        onToken(token) {
          accumulated += token
          setStreamedContent(accumulated)
        },
        onDone() {
          abortRef.current = null
          replaceBlockWithRichText(accumulated)
        },
        onError(error) {
          setStatus('error')
          setErrorMessage(error)
          abortRef.current = null
        },
      },
      abort.signal
    ).catch(console.error)
  }, [query, mentions, status, getNotes, replaceBlockWithRichText])

  const handleQueryKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        deleteNode()
      }
    },
    [handleSend, deleteNode]
  )

  const handleAtClick = useCallback(() => {
    setShowMentionDropdown(true)
    setTimeout(() => mentionInputRef.current?.focus(), 30)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  return (
    <NodeViewWrapper className="aura-ai-prompt-wrapper" contentEditable={false}>
      {/* Close button */}
      {status !== 'streaming' && (
        <button
          type="button"
          className="aura-ai-prompt-close-floating"
          onClick={deleteNode}
          title="Cancel (Esc)"
        >
          &times;
        </button>
      )}

      {/* Mentions row (floats above input) */}
      <div className="aura-ai-prompt-mentions">
          {mentions.map((m) => (
            <span key={m.id} className="aura-ai-mention-chip">
              <span className="aura-ai-mention-at">@</span>
              {m.title}
              {status === 'idle' && (
                <button
                  type="button"
                  className="aura-ai-mention-remove"
                  onClick={() => removeMention(m.id)}
                >
                  &times;
                </button>
              )}
            </span>
          ))}
          {status === 'idle' && (
            <div className="aura-ai-mention-add-wrap">
              {showMentionDropdown ? (
                <div className="aura-ai-mention-search-wrap">
                  <input
                    ref={mentionInputRef}
                    type="text"
                    className="aura-ai-mention-search"
                    placeholder="Search notes..."
                    value={mentionSearch}
                    onChange={(e) => {
                      setMentionSearch(e.target.value)
                      setSelectedMentionIndex(0)
                    }}
                    onKeyDown={handleMentionKeyDown}
                    onBlur={() => setTimeout(() => setShowMentionDropdown(false), 150)}
                  />
                  <div className="aura-ai-mention-dropdown">
                    {getFilteredNotes().length === 0 ? (
                      <div className="aura-ai-mention-dropdown-empty">No notes found</div>
                    ) : (
                      getFilteredNotes().map((note, i) => (
                        <button
                          key={note.id}
                          type="button"
                          className={`aura-ai-mention-dropdown-item ${i === selectedMentionIndex ? 'is-active' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            addMention(note)
                          }}
                        >
                          {note.title || 'Untitled'}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="aura-ai-mention-add-btn"
                  onClick={handleAtClick}
                >
                  + Add note
                </button>
              )}
            </div>
          )}
        </div>

        {/* Query input */}
        {status === 'idle' && (
          <div className="aura-ai-prompt-input-row">
            <input
              ref={inputRef}
              type="text"
              className="aura-ai-prompt-input"
              placeholder="Ask a question about your notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleQueryKeyDown}
            />
            <button
              type="button"
              className="aura-ai-prompt-send"
              onClick={handleSend}
              disabled={!query.trim() && mentions.length === 0}
              title="Send (Enter)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        )}

        {/* Streaming state */}
        {status === 'streaming' && (
          <div className="aura-ai-prompt-streaming">
            <div className="aura-ai-prompt-streaming-header">
              <span className="aura-ai-pulse" />
              <span>Generating...</span>
            </div>
            {streamedContent && (
              <pre className="aura-ai-prompt-preview">{streamedContent}</pre>
            )}
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="aura-ai-prompt-error">
            <span className="aura-ai-prompt-error-text">{errorMessage}</span>
            <div className="aura-ai-prompt-error-actions">
              <button
                type="button"
                className="aura-ai-prompt-retry"
                onClick={() => {
                  setStatus('idle')
                  setErrorMessage('')
                }}
              >
                Retry
              </button>
              <button
                type="button"
                className="aura-ai-prompt-close"
                onClick={deleteNode}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
    </NodeViewWrapper>
  )
}

// ─── Tiptap Node ────────────────────────────────────────────────

export const AiPromptBlock = Node.create({
  name: 'aiPromptBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      currentNoteId: { default: '' },
      currentNoteTitle: { default: '' },
    }
  },

  addStorage() {
    return {
      notes: [] as StoredNote[],
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-ai-prompt]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-ai-prompt': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiPromptView)
  },
})
