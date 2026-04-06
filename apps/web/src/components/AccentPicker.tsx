import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { ACCENT_COLORS, type AccentColor } from '../config/accents'

interface DropdownPos {
  top?: number
  left?: number
  bottom?: number
  right?: number
}

interface AccentPickerProps {
  accentId: string
  onAccentChange: (id: string) => void
  theme: string
  mobile?: boolean
  showLabel?: boolean
  className?: string
  label?: string
  hideName?: boolean
}

const POPOVER_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const
const POPOVER_VARIANTS = {
  hidden: { opacity: 0, y: -8, filter: 'blur(4px)', scale: 0.98 },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 },
  exit: { opacity: 0, y: -6, filter: 'blur(2px)', scale: 0.985 },
} as const

export default function AccentPicker({ accentId, onAccentChange, theme, mobile = false, showLabel = false, className = '', label = 'Accent', hideName = false }: AccentPickerProps) {
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const current = ACCENT_COLORS.find((a) => a.id === accentId) ?? ACCENT_COLORS[0]!
  const currentSwatch = (theme === 'light' ? current.light : current.dark).accent

  // Close on outside click — check both the trigger container and the portaled dropdown
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const inContainer = containerRef.current && containerRef.current.contains(e.target as Node)
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target as Node)
      if (!inContainer && !inDropdown) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // showLabel = compact sidebar-style row (inside settings menu)
  // default  = standalone top-bar icon button
  // mobile   = 40×40 circle for mobile action bar
  const desktopClasses = showLabel
    ? 'settings-item'
    : 'hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.96]'

  const triggerClassName = mobile
    ? 'relative flex h-10 w-10 items-center justify-center rounded-full border-none bg-transparent p-0 text-[var(--text-muted)] cursor-pointer transition-transform duration-150 ease-out after:absolute after:-inset-4 active:scale-[0.96]'
    : desktopClasses
  const dropdownBaseClassName = 'fixed z-[9999] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5'

  const handleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      if (mobile) {
        // Pop up above the button, centered
        setDropdownPos({ bottom: window.innerHeight - rect.top + 12, left: rect.left + rect.width / 2 })
      } else {
        // Drop down, aligned to the right edge of the button
        setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
      }
    }
    setOpen((v) => !v)
  }

  return (
    <div ref={containerRef} className={`relative ${mobile ? 'flex items-center justify-center' : ''} ${className}`}>
      {/* Trigger ─────────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={triggerClassName}
        title="Accent color"
        aria-label="Change accent color"
        aria-expanded={open}
        aria-haspopup="listbox"
        style={showLabel && !mobile ? { fontFamily: '"Outfit", sans-serif' } : undefined}
      >
        {showLabel && !mobile ? (
          <>
            <span className="settings-icon-wrap">
              <span
                className="h-[14px] w-[14px] rounded-full transition-[background-color,box-shadow] duration-200"
                style={{
                  backgroundColor: currentSwatch,
                  boxShadow: `0 0 0 1.5px var(--bg-surface), 0 0 0 3px ${currentSwatch}55`,
                }}
              />
            </span>
            <span className="settings-item-label">{label}</span>
          </>
        ) : (
          <span
            className="h-[14px] w-[14px] rounded-full transition-[background-color,box-shadow] duration-200 shrink-0"
            style={{
              backgroundColor: currentSwatch,
              boxShadow: `0 0 0 1.5px var(--bg-primary), 0 0 0 3px ${currentSwatch}55`,
            }}
          />
        )}
      </button>

      {/* Dropdown panel — portaled to body to escape overflow:hidden ancestors */}
      {createPortal(
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              ref={dropdownRef}
              role="listbox"
              aria-label="Accent color options"
              data-accent-popover
              className={dropdownBaseClassName}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={POPOVER_VARIANTS}
              transition={POPOVER_TRANSITION}
              style={{
                boxShadow: 'var(--dialog-shadow)',
                minWidth: '188px',
                transformOrigin: mobile ? 'bottom center' : 'top right',
                ...(mobile
                  ? { bottom: dropdownPos.bottom, left: dropdownPos.left, x: '-50%' }
                  : { top: dropdownPos.top, right: dropdownPos.right }),
              }}
            >
              <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] select-none">
                Accent
              </p>

              <div className="grid grid-cols-5 gap-0.5">
                {ACCENT_COLORS.map((color: AccentColor) => {
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
                      className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-1.5 transition-[transform,background-color] duration-100 ease-out hover:bg-[var(--bg-hover)] active:scale-[0.96]"
                      title={color.label}
                    >
                      <span
                        className="h-5 w-5 rounded-full transition-[box-shadow] duration-150 ring-1 ring-black/10"
                        style={{
                          backgroundColor: swatch,
                          boxShadow: isActive
                            ? `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${swatch}`
                            : undefined,
                        }}
                      />
                      {!hideName && (
                        <span
                          className="text-[9px] leading-none transition-colors duration-100"
                          style={{ color: isActive ? swatch : 'var(--text-muted)' }}
                        >
                          {color.label}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
