import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import Icon from './Icon'

export interface PaletteItem {
  id: string
  section: string
  title: string
  subtitle?: string
  hint?: string
  icon?: ReactNode
  keywords?: string[]
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  query: string
  items: PaletteItem[]
  onClose: () => void
  onQueryChange: (query: string) => void
  onSelectItem: (item: PaletteItem) => void
}

type SectionEntry =
  | { type: 'section'; id: string; label: string }
  | { type: 'item'; item: PaletteItem; index: number }

export default function CommandPalette({
  open,
  query,
  items,
  onClose,
  onQueryChange,
  onSelectItem,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
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

    const handleKeyDown = (event: KeyboardEvent) => {
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
    const grouped: SectionEntry[] = []
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
      className="fixed inset-0 z-50 flex items-end md:items-start justify-center bg-[rgba(32,33,36,0.4)] px-0 md:px-4 pt-0 md:pt-[12vh]"
      style={{ backdropFilter: 'blur(2px)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[16px] max-md:rounded-b-none max-md:max-h-[70vh] max-md:animate-[slideUpSheet_0.18s_ease-out] md:animate-ctx-fade-in"
        style={{
          background: '#ffffff',
          border: '1px solid #e8eaed',
          boxShadow: '0 16px 40px -12px rgba(32,33,36,0.2), 0 4px 12px -4px rgba(32,33,36,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transformOrigin: 'top center',
          fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 border-b px-4 py-3.5" style={{ borderColor: '#e8eaed' }}>
          <Icon icon={Search01Icon} size={15} stroke={1.5} className="shrink-0" style={{ color: '#9aa0a6' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search commands…"
            className="w-full bg-transparent text-[13.5px] font-medium outline-none"
            style={{
              color: '#202124',
              fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
            }}
          />
          <kbd
            className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide"
            style={{
              background: '#f8f9fa',
              border: '1px solid #e8eaed',
              color: '#5f6368',
              fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {items.length === 0 ? (
            <div
              className="px-4 py-8 text-center text-[13px]"
              style={{ color: '#9aa0a6', fontFamily: '"Poppins", system-ui, -apple-system, sans-serif' }}
            >
              Nothing matched — try a different search.
            </div>
          ) : (
            <div>
              {sections.map((entry) => {
                if (entry.type === 'section') {
                  return (
                    <div
                      key={entry.id}
                      className="px-4 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: '#9aa0a6', fontFamily: '"Poppins", system-ui, -apple-system, sans-serif' }}
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
                    className="flex w-full items-center justify-between gap-3 px-3 mx-1.5 py-2 text-left rounded-[8px]"
                    style={{
                      width: 'calc(100% - 12px)',
                      background: isActive ? '#f1f3f4' : 'transparent',
                      color: '#202124',
                      fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
                      transition: 'background-color 100ms ease',
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {item.icon ? <span className="shrink-0 opacity-60">{item.icon}</span> : null}
                      <span className="truncate text-[13px] font-medium tracking-[-0.003em]">
                        {item.title}
                      </span>
                    </div>
                    {item.hint ? (
                      <span
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-[0.03em]"
                        style={{
                          background: '#f8f9fa',
                          border: '1px solid #e8eaed',
                          color: '#5f6368',
                          fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
                        }}
                      >
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
