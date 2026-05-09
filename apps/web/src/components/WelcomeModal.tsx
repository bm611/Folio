import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Cancel01Icon,
  SparklesIcon,
  KeyboardIcon,
  LayoutGridIcon,
  ZapIcon,
  CloudUploadIcon,
  Chat01Icon,
  StickyNoteIcon,
} from '@hugeicons/core-free-icons'
import Icon from './Icon'

interface WelcomeModalProps {
  open: boolean
  onClose: () => void
  onGetStarted: () => void
}

function TipItem({
  icon: IconComponent,
  title,
  description,
	}: {
	  icon: IconSvgElement
	  title: string
	  description: string
	}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="flex gap-3.5 p-3.5 rounded-[10px]"
      style={{ background: '#f8f9fa' }}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-[8px] flex items-center justify-center"
        style={{ background: 'var(--accent)' }}
      >
        <Icon icon={IconComponent} size={16} strokeWidth={2} style={{ color: 'var(--accent-text)' }} />
      </div>
      <div className="flex-1">
        <h3 className="text-[13px] font-semibold mb-0.5" style={{ color: '#202124', fontFamily: '"Poppins", system-ui, sans-serif' }}>
          {title}
        </h3>
        <p className="text-[12px] leading-relaxed" style={{ color: '#5f6368', fontFamily: '"Poppins", system-ui, sans-serif' }}>
          {description}
        </p>
      </div>
    </motion.div>
  )
}

export default function WelcomeModal({ open, onClose, onGetStarted }: WelcomeModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-[rgba(10,10,10,0.4)]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Folio"
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px]"
            style={{
              background: '#ffffff',
              border: '1px solid #e8eaed',
              boxShadow: '0 24px 60px -12px rgba(32,33,36,0.22), 0 4px 16px -4px rgba(32,33,36,0.08)',
              fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
            }}
          >
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 flex items-center justify-center rounded-[12px]"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Icon icon={SparklesIcon} size={20} strokeWidth={2} style={{ color: 'var(--accent-text)' }} />
                  </div>
                  <div>
                    <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.02em]" style={{ color: '#202124', fontFamily: '"Poppins", system-ui, sans-serif' }}>
                      Welcome to Folio
                    </h2>
                    <p className="text-[12.5px] mt-0.5" style={{ color: '#9aa0a6', fontFamily: '"Poppins", system-ui, sans-serif' }}>
                      Your notes, beautifully organised.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[#f1f3f4] active:scale-[0.92]"
                  style={{ color: '#5f6368', transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 150ms ease' }}
                  aria-label="Close"
                >
                  <Icon icon={Cancel01Icon} size={14} strokeWidth={1.5} />
                </button>
              </div>

              {/* Tips */}
              <div className="space-y-3 mb-8">
                <TipItem
                  icon={CloudUploadIcon}
                  title="Cloud Sync"
                  description="Your notes are automatically synced across all your devices."
                />
                <TipItem
                  icon={Chat01Icon}
                  title="AI Chat with Notes"
                  description="Chat with your notes to find information and get insights."
                />
                <TipItem
                  icon={StickyNoteIcon}
                  title="Templates"
                  description="Start with pre-built templates for meetings, projects, and more."
                />
                <TipItem
                  icon={KeyboardIcon}
                  title="Lightning Fast Commands"
                  description="Press Cmd+K to open the command palette for quick actions."
                />
                <TipItem
                  icon={LayoutGridIcon}
                  title="Slash Commands"
                  description="Type / on a new line to insert callouts, tables, tasks, and more."
                />
                <TipItem
                  icon={ZapIcon}
                  title="Markdown Power"
                  description="Full markdown support with bold, italic, code blocks, and nested lists."
                />
              </div>

              {/* Actions */}
              <button
                type="button"
                onClick={handleGetStarted}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full h-11 text-[14px] font-medium active:scale-[0.97]"
                style={{
                  background: '#1a73e8',
                  color: '#ffffff',
                  fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
                  transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 150ms ease',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1765cc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1a73e8')}
              >
                <Icon icon={SparklesIcon} size={14} strokeWidth={2} />
                Get Started
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
