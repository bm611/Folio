import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

interface ProfilePanelProps {
  onClose: () => void
}

export default function ProfilePanel({ onClose }: ProfilePanelProps) {
  const { user, signOut, updateDisplayName } = useAuth()
  const panelRef = useRef<HTMLDivElement>(null)

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''
  )
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handlePointerDown), 10)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSave() {
    if (saving || !displayName.trim()) return
    setSaving(true)
    try {
      await updateDisplayName(displayName)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const initial = user.email?.[0]?.toUpperCase() || '?'

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.13, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-0 top-[calc(100%+6px)] z-50 w-80 overflow-hidden rounded-lg"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 18px 48px rgba(38,35,31,0.10)',
        fontFamily: 'var(--body-font)',
      }}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div
          className="flex items-center justify-center w-11 h-11 flex-shrink-0 overflow-hidden rounded-md text-white font-semibold text-[15px]"
          style={{ background: 'var(--accent)' }}
        >
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[13.5px] truncate" style={{ color: 'var(--ink)' }}>
            {user.user_metadata?.display_name || user.email?.split('@')[0]}
          </div>
          <div className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="text-[10.5px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</div>
        <div className="text-[12px] px-3 py-2 rounded-md" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
          {user.email}
        </div>
      </div>

      <div className="px-5 pt-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="text-[10.5px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Display name</div>
        <div className="flex gap-2">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Your name"
            className="flex-1 h-9 px-3 rounded-md text-[12.5px] outline-none transition-colors"
            style={{
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              color: 'var(--ink)',
              fontFamily: 'var(--body-font)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 flex-shrink-0 rounded-md text-[12px] font-medium transition-colors active:scale-[0.96]"
            style={{
              background: saveState === 'saved' ? 'var(--success-muted)' : 'var(--bg-surface)',
              color: saveState === 'saved' ? 'var(--success)' : saveState === 'error' ? 'var(--danger)' : 'var(--text-secondary)',
              border: 'none',
              fontFamily: 'var(--body-font)',
              transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = saveState === 'saved' ? 'var(--success-muted)' : 'var(--bg-surface)')}
          >
            {saveState === 'saved' ? '✓ Saved' : saveState === 'error' ? 'Error' : saving ? '…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <button
          type="button"
          onClick={signOut}
          className="inline-flex w-full h-9 items-center justify-center rounded-md text-[12.5px] font-medium active:scale-[0.97]"
          style={{
            border: '1px solid color-mix(in srgb, var(--danger) 26%, var(--border-subtle))',
            color: 'var(--danger)',
            background: 'transparent',
            fontFamily: 'var(--body-font)',
            transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Sign out
        </button>
      </div>
    </motion.div>
  )
}
