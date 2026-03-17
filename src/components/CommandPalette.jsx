import { useEffect, useMemo, useRef, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'

export default function CommandPalette({
  open,
  query,
  items,
  onClose,
  onQueryChange,
  onSelectItem,
}) {
  const inputRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      return
    }

    // Skip auto-focus on touch devices to prevent the mobile keyboard
    // from opening and blocking the command options
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    if (!isTouchDevice) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) => Math.min(current + 1, Math.max(items.length - 1, 0)))
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => Math.max(current - 1, 0))
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const selected = items[activeIndex]
        if (selected) {
          onSelectItem(selected)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, items, onClose, onSelectItem, open])

  const sections = useMemo(() => {
    const grouped = []
    let currentSection = ''

    items.forEach((item, index) => {
      if (item.section !== currentSection) {
        currentSection = item.section
        grouped.push({
          type: 'section',
          id: `section-${currentSection}`,
          label: currentSection,
        })
      }

      grouped.push({
        type: 'item',
        item,
        index,
      })
    })

    return grouped
  }, [items])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-start justify-center bg-[color-mix(in_srgb,var(--bg-deep)_60%,transparent)] px-0 md:px-4 pt-0 md:pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-t-2xl md:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] max-md:max-h-[70vh] max-md:animate-[slideUpSheet_0.25s_ease-out] md:animate-ctx-fade-in" style={{ boxShadow: 'var(--dialog-shadow)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', transformOrigin: 'top center' }}>
        {/* Search input */}
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-4 py-3">
          <IconSearch size={15} stroke={1.5} className="shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd
            className="shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
              No results
            </div>
          ) : (
            <div>
              {sections.map((entry) => {
                if (entry.type === 'section') {
                  return (
                    <div
                      key={entry.id}
                      className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]"
                    >
                      {entry.label}
                    </div>
                  )
                }

                const { item, index } = entry
                const isActive = index === activeIndex

                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => onSelectItem(item)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {item.icon ? <span className="shrink-0 text-[var(--text-muted)]">{item.icon}</span> : null}
                      <span
                        className="truncate text-[13px] font-medium"
                        style={{ fontFamily: '"Outfit", sans-serif' }}
                      >
                        {item.title}
                      </span>
                    </div>
                    {item.hint ? (
                      <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                        {item.hint}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
