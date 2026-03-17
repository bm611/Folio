import { useState, useRef, useEffect } from 'react'
import { ACCENT_COLORS } from '../config/accents'

export default function AccentPicker({ accentId, onAccentChange, theme, mobile = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const current = ACCENT_COLORS.find((a) => a.id === accentId) || ACCENT_COLORS[0]
  const currentSwatch = (theme === 'light' ? current.light : current.dark).accent

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Desktop trigger: matches the other top-bar icon buttons
  // Mobile trigger: explicit 40×40 circle — matches what .mobile-action-bar-inner button CSS produces
  const triggerClassName = mobile
    ? 'relative flex h-10 w-10 items-center justify-center rounded-full border-none bg-transparent p-0 text-[var(--text-muted)] cursor-pointer after:absolute after:-inset-4 active:scale-90'
    : 'hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.97]'

  // Desktop: drops down from top bar. Mobile: pops up from bottom bar, centered over button.
  const dropdownClassName = mobile
    ? 'absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5 animate-ctx-fade-in'
    : 'absolute right-0 top-full mt-1.5 z-50 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5 animate-ctx-fade-in'

  return (
    <div ref={containerRef} className={`relative ${mobile ? 'flex items-center justify-center' : ''} ${className}`}>
      {/* Trigger ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
        title="Accent color"
        aria-label="Change accent color"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className="h-[14px] w-[14px] rounded-full ring-1 ring-black/10 transition-[background-color] duration-200"
          style={{ backgroundColor: currentSwatch }}
        />
      </button>

      {/* Dropdown panel ──────────────────────────────────────── */}
      {open && (
        <div
          role="listbox"
          aria-label="Accent color options"
          className={dropdownClassName}
          style={{ boxShadow: 'var(--dialog-shadow)', minWidth: '188px' }}
        >
          {/* Label */}
          <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] select-none">
            Accent
          </p>

          {/* Swatches */}
          <div className="flex gap-0.5">
            {ACCENT_COLORS.map((color) => {
              const swatch = (theme === 'light' ? color.light : color.dark).accent
              const isActive = color.id === accentId

              return (
                <button
                  key={color.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onAccentChange(color.id)
                    setOpen(false)
                  }}
                  className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors duration-100 hover:bg-[var(--bg-hover)] active:scale-95"
                  title={color.label}
                >
                  {/* Circle with active ring */}
                  <span
                    className="h-5 w-5 rounded-full transition-[box-shadow] duration-150 ring-1 ring-black/10"
                    style={{
                      backgroundColor: swatch,
                      boxShadow: isActive
                        ? `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${swatch}`
                        : undefined,
                    }}
                  />
                  {/* Name */}
                  <span
                    className="text-[9px] leading-none transition-colors duration-100"
                    style={{ color: isActive ? swatch : 'var(--text-muted)' }}
                  >
                    {color.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
