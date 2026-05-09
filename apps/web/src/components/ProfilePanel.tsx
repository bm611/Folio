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
      className="absolute right-0 top-[calc(100%+6px)] z-50 w-80 overflow-hidden rounded-[16px]"
      style={{
        background: '#ffffff',
        border: '1px solid #e8eaed',
        boxShadow: '0 8px 24px -8px rgba(32,33,36,0.16), 0 2px 8px -2px rgba(32,33,36,0.08)',
        fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#e8eaed', background: '#f8f9fa' }}>
        <div
          className="flex items-center justify-center w-11 h-11 flex-shrink-0 overflow-hidden rounded-full text-white font-semibold text-[15px]"
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
          <div className="font-semibold text-[13.5px] truncate" style={{ color: '#202124' }}>
            {user.user_metadata?.display_name || user.email?.split('@')[0]}
          </div>
          <div className="text-[11.5px] truncate mt-0.5" style={{ color: '#5f6368' }}>{user.email}</div>
        </div>
      </div>

      {/* Email (read-only) */}
      <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: '#e8eaed' }}>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] mb-1.5" style={{ color: '#9aa0a6' }}>Email</div>
        <div className="text-[12px] px-3 py-2 rounded-[8px]" style={{ background: '#f8f9fa', color: '#5f6368' }}>
          {user.email}
        </div>
      </div>

      {/* Display name */}
      <div className="px-5 pt-4 pb-4 border-b" style={{ borderColor: '#e8eaed' }}>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] mb-1.5" style={{ color: '#9aa0a6' }}>Display name</div>
        <div className="flex gap-2">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Your name"
            className="flex-1 h-9 px-3 rounded-[8px] text-[12.5px] outline-none transition-colors"
            style={{
              border: '1px solid #e8eaed',
              background: '#ffffff',
              color: '#202124',
              fontFamily: '"Poppins", system-ui, sans-serif',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#1a73e8'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.12)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e8eaed'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 flex-shrink-0 rounded-[8px] text-[12px] font-medium transition-colors active:scale-[0.96]"
            style={{
              background: saveState === 'saved' ? 'rgba(30,142,62,0.1)' : '#f1f3f4',
              color: saveState === 'saved' ? '#1e8e3e' : saveState === 'error' ? '#d93025' : '#5f6368',
              border: 'none',
              fontFamily: '"Poppins", system-ui, sans-serif',
              transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = '#e8eaed')}
            onMouseLeave={(e) => (e.currentTarget.style.background = saveState === 'saved' ? 'rgba(30,142,62,0.1)' : '#f1f3f4')}
          >
            {saveState === 'saved' ? '✓ Saved' : saveState === 'error' ? 'Error' : saving ? '…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div className="px-5 py-4">
        <button
          type="button"
          onClick={signOut}
          className="inline-flex w-full h-9 items-center justify-center rounded-full text-[12.5px] font-medium active:scale-[0.97]"
          style={{
            border: '1px solid rgba(217,48,37,0.3)',
            color: '#d93025',
            background: 'transparent',
            fontFamily: '"Poppins", system-ui, sans-serif',
            transition: 'background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(217,48,37,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Sign out
        </button>
      </div>
    </motion.div>
  )
}
