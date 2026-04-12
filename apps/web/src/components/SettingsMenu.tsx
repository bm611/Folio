import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

import {
  CloudSavingDone01Icon,
  AlertCircleIcon,
  Loading01Icon,
  Sun01Icon,
  Settings02Icon,
  TextFontIcon,
  ArrowRight01Icon,
  Tick01Icon,
  ExpandIcon,
  SunCloud02Icon,
  Moon02Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

import Icon from './Icon'
import AccentPicker from './AccentPicker'
import { FONT_OPTIONS } from '../config/fonts'

/* ── Types ──────────────────────────────────────────────────── */

interface SyncStatus {
  state: string
  error?: string | null
}

interface SettingsMenuProps {
  theme: string
  onSetTheme: (theme: string) => void
  accentId: string
  onAccentChange: (id: string) => void
  syncing: boolean
  syncStatus?: SyncStatus
  onSync: () => void
  fontId: string
  onFontChange: (id: string) => void
  wideMode?: boolean
  onWideModeChange?: (wide: boolean) => void
  className?: string
}

/* ── Sync state → icon + label ──────────────────────────────── */

function getSyncMeta(syncing: boolean, syncStatus?: SyncStatus): {
  icon: IconSvgElement
  color: string
  label: string
  spinning: boolean
} {
  const state = syncStatus?.state

  if (state === 'error') {
    return { icon: AlertCircleIcon, color: 'var(--danger)', label: 'Sync failed', spinning: false }
  }
  if (syncing || state === 'syncing') {
    return { icon: Loading01Icon, color: 'var(--success)', label: 'Syncing', spinning: true }
  }
  if (state === 'saved') {
    return { icon: CloudSavingDone01Icon, color: 'var(--success)', label: 'Synced', spinning: false }
  }
  if (state === 'offline') {
    return { icon: CloudSavingDone01Icon, color: 'var(--warning)', label: 'Offline', spinning: false }
  }
  return { icon: CloudSavingDone01Icon, color: 'var(--text-muted)', label: 'Sync', spinning: false }
}

/* ── Shared constants ───────────────────────────────────────── */

const ICON_WRAP = 'settings-icon-wrap'
const POPOVER_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const
const POPOVER_VARIANTS = {
  hidden: { opacity: 0, y: -8, filter: 'blur(4px)', scale: 0.98 },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 },
  exit: { opacity: 0, y: -6, filter: 'blur(2px)', scale: 0.985 },
} as const

/* ── Font Picker Popover (portaled to body) ─────────────────── */

interface FontPopoverProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>
  fontId: string
  onFontChange: (id: string) => void
  onClose: () => void
}

function FontPopover({ anchorRef, fontId, onFontChange, onClose }: FontPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 6, left: rect.left })
  }, [anchorRef])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const inPopover = popoverRef.current?.contains(e.target as Node)
      const inAnchor = anchorRef.current?.contains(e.target as Node)
      if (!inPopover && !inAnchor) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [anchorRef, onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const activeFont = FONT_OPTIONS.find((o) => o.id === fontId) ?? FONT_OPTIONS[0]!

  return createPortal(
    <motion.div
      ref={popoverRef}
      data-settings-font-popover
      className="fixed z-[9999] w-52 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5 animate-ctx-fade-in"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={POPOVER_VARIANTS}
      transition={POPOVER_TRANSITION}
      style={{
        top: pos.top,
        left: pos.left,
        boxShadow: 'var(--dialog-shadow)',
        fontFamily: '"Outfit", sans-serif',
        transformOrigin: 'top left',
      }}
    >
      <p className="mb-1 px-2.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] select-none">
        {activeFont.name}
      </p>
      <div className="grid gap-0.5">
        {FONT_OPTIONS.map((option) => {
          const isActive = option.id === fontId
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onFontChange(option.id)}
              className="settings-font-option"
              data-active={isActive || undefined}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: option.value,
              }}
            >
              <span>{option.name}</span>
              {isActive && (
                <Icon icon={Tick01Icon} size={15} strokeWidth={2} className="text-[var(--accent)]" />
              )}
            </button>
          )
        })}
      </div>
    </motion.div>,
    document.body,
  )
}

/* ── Main Settings Menu ─────────────────────────────────────── */

export default function SettingsMenu({
  theme,
  onSetTheme,
  accentId,
  onAccentChange,
  syncing,
  syncStatus,
  onSync,
  fontId,
  onFontChange,
  wideMode,
  onWideModeChange,
  className = '',
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const fontBtnRef = useRef<HTMLButtonElement>(null)

  const syncMeta = useMemo(() => getSyncMeta(syncing, syncStatus), [syncing, syncStatus])
  const activeFont = FONT_OPTIONS.find((o) => o.id === fontId) ?? FONT_OPTIONS[0]!

  const closeMenu = useCallback(() => {
    setOpen(false)
    setFontOpen(false)
  }, [])

  const closeFontPopover = useCallback(() => setFontOpen(false), [])

  /* Close panel on outside click — careful to exclude portaled popovers */
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node

      // Inside the settings container itself — don't close
      if (containerRef.current?.contains(target)) return

      // Inside the portaled font popover — don't close
      const fontPopover = document.querySelector('[data-settings-font-popover]')
      if (fontPopover?.contains(target)) return

      // Inside the portaled accent popover — don't close
      const accentPopover = document.querySelector('[data-accent-popover]')
      if (accentPopover?.contains(target)) return

      closeMenu()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fontOpen) {
          setFontOpen(false)
          return
        }
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, fontOpen, closeMenu])

  /* Auto-focus on open */
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLButtonElement>('[data-settings-autofocus="true"]')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  return (
    <div ref={containerRef} className={`relative hidden md:block ${className}`}>
      {/* ── Trigger button ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => (open ? closeMenu() : setOpen(true))}
        className="glass-icon relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out hover:text-[var(--text-primary)] after:absolute after:-inset-2 active:scale-[0.96]"
        title="Settings"
        aria-label="Open settings"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon icon={Settings02Icon} size={19} strokeWidth={1.8} />
      </button>

      {/* ── Dropdown panel ──────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            ref={panelRef}
            className="absolute right-0 top-11 z-50 w-64 overflow-visible rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={POPOVER_VARIANTS}
            transition={POPOVER_TRANSITION}
            style={{ boxShadow: 'var(--dialog-shadow)', fontFamily: '"Outfit", sans-serif', transformOrigin: 'top right' }}
          >
            <div className="settings-menu-body">
            {/* ── Accent ───────────────────────────────────── */}
            <AccentPicker
              accentId={accentId}
              onAccentChange={onAccentChange}
              theme={theme}
              showLabel
              hideName
              className="w-full"
              label="Accent"
            />

            {/* ── Theme ────────────────────────────────────── */}
            <div className="settings-item" data-settings-autofocus="true">
              <span className={ICON_WRAP}>
                <span className="relative flex h-[18px] w-[18px] items-center justify-center">
                  <motion.span className="absolute inset-0 flex items-center justify-center" initial={false}
                    animate={{ opacity: theme === 'dark' ? 1 : 0, scale: theme === 'dark' ? 1 : 0.3 }}
                    transition={POPOVER_TRANSITION}>
                    <Icon icon={Moon02Icon} size={18} strokeWidth={1.8} />
                  </motion.span>
                  <motion.span className="absolute inset-0 flex items-center justify-center" initial={false}
                    animate={{ opacity: theme === 'light' ? 1 : 0, scale: theme === 'light' ? 1 : 0.3 }}
                    transition={POPOVER_TRANSITION}>
                    <Icon icon={Sun01Icon} size={18} strokeWidth={1.8} />
                  </motion.span>
                  <motion.span className="absolute inset-0 flex items-center justify-center" initial={false}
                    animate={{ opacity: theme === 'playful' ? 1 : 0, scale: theme === 'playful' ? 1 : 0.3 }}
                    transition={POPOVER_TRANSITION}>
                    <Icon icon={SunCloud02Icon} size={18} strokeWidth={1.8} style={{ color: '#e8602a' }} />
                  </motion.span>
                </span>
              </span>
              <span className="settings-item-label">Theme</span>
              <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-0.5">
                {([
                  { id: 'dark',    icon: Moon02Icon,     label: 'Dark'    },
                  { id: 'light',   icon: Sun01Icon,     label: 'Light'   },
                  { id: 'playful', icon: SunCloud02Icon, label: 'Playful' },
                ] as const).map(({ id, icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    onClick={() => onSetTheme(id)}
                    className="relative flex h-[22px] w-[22px] items-center justify-center rounded-md transition-colors duration-150"
                    style={{
                      color: theme === id
                        ? (id === 'playful' ? '#e8602a' : 'var(--accent)')
                        : 'var(--text-muted)',
                      background: theme === id ? 'var(--glass-bg-hover)' : 'transparent',
                      boxShadow: theme === id ? 'var(--glass-glow)' : 'none',
                    }}
                  >
                    <Icon icon={icon} size={13} strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>

            {/* ── Font ─────────────────────────────────────── */}
            <button
              ref={fontBtnRef}
              type="button"
              onClick={() => setFontOpen((v) => !v)}
              className="settings-item"
              aria-expanded={fontOpen}
              aria-haspopup="listbox"
            >
              <span className={ICON_WRAP}>
                <Icon icon={TextFontIcon} size={18} strokeWidth={1.8} />
              </span>
              <span className="settings-item-label">{activeFont.name}</span>
              <Icon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} className="shrink-0 text-[var(--text-muted)]" />
            </button>

            {wideMode !== undefined && onWideModeChange && (
              <>
                {/* ── Wide Mode ────────────────────────────────── */}
                <button
                  type="button"
                  onClick={() => onWideModeChange(!wideMode)}
                  className="settings-item"
                >
                  <span className={ICON_WRAP}>
                    <Icon icon={ExpandIcon} size={18} strokeWidth={1.8} />
                  </span>
                  <span className="settings-item-label">Wide Mode</span>
                  <span className="ml-auto flex h-[18px] w-[32px] items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5 transition-colors duration-200"
                    style={{
                      backgroundColor: wideMode ? 'var(--accent)' : 'transparent',
                      borderColor: wideMode ? 'var(--accent)' : 'var(--border-subtle)',
                    }}
                  >
                    <motion.span
                      className="h-[12px] w-[12px] rounded-full bg-white shadow-sm"
                      animate={{ x: wideMode ? 14 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </span>
                </button>

                {/* ── Divider ──────────────────────────────────── */}
                <div className="settings-divider" />
              </>
            )}

            {/* ── Sync ─────────────────────────────────────── */}
            <button
              type="button"
              onClick={() => { onSync(); closeMenu() }}
              className="settings-item"
            >
              <span className={ICON_WRAP}>
                <Icon
                  icon={syncMeta.icon}
                  size={18}
                  strokeWidth={1.8}
                  className={syncMeta.spinning ? 'sync-spin' : ''}
                  style={{ color: syncMeta.color }}
                />
              </span>
              <span className="settings-item-label">{syncMeta.label}</span>
            </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Portaled Font Popover ───────────────────────────── */}
      <AnimatePresence initial={false}>
        {fontOpen && (
          <FontPopover
            anchorRef={fontBtnRef}
            fontId={fontId}
            onFontChange={(id) => {
              onFontChange(id)
              closeFontPopover()
            }}
            onClose={closeFontPopover}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
