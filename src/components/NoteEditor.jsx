import { lazy, Suspense, useState, useRef, useCallback } from 'react'
import {
  HiArrowsPointingIn,
  HiArrowsPointingOut,
  HiCalendarDays,
  HiHashtag,
  HiMoon,
  HiSun,
  HiXMark,
} from 'react-icons/hi2'
import { TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { countBodyWords, estimateReadTime, formatCreatedAt, getNoteDisplayTitle } from '../utils/noteMeta'

const LiveMarkdownEditor = lazy(() => import('./LiveMarkdownEditor'))

function EditorFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
      Loading...
    </div>
  )
}

export default function NoteEditor({
  note,
  notes,
  onUpdateNote,
  onSelectNote,
  onRegisterEditorApi,
  theme,
  onToggleTheme,
  sidebarCollapsed,
  onToggleSidebar,
  focusMode,
  onToggleFocusMode,
}) {
  const [tagInput, setTagInput] = useState('')
  const [showGoalInput, setShowGoalInput] = useState(false)
  const [goalInputVal, setGoalInputVal] = useState('')

  // Prevents double-fire when Enter triggers both keydown and blur
  const goalCommittedRef = useRef(false)

  // Session word count: capture baseline when a note is first opened
  const sessionBaseRef = useRef(null)
  const prevNoteIdRef = useRef(null)

  // Keeps a local reference to the editor API so the title input can focus it
  const editorApiRef = useRef(null)

  const handleRegisterEditorApi = useCallback(
    (api) => {
      editorApiRef.current = api
      onRegisterEditorApi?.(api)
    },
    [onRegisterEditorApi]
  )

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      editorApiRef.current?.focus()
    }
  }

  const handleAddTag = (event) => {
    if (event.key !== 'Enter' || !tagInput.trim()) {
      return
    }

    event.preventDefault()
    const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')

    if (newTag && !(note.tags || []).includes(newTag)) {
      onUpdateNote(note.id, { tags: [...(note.tags || []), newTag] })
    }

    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove) => {
    const newTags = (note.tags || []).filter((tag) => tag !== tagToRemove)
    onUpdateNote(note.id, { tags: newTags })
  }

  if (!note) {
    const today = new Date()
    const dateStr = today.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const recentNotes = [...(notes || [])]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 6)

    return (
      <div className="flex flex-1 min-w-0 flex-col rounded-2xl bg-[var(--bg-primary)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 md:px-6">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title="Open sidebar (Cmd+B)"
            >
              <TbLayoutSidebarLeftExpand size={18} />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <HiSun size={18} /> : <HiMoon size={18} />}
          </button>
        </div>

        {/* Welcome content */}
        <div className="flex flex-1 flex-col items-center px-6 pt-[12vh]">
          <p
            className="text-sm tracking-wide text-[var(--text-muted)]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {dateStr}
          </p>
          <h1
            className="mt-2 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Welcome back.
          </h1>

          {recentNotes.length > 0 && (
            <div className="mt-10 w-full max-w-2xl">
              <p
                className="mb-4 text-md text-[var(--text-muted)]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Recent Notes
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentNotes.map((n) => {
                  const title = getNoteDisplayTitle(n)
                  const preview = (n.content || '').replace(/[#*>`\-\[\]()!_~]/g, '').trim().slice(0, 80)
                  const time = new Date(n.updatedAt || n.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onSelectNote(n.id)}
                      className="flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-left transition-colors hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
                    >
                      <span
                        className="truncate text-[13px] font-medium text-[var(--text-primary)]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {title}
                      </span>
                      {preview && (
                        <span
                          className="line-clamp-2 text-[12px] leading-relaxed text-[var(--text-muted)]"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {preview}
                        </span>
                      )}
                      <span
                        className="mt-auto text-[10px] text-[var(--text-muted)]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {time}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const tags = note.tags || []
  const createdAtLabel = formatCreatedAt(note.createdAt)
  const wordCount = countBodyWords(note.content)
  const readTime = estimateReadTime(note.content)
  const wordGoal = note.wordGoal || null
  const goalProgress = wordGoal ? Math.min(100, Math.round((wordCount / wordGoal) * 100)) : null

  // Session baseline: reset whenever the open note changes
  if (note.id !== prevNoteIdRef.current) {
    prevNoteIdRef.current = note.id
    sessionBaseRef.current = wordCount
  }
  const sessionDelta = wordCount - (sessionBaseRef.current ?? wordCount)

  // ── Goal handlers ────────────────────────────────────────────────────────────

  const openGoalInput = () => {
    goalCommittedRef.current = false
    setGoalInputVal(wordGoal !== null ? String(wordGoal) : '')
    setShowGoalInput(true)
  }

  const commitGoal = (value) => {
    if (goalCommittedRef.current) return
    goalCommittedRef.current = true
    const val = parseInt(value.trim(), 10)
    if (!isNaN(val) && val > 0) {
      onUpdateNote(note.id, { wordGoal: val }, { skipTimestamp: true })
    } else {
      onUpdateNote(note.id, { wordGoal: null }, { skipTimestamp: true })
    }
    setShowGoalInput(false)
    setGoalInputVal('')
  }

  const handleGoalKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitGoal(goalInputVal)
    } else if (e.key === 'Escape') {
      goalCommittedRef.current = true // suppress blur commit
      setShowGoalInput(false)
      setGoalInputVal('')
    }
  }

  const handleGoalBlur = () => {
    commitGoal(goalInputVal)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={`relative flex flex-1 flex-col min-h-0 min-w-0 w-full bg-[var(--bg-primary)] transition-[border-radius] duration-300 ${
        focusMode ? 'rounded-none' : 'rounded-2xl'
      }`}
    >
      {/* Zen mode exit button — floats in the top-right corner */}
      {focusMode && (
        <button
          type="button"
          onClick={onToggleFocusMode}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 opacity-20 transition-all hover:opacity-80 hover:bg-[var(--bg-hover)] select-none"
          style={{ fontFamily: "'Inter', sans-serif", color: 'var(--text-muted)', fontSize: '11px' }}
          title="Exit focus mode (⌘⇧F)"
        >
          <HiArrowsPointingOut size={12} />
          <span>Exit</span>
        </button>
      )}

      {/* Top bar — hidden in focus mode */}
      {!focusMode && (
        <div className="flex items-center justify-between px-4 py-2 md:px-6">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title="Open sidebar (Cmd+B)"
            >
              <TbLayoutSidebarLeftExpand size={18} />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleFocusMode}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title="Focus mode (⌘⇧F)"
            >
              <HiArrowsPointingIn size={18} />
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <HiSun size={18} /> : <HiMoon size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div
          className={`mx-auto max-w-3xl px-4 pb-32 sm:px-6 md:px-10 ${
            focusMode ? 'pt-[12vh]' : ''
          }`}
        >
          {/* Title — hidden in focus mode */}
          {!focusMode && (
            <input
              type="text"
              value={note.title}
              onChange={(event) => onUpdateNote(note.id, { title: event.target.value })}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent text-3xl font-black tracking-tight text-[var(--title-color)] outline-none placeholder:text-[var(--text-muted)] sm:text-4xl md:text-5xl"
              style={{ fontFamily: "'Fraunces', serif" }}
              placeholder="Untitled"
            />
          )}

          {/* Metadata — hidden in focus mode */}
          {!focusMode && (
            <div
              className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-[var(--text-muted)]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <HiCalendarDays className="h-3.5 w-3.5" />
                {createdAtLabel}
              </span>

              {tags.length > 0 && <span className="text-[var(--border-default)]">·</span>}

              {tags.map((tag, i) => {
                const c = i % 8
                return (
                  <span
                    key={tag}
                    className="group/tag relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-all max-md:pr-5 md:hover:pr-5"
                    style={{
                      backgroundColor: `var(--tag-${c}-bg)`,
                      color: `var(--tag-${c}-text)`,
                    }}
                  >
                    <HiHashtag className="h-3 w-3 opacity-60" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-opacity hover:text-red-400 max-md:opacity-60 md:opacity-0 md:group-hover/tag:opacity-100"
                      aria-label={`Remove ${tag}`}
                    >
                      <HiXMark size={10} />
                    </button>
                  </span>
                )
              })}

              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? '+ Add tag' : '+'}
                className="w-16 bg-transparent py-0.5 text-[12px] text-[var(--text-muted)] outline-none placeholder:text-[var(--text-muted)] focus:text-[var(--text-primary)] transition-colors"
              />
            </div>
          )}

          {/* Editor */}
          <div className={focusMode ? 'mt-0' : 'mt-8'}>
            <Suspense fallback={<EditorFallback />}>
              <LiveMarkdownEditor
                value={note.content}
                onChange={(content) => onUpdateNote(note.id, { content })}
                onRegisterEditorApi={onRegisterEditorApi}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Stats bar — bottom right */}
      <div
        className="absolute bottom-4 right-4 flex flex-col items-end gap-1.5"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Word goal progress bar */}
        {wordGoal !== null && !showGoalInput && (
          <div className="flex items-center gap-2">
            <div className="h-[3px] w-28 overflow-hidden rounded-full bg-[var(--border-subtle)]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${goalProgress}%`,
                  background: goalProgress >= 100 ? 'var(--success)' : 'var(--accent)',
                }}
              />
            </div>
          </div>
        )}

        {/* Inline goal input */}
        {showGoalInput && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">Word goal:</span>
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              type="number"
              min="1"
              value={goalInputVal}
              onChange={(e) => setGoalInputVal(e.target.value)}
              onKeyDown={handleGoalKeyDown}
              onBlur={handleGoalBlur}
              placeholder="e.g. 5000"
              className="w-20 rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] tabular-nums"
            />
          </div>
        )}

        {/* Stats line */}
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] tabular-nums select-none">
          {/* Session delta */}
          {sessionDelta > 0 && (
            <>
              <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                +{sessionDelta.toLocaleString()}
              </span>
              <span className="opacity-40">·</span>
            </>
          )}

          {/* Word count / goal */}
          {wordGoal !== null ? (
            <span>
              {wordCount.toLocaleString()}&thinsp;/&thinsp;{wordGoal.toLocaleString()}
              <span className="ml-1 opacity-60">({goalProgress}%)</span>
            </span>
          ) : (
            <span>{new Intl.NumberFormat().format(wordCount)} words</span>
          )}

          {/* Reading time */}
          {readTime && (
            <>
              <span className="opacity-40">·</span>
              <span>{readTime}</span>
            </>
          )}

          {/* Goal toggle — hidden in focus mode */}
          {!focusMode && (
            <>
              <span className="opacity-40">·</span>
              <button
                type="button"
                onClick={openGoalInput}
                className="transition-colors hover:text-[var(--accent)]"
                title={wordGoal ? 'Edit word goal' : 'Set a word goal'}
              >
                {wordGoal ? 'goal' : 'set goal'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
