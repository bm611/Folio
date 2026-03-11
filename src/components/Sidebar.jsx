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
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden transition-all duration-300"
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
          <div className="px-4 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-95"
                title="Toggle sidebar (Cmd+B)"
              >
                <TbLayoutSidebarLeftCollapse size={20} />
              </button>
              <span
                className="text-base font-bold tracking-tight bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-muted)] bg-clip-text text-transparent"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Canvas
              </span>
              <div className="w-9" />
            </div>

            <button
              type="button"
              onClick={onNewNote}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] px-3 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              title="New note (Cmd+N)"
            >
              New Note
            </button>

            <div className="mt-4 mb-1">
              <label className="flex h-10 items-center gap-2.5 rounded-xl bg-[var(--bg-elevated)] px-3.5 border border-transparent transition-all focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/10 shadow-inner">
                <HiMagnifyingGlass size={16} className="shrink-0 text-[var(--text-muted)] transition-colors focus-within:text-[var(--accent)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search notes..."
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </label>
            </div>
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {searchQuery.trim() && (
              <div className="mb-2 px-1">
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {notes.length} result{notes.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <div className="space-y-1">
              {notes.length === 0 ? (
                <div className="px-2 py-10 text-center flex flex-col items-center justify-center opacity-60">
                  <div className="mb-3 rounded-full bg-[var(--bg-elevated)] p-3">
                    <HiMagnifyingGlass size={24} className="text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-muted)]">
                    {searchQuery.trim() ? 'No results found' : 'No notes yet'}
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
                      className={`group relative flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border-subtle)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                      }`}
                      onClick={() => {
                        onSelectNote(note.id)
                        if (window.innerWidth < 768) onToggleCollapse()
                      }}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] opacity-80" />
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <span
                          className={`block truncate transition-transform duration-200 ${isActive ? 'font-medium' : 'group-hover:translate-x-1'} text-[14px]`}
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteNote(note.id)
                        }}
                        className="shrink-0 rounded-md p-1.5 text-[var(--text-muted)] transition-all hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <HiXMark size={14} />
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
