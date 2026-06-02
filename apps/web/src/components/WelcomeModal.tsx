import { useCallback, useEffect } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'

import Icon from './Icon'

interface WelcomeModalProps {
  open: boolean
  onClose: () => void
  onGetStarted: () => void
}

export default function WelcomeModal({ open, onClose, onGetStarted }: WelcomeModalProps) {
  useEffect(() => {
    if (!open) return undefined

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleGetStarted = useCallback(() => {
    onGetStarted()
    onClose()
  }, [onGetStarted, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(38, 35, 31, 0.18)' }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Start writing"
            className="fixed left-1/2 top-1/2 z-[101] w-[calc(100vw-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 18px 48px rgba(38,35,31,0.10)',
              fontFamily: 'var(--body-font)',
            }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="quiet-label">Folio</p>
                  <h2 className="m-0 text-[28px] font-normal leading-[1.05]" style={{ color: 'var(--ink)' }}>
                    Ready to write.
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="quiet-icon-btn"
                  aria-label="Close"
                >
                  <Icon icon={Cancel01Icon} size={14} strokeWidth={1.7} />
                </button>
              </div>

              <p className="mt-5 mb-6 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Your notes are saved locally first. Keep the starter pages, rename them, or delete them.
              </p>

              <button
                type="button"
                onClick={handleGetStarted}
                className="quiet-action quiet-action--primary w-full"
              >
                <Icon icon={Add01Icon} size={15} strokeWidth={1.8} />
                Start
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
