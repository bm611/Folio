import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import {
  CloudSavingDone01Icon,
  AlertCircleIcon,
  Loading01Icon,
  Settings02Icon,
  ExpandIcon,
  Download01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

import Icon from './Icon'
import AccentPicker from './AccentPicker'

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
  onExport?: () => void
  className?: string
}

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

const ICON_WRAP = 'settings-icon-wrap'
const POPOVER_TRANSITION = { type: 'spring', duration: 0.18, bounce: 0 } as const
const POPOVER_VARIANTS = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
} as const

export default function SettingsMenu({
  accentId,
  onAccentChange,
  syncing,
  syncStatus,
  onSync,
  wideMode,
  onWideModeChange,
  onExport,
  className = '',
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const syncMeta = useMemo(() => getSyncMeta(syncing, syncStatus), [syncing, syncStatus])

  const closeMenu = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      const accentPopover = document.querySelector('[data-accent-popover]')
      if (accentPopover?.contains(target)) return
      closeMenu()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, closeMenu])

  return (
    <div ref={containerRef} className={`relative hidden md:block ${className}`}>
      <button
        type="button"
        onClick={() => (open ? closeMenu() : setOpen(true))}
        className="quiet-icon-btn"
        style={{
          fontFamily: 'var(--body-font)',
          transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 150ms ease',
        }}
        title="Settings"
        aria-label="Open settings"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon icon={Settings02Icon} size={13} strokeWidth={1.8} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            ref={panelRef}
            className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-lg"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={POPOVER_VARIANTS}
            transition={POPOVER_TRANSITION}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 18px 48px rgba(38,35,31,0.10)',
              fontFamily: 'var(--body-font)',
              transformOrigin: 'top right',
            }}
          >
            <div className="settings-menu-body">
              <AccentPicker
                accentId={accentId}
                onAccentChange={onAccentChange}
                theme="material"
                showLabel
                hideName
                className="w-full"
                label="Accent"
              />

              {wideMode !== undefined && onWideModeChange && (
                <>
                  <div className="settings-divider" />
                  <button
                    type="button"
                    onClick={() => onWideModeChange(!wideMode)}
                    className="settings-item"
                  >
                    <span className={ICON_WRAP}>
                      <Icon icon={ExpandIcon} size={16} strokeWidth={1.8} />
                    </span>
                    <span className="settings-item-label">Wide Mode</span>
                    <span
                      className="ml-auto flex h-[18px] w-[32px] items-center rounded-full p-0.5 transition-colors duration-200"
                      style={{ backgroundColor: wideMode ? 'var(--ink)' : 'var(--border-subtle)' }}
                    >
                      <motion.span
                        className="h-[14px] w-[14px] rounded-full bg-white"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                        animate={{ x: wideMode ? 14 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </span>
                  </button>
                </>
              )}

              {onExport && (
                <>
                  <div className="settings-divider" />
                  <button
                    type="button"
                    onClick={() => { onExport(); closeMenu() }}
                    className="settings-item"
                  >
                    <span className={ICON_WRAP}>
                      <Icon icon={Download01Icon} size={16} strokeWidth={1.8} />
                    </span>
                    <span className="settings-item-label">Export</span>
                  </button>
                </>
              )}

              <div className="settings-divider" />

              <button
                type="button"
                onClick={() => { onSync(); closeMenu() }}
                className="settings-item"
              >
                <span className={ICON_WRAP}>
                  <Icon
                    icon={syncMeta.icon}
                    size={16}
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
    </div>
  )
}
