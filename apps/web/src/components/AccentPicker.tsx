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
  const currentSwatch = current.light.accent
  void theme

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
    ? 'relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e8eaed] bg-[var(--bg-surface)] p-0 cursor-pointer transition-transform duration-150 active:scale-[0.96]'
    : desktopClasses
  const dropdownBaseClassName = 'fixed z-[9999] rounded-[12px] bg-white p-3'

  const handleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      if (mobile) {
        // Pop up above the button, centered
        setDropdownPos({ bottom: window.innerHeight - rect.top + 12, left: rect.left + rect.width / 2 })
      } else {
        // Drop down by default; flip upward if the popover would go off the bottom of the viewport
        const estimatedHeight = 160 // approx popover height with 2 rows of colors
        const spaceBelow = window.innerHeight - rect.bottom - 8
        if (spaceBelow < estimatedHeight) {
          setDropdownPos({ bottom: window.innerHeight - rect.top + 6, right: window.innerWidth - rect.right })
        } else {
          setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
        }
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
                className="h-[14px] w-[14px] rounded-full transition-[background-color] duration-150"
                style={{ backgroundColor: currentSwatch }}
              />
            </span>
            <span className="settings-item-label">{label}</span>
          </>
        ) : (
          <span
            className="h-[14px] w-[14px] rounded-full shrink-0"
            style={{ backgroundColor: currentSwatch }}
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
                boxShadow: '0 8px 24px -8px rgba(32,33,36,0.16), 0 2px 8px -2px rgba(32,33,36,0.08)',
                border: '1px solid #e8eaed',
                minWidth: '208px',
                transformOrigin: mobile
                  ? 'bottom center'
                  : dropdownPos.bottom !== undefined
                    ? 'bottom right'
                    : 'top right',
                ...(mobile
                  ? { bottom: dropdownPos.bottom, left: dropdownPos.left, x: '-50%' }
                  : dropdownPos.bottom !== undefined
                    ? { bottom: dropdownPos.bottom, right: dropdownPos.right }
                    : { top: dropdownPos.top, right: dropdownPos.right }),
              }}
            >
              <p className="mb-2 px-0.5 text-[10.5px] font-semibold uppercase tracking-[0.07em]" style={{ color: '#5f6368', fontFamily: '"Poppins", system-ui, sans-serif' }}>Accent</p>

              <div className="grid grid-cols-4 gap-2">
                {ACCENT_COLORS.map((color: AccentColor) => {
                  const swatch = color.light.accent
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
                      className="group flex flex-col items-center gap-1 px-1 py-1 rounded-[6px] hover:bg-[#f1f3f4] active:scale-[0.94] transition-transform duration-100"
                      title={color.label}
                    >
                      <span
                        className="h-7 w-7 rounded-full"
                        style={{
                          backgroundColor: swatch,
                          outline: isActive ? `2.5px solid ${swatch}` : 'none',
                          outlineOffset: '2px',
                          boxShadow: isActive ? `0 0 0 3px rgba(0,0,0,0.08)` : 'none',
                        }}
                      />
                      {!hideName && (
                        <span
                          className="text-[9px] leading-none uppercase tracking-wider"
                          style={{ color: isActive ? '#202124' : '#9aa0a6', fontFamily: '"Poppins", system-ui, sans-serif' }}
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
