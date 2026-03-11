import {
  HiMagnifyingGlass,
  HiMiniPlus,
  HiXMark,
} from 'react-icons/hi2'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { getNoteDisplayTitle } from '../utils/noteMeta'

export default function Sidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  collapsed,
  onToggleCollapse,
  searchQuery,
  onSearchChange,
}) {
  return (
    <>
      {/* Backdrop — mobile only, visible when sidebar is open */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onToggleCollapse}
        />
      )}

      <aside
        className={`
          ${collapsed ? 'w-0' : 'w-72'}
          fixed inset-y-0 left-0 z-40
          md:relative md:z-auto
          h-screen shrink-0 overflow-hidden
          bg-[var(--bg-deep)]
          transition-all duration-300 ease-[var(--ease-out-quart)]
        `}
      >
        <div className="flex h-full w-72 flex-col">
          {/* Header */}
          <div className="px-3 pb-2 pt-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                title="Toggle sidebar (Cmd+B)"
              >
                <TbLayoutSidebarLeftCollapse size={18} />
              </button>
              <span
                className="text-sm font-semibold tracking-tight text-[var(--text-primary)]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Canvas
              </span>
              <div className="w-8" />
            </div>

            <button
              type="button"
              onClick={onNewNote}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-muted)] px-3 py-2 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
              title="New note (Cmd+N)"
            >
              <HiMiniPlus size={14} />
              New Note
            </button>

            <div className="mt-3">
              <label className="flex h-8 items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-2.5">
                <HiMagnifyingGlass size={14} className="shrink-0 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search notes..."
                  className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </label>
            </div>
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {searchQuery.trim() && (
              <div className="mb-1 px-2">
                <span
                  className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {notes.length} result{notes.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <div className="space-y-px">
              {notes.length === 0 ? (
                <div className="px-2 py-8 text-center">
                  <p className="text-xs text-[var(--text-muted)]">
                    {searchQuery.trim() ? 'No results.' : 'No notes yet.'}
                  </p>
                </div>
              ) : (
                notes.map((entry) => {
                  const note = entry.note || entry
                  const isActive = note.id === activeNoteId
                  const title = getNoteDisplayTitle(note)

                  return (
                    <div
                      key={note.id}
                      className={`group flex items-center gap-1 rounded-lg px-2 py-2 md:py-1.5 transition-colors ${
                        isActive
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectNote(note.id)
                          if (window.innerWidth < 768) onToggleCollapse()
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span
                          className="block truncate text-[13px]"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {title}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteNote(note.id)
                        }}
                        className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--danger)] max-md:opacity-40 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <HiXMark size={12} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </aside>


    </>
  )
}
