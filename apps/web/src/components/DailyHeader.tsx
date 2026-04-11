import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sun01Icon, Coffee01Icon, Target01Icon, FireIcon, RocketIcon, CometIcon, Moon02Icon } from '@hugeicons/core-free-icons'

import type { IconSvgElement } from '@hugeicons/react'

import type { TreeNode } from '../types'
import Icon from './Icon'

interface DayTheme {
  day: string
  greeting: string
  message: string
  icon: IconSvgElement
  color: string
}

const DAY_THEMES: DayTheme[] = [
  {
    day: 'Sunday',
    greeting: 'Sunday Rest',
    message: 'Rest is part of the practice. What are you grateful for?',
    icon: Moon02Icon,
    color: 'var(--color-h2)',
  },
  {
    day: 'Monday',
    greeting: 'Monday Energy',
    message: 'New week, blank page. Make it count.',
    icon: Coffee01Icon,
    color: 'var(--success)',
  },
  {
    day: 'Tuesday',
    greeting: 'Tuesday Focus',
    message: "Yesterday's you already started. Keep going.",
    icon: Target01Icon,
    color: 'var(--color-h3)',
  },
  {
    day: 'Wednesday',
    greeting: 'Wednesday Momentum',
    message: "You're right in the middle of something great.",
    icon: FireIcon,
    color: 'var(--warning)',
  },
  {
    day: 'Thursday',
    greeting: 'Thursday Drive',
    message: "One day closer. Make today's words count.",
    icon: RocketIcon,
    color: 'var(--color-h2)',
  },
  {
    day: 'Friday',
    greeting: 'Friday Finish',
    message: 'End the week with something you are proud of.',
    icon: CometIcon,
    color: 'var(--accent)',
  },
  {
    day: 'Saturday',
    greeting: 'Saturday Space',
    message: 'Slow down. Write something just for you.',
    icon: Sun01Icon,
    color: 'var(--warning)',
  },
]

interface DailyHeaderProps {
  note: TreeNode
}

export default function DailyHeader({ note }: DailyHeaderProps) {
  const dayIndex = useMemo(() => {
    if (!note?.createdAt) return new Date().getDay()
    return new Date(note.createdAt).getDay()
  }, [note])

  const theme = DAY_THEMES[dayIndex]!

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
      className="relative mb-6 overflow-hidden rounded-2xl p-6"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${theme.color} 22%, var(--bg-surface)), var(--bg-surface))`,
        border: `1.5px solid color-mix(in srgb, ${theme.color} 28%, transparent)`,
        boxShadow: `0 20px 44px rgba(0, 0, 0, 0.13), 0 1px 0 color-mix(in srgb, white 5%, transparent)`,
      }}
    >
      {/* Large background icon */}
      <div
        className="absolute top-0 right-0 p-7 pointer-events-none transform translate-x-4 -translate-y-3"
        style={{ color: theme.color, opacity: 0.07 }}
      >
        <Icon icon={theme.icon} size={130} stroke={1} />
      </div>

      {/* Spot illustration — floating orbs */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none select-none" aria-hidden="true">
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
          <motion.circle cx="34" cy="18" r="6"
            fill={theme.color} opacity={0.65}
            animate={{ y: [0, -5, 0], opacity: [0.65, 0.9, 0.65] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="18" cy="42" r="4"
            fill={theme.color} opacity={0.4}
            animate={{ y: [0, -4, 0], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
          <motion.circle cx="50" cy="46" r="3.5"
            fill={theme.color} opacity={0.35}
            animate={{ y: [0, -3, 0], opacity: [0.35, 0.58, 0.35] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }} />
          <motion.path
            d="M34 2 L36 10 L34 18 L32 10 Z M26 10 L34 8 L42 10 L34 12 Z"
            fill={theme.color} opacity={0.5}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '34px 10px' }} />
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <div
          className="rounded-2xl p-3.5 shrink-0"
          style={{
            background: `color-mix(in srgb, ${theme.color} 18%, var(--bg-elevated))`,
            border: `1.5px solid color-mix(in srgb, ${theme.color} 32%, transparent)`,
            color: theme.color,
            boxShadow: `0 8px 20px color-mix(in srgb, ${theme.color} 22%, transparent)`,
          }}
        >
          <Icon icon={theme.icon} size={26} stroke={1.5} />
        </div>
        <div>
          <h2
            className="text-[20px] font-bold tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: theme.color }}
          >
            {theme.greeting}
          </h2>
          <p
            className="text-[13px] font-medium mt-1 max-w-[300px] leading-relaxed"
            style={{ color: `color-mix(in srgb, ${theme.color} 75%, var(--text-muted))` }}
          >
            {theme.message}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
