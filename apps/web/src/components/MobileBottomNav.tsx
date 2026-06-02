import { motion } from 'framer-motion'

import {
  Add01Icon,
  Home01Icon,
  SparklesIcon,
  SidebarLeftIcon,
} from '@hugeicons/core-free-icons'

import Icon from './Icon'

interface MobileBottomNavProps {
  activeView: 'notes' | 'chat'
  onViewChange: (view: 'notes' | 'chat') => void
  onToggleSidebar: () => void
  onNewNote: () => void
}

export default function MobileBottomNav({
  activeView,
  onViewChange,
  onToggleSidebar,
  onNewNote,
}: MobileBottomNavProps) {
  return (
    <motion.div
      initial={{ y: 80, x: '-50%', opacity: 0 }}
      animate={{ y: 0, x: '-50%', opacity: 1 }}
      exit={{ y: 80, x: '-50%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 260 }}
      className="mobile-nav-bar"
    >
      {/* Sidebar toggle tab */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="mobile-nav-item"
        aria-label="Open sidebar menu"
      >
        <span className="mobile-nav-icon-wrap">
          <Icon icon={SidebarLeftIcon} size={20} strokeWidth={1.6} />
        </span>
        <span className="mobile-nav-label">Menu</span>
      </button>

      {/* Notes / Home tab */}
      <button
        type="button"
        onClick={() => onViewChange('notes')}
        className={`mobile-nav-item${activeView === 'notes' ? ' is-active' : ''}`}
        aria-label="View notes"
      >
        <span className="mobile-nav-icon-wrap">
          <Icon icon={Home01Icon} size={20} strokeWidth={1.6} />
        </span>
        <span className="mobile-nav-label">Notes</span>
      </button>

      {/* Central Floating Action Button (FAB) for New Note */}
      <div className="mobile-nav-fab-wrap">
        <motion.button
          type="button"
          onClick={onNewNote}
          whileTap={{ scale: 0.94 }}
          className="mobile-nav-fab"
          aria-label="Create new note"
        >
          <Icon icon={Add01Icon} size={24} strokeWidth={2.2} />
        </motion.button>
      </div>

      {/* AI Chat tab */}
      <button
        type="button"
        onClick={() => onViewChange('chat')}
        className={`mobile-nav-item${activeView === 'chat' ? ' is-active' : ''}`}
        aria-label="Ask AI Assistant"
      >
        <span className="mobile-nav-icon-wrap animate-pulse-subtle">
          <Icon icon={SparklesIcon} size={20} strokeWidth={1.6} />
        </span>
        <span className="mobile-nav-label">AI Chat</span>
      </button>
    </motion.div>
  )
}
