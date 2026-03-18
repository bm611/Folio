import { useMemo } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { Sun01Icon, Coffee01Icon, Target01Icon, FireIcon, RocketIcon, CometIcon, Moon02Icon } from '@hugeicons/core-free-icons'
import Icon from './Icon'

const DAY_THEMES = [
  {
    day: 'Sunday',
    greeting: 'Restful Sunday',
    message: 'Take a breath and reflect on the week.',
    icon: Moon02Icon,
    color: 'var(--color-h2)',
  },
  {
    day: 'Monday',
    greeting: 'Fresh Monday',
    message: "A new week stands before you. Let's get to work.",
    icon: Coffee01Icon,
    color: 'var(--success)',
  },
  {
    day: 'Tuesday',
    greeting: 'Focused Tuesday',
    message: 'Keep the momentum going.',
    icon: Target01Icon,
    color: 'var(--color-h3)',
  },
  {
    day: 'Wednesday',
    greeting: 'Hump Day Wednesday',
    message: 'Halfway there. Keep pushing forward.',
    icon: FireIcon,
    color: 'var(--warning)',
  },
  {
    day: 'Thursday',
    greeting: 'Pre-Friday Thursday',
    message: 'The weekend is almost in sight.',
    icon: RocketIcon,
    color: 'var(--color-h2)',
  },
  {
    day: 'Friday',
    greeting: 'Fabulous Friday',
    message: 'Finish out the week strong.',
    icon: CometIcon,
    color: 'var(--accent)',
  },
  {
    day: 'Saturday',
    greeting: 'Joyful Saturday',
    message: 'Time to enjoy and recharge.',
    icon: Sun01Icon,
    color: 'var(--warning)',
  },
]

export default function DailyHeader({ note }) {
  const dayIndex = useMemo(() => {
    if (!note?.createdAt) return new Date().getDay()
    return new Date(note.createdAt).getDay()
  }, [note])

  const theme = DAY_THEMES[dayIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${theme.color} 12%, var(--bg-surface)), var(--bg-surface))`,
      }}
    >
      <div
        className="absolute top-0 right-0 p-8 pointer-events-none transform translate-x-4 -translate-y-4"
        style={{ color: theme.color, opacity: 0.08 }}
      >
        <Icon icon={theme.icon} size={120} stroke={1} />
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <div
          className="p-3 rounded-full backdrop-blur-md shadow-sm"
          style={{
            background: `color-mix(in srgb, ${theme.color} 10%, var(--bg-elevated))`,
            border: `1px solid color-mix(in srgb, ${theme.color} 15%, transparent)`,
            color: theme.color,
          }}
        >
          <Icon icon={theme.icon} size={24} stroke={1.5} />
        </div>
        <div>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: theme.color }}
          >
            {theme.greeting}
          </h2>
          <p className="text-[13px] font-medium text-[var(--text-muted)] mt-0.5">
            {theme.message}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
