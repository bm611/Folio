import { lazy, Suspense, useState, useRef, useCallback } from 'react'
import {
  IconArrowsMinimize,
  IconArrowsMaximize,
  IconCalendar,
  IconHash,
  IconMoon,
  IconSun,
  IconX,
  IconLayoutSidebarLeftCollapse,
} from '@tabler/icons-react'
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
  onNewNote,
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
    const hour = today.getHours()
    let greeting = 'Good evening'
    if (hour < 12) greeting = 'Good morning'
    else if (hour < 18) greeting = 'Good afternoon'

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
      <div className="flex flex-1 min-w-0 flex-col max-md:rounded-none rounded-2xl bg-[var(--bg-primary)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 md:px-6">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title="Open sidebar (Cmd+B)"
            >
              <IconLayoutSidebarLeftCollapse size={18} stroke={1.5} style={{ transform: "scaleX(-1)" }} />
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
            {theme === 'dark' ? <IconSun size={18} stroke={1.5} /> : <IconMoon size={18} stroke={1.5} />}
          </button>
        </div>

        {/* Welcome content */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-[10vh]">
          <div className="animate-fade-in-up mb-6 flex justify-center text-[var(--accent)] opacity-80 mix-blend-luminosity">
            <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* Background abstract shapes */}
                <circle cx="100" cy="100" r="60" strokeDasharray="4 8" opacity="0.3">
                  <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="30s" repeatCount="indefinite" />
                </circle>
                <circle cx="100" cy="100" r="80" strokeDasharray="2 12" opacity="0.2">
                  <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="40s" repeatCount="indefinite" />
                </circle>
                
                {/* Document Base */}
                <path d="M70 50 H120 C125.5 50 130 54.5 130 60 V140 C130 145.5 125.5 150 120 150 H70 C64.5 150 60 145.5 60 140 V60 C60 54.5 64.5 50 70 50 Z" opacity="0.8" fill="var(--bg-surface)" strokeWidth="1.5">
                  <animate attributeName="stroke-dasharray" values="0 400; 400 0" dur="2s" fill="freeze" />
                </path>

                {/* Lines of text appearing */}
                <line x1="75" y1="80" x2="115" y2="80" opacity="0">
                  <animate attributeName="opacity" values="0;1" dur="0.1s" begin="1s" fill="freeze" />
                  <animate attributeName="x2" values="75;115" dur="1s" begin="1s" fill="freeze" />
                </line>
                <line x1="75" y1="95" x2="105" y2="95" opacity="0">
                  <animate attributeName="opacity" values="0;1" dur="0.1s" begin="1.5s" fill="freeze" />
                  <animate attributeName="x2" values="75;105" dur="1s" begin="1.5s" fill="freeze" />
                </line>
                <line x1="75" y1="110" x2="110" y2="110" opacity="0">
                  <animate attributeName="opacity" values="0;1" dur="0.1s" begin="2s" fill="freeze" />
                  <animate attributeName="x2" values="75;110" dur="1s" begin="2s" fill="freeze" />
                </line>
                <line x1="75" y1="125" x2="95" y2="125" opacity="0">
                  <animate attributeName="opacity" values="0;1" dur="0.1s" begin="2.5s" fill="freeze" />
                  <animate attributeName="x2" values="75;95" dur="1s" begin="2.5s" fill="freeze" />
                </line>

                {/* Magic Sparkles */}
                <g opacity="0">
                  <animate attributeName="opacity" values="0;1;0" dur="3s" begin="2.5s" repeatCount="indefinite" />
                  <path d="M140 40 L142 46 L148 48 L142 50 L140 56 L138 50 L132 48 L138 46 Z" fill="currentColor" stroke="none" />
                </g>
                <g opacity="0">
                  <animate attributeName="opacity" values="0;1;0" dur="4s" begin="1.5s" repeatCount="indefinite" />
                  <path d="M50 120 L51 123 L54 124 L51 125 L50 128 L49 125 L46 124 L49 123 Z" fill="currentColor" stroke="none" />
                </g>
                
                {/* Floating Pen */}
                <g opacity="0">
                  <animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.5s" fill="freeze" />
                  <animateTransform attributeName="transform" type="translate" values="10 10; 0 0; 10 10" dur="6s" repeatCount="indefinite" />
                  
                  <path d="M135 115 L145 105 C147 103 150 103 152 105 L155 108 C157 110 157 113 155 115 L145 125 Z" fill="var(--bg-surface)" />
                  <path d="M135 115 L130 130 L145 125 Z" fill="var(--bg-hover)" />
                  <path d="M131 127 L130 130 L133 129 Z" fill="currentColor" stroke="none" />
                </g>
              </g>
            </svg>
          </div>
          <div className="animate-fade-in-up-delay-1 flex flex-col items-center">
            <h1
              className="text-6xl tracking-tight text-[var(--h1-color)] sm:text-7xl"
              style={{ fontFamily: '"Italiana", serif', textShadow: '0 4px 24px var(--accent-muted)' }}
            >
              Aura.
            </h1>
            <p
              className="mt-4 text-[16px] text-[var(--text-muted)] tracking-wide"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {greeting}. It's {dateStr}.
            </p>
          </div>

          <div className="animate-fade-in-up-delay-2 mt-8 mb-2">
            <button
              onClick={() => onNewNote?.()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[var(--accent-muted)] transition-all duration-300 hover:bg-[var(--accent-hover)] hover:shadow-[0_0_20px_var(--accent-muted)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Create New Note
            </button>
          </div>

          {recentNotes.length > 0 && (
            <div className="animate-fade-in-up-delay-2 mt-12 w-full max-w-3xl">
              <div className="mb-6 flex items-center justify-center gap-4">
                 <div className="h-px w-12 bg-[var(--border-subtle)]"></div>
                 <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                   Recent Notes
                 </p>
                 <div className="h-px w-12 bg-[var(--border-subtle)]"></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentNotes.map((n, index) => {
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
                      className={`flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)] hover:-translate-y-0.5 hover:shadow-md ${index >= 2 ? 'hidden sm:flex' : ''}`}
                    >
                      <span
                        className="truncate text-[14px] font-semibold text-[var(--text-primary)]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {title}
                      </span>
                      {preview && (
                        <span
                          className="line-clamp-2 text-[13px] leading-relaxed text-[var(--text-muted)]"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {preview}
                        </span>
                      )}
                      <span
                        className="mt-auto text-[11px] font-medium text-[var(--text-muted)] opacity-80"
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
        focusMode ? 'rounded-none' : 'max-md:rounded-none rounded-2xl'
      }`}
    >
      {/* Zen mode exit button — floats in the top-right corner */}
      {focusMode && (
        <button
          type="button"
          onClick={onToggleFocusMode}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 opacity-20 transition-all hover:opacity-80 hover:bg-[var(--bg-hover)] select-none"
          style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--text-muted)', fontSize: '11px' }}
          title="Exit focus mode (⌘⇧F)"
        >
          <IconArrowsMaximize size={12} stroke={1.5} />
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
              <IconLayoutSidebarLeftCollapse size={18} stroke={1.5} style={{ transform: "scaleX(-1)" }} />
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
              <IconArrowsMinimize size={18} stroke={1.5} />
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <IconSun size={18} stroke={1.5} /> : <IconMoon size={18} stroke={1.5} />}
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
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <IconCalendar size={14} stroke={1.5} className="opacity-70" />
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
                    <IconHash size={12} stroke={1.5} className="opacity-60" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-opacity hover:text-red-400 max-md:opacity-60 md:opacity-0 md:group-hover/tag:opacity-100"
                      aria-label={`Remove ${tag}`}
                    >
                      <IconX size={10} stroke={2} />
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
        style={{ fontFamily: "'DM Sans', sans-serif" }}
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
