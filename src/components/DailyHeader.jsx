import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { IconSun, IconCoffee, IconTarget, IconFlame, IconRocket, IconComet, IconMoonStars } from '@tabler/icons-react'

const DAY_THEMES = [
  {
    day: 'Sunday',
    greeting: 'Restful Sunday',
    message: 'Take a breath and reflect on the week.',
    icon: IconMoonStars,
    color: 'var(--color-h2)',
  },
  {
    day: 'Monday',
    greeting: 'Fresh Monday',
    message: "A new week stands before you. Let's get to work.",
    icon: IconCoffee,
    color: 'var(--success)',
  },
  {
    day: 'Tuesday',
    greeting: 'Focused Tuesday',
    message: 'Keep the momentum going.',
    icon: IconTarget,
    color: 'var(--color-h3)',
  },
  {
    day: 'Wednesday',
    greeting: 'Hump Day Wednesday',
    message: 'Halfway there. Keep pushing forward.',
    icon: IconFlame,
    color: 'var(--warning)',
  },
  {
    day: 'Thursday',
    greeting: 'Pre-Friday Thursday',
    message: 'The weekend is almost in sight.',
    icon: IconRocket,
    color: 'var(--color-h2)',
  },
  {
    day: 'Friday',
    greeting: 'Fabulous Friday',
    message: 'Finish out the week strong.',
    icon: IconComet,
    color: 'var(--accent)',
  },
  {
    day: 'Saturday',
    greeting: 'Joyful Saturday',
    message: 'Time to enjoy and recharge.',
    icon: IconSun,
    color: 'var(--warning)',
  },
]

export default function DailyHeader({ note }) {
  const dayIndex = useMemo(() => {
    if (!note?.createdAt) return new Date().getDay()
    return new Date(note.createdAt).getDay()
  }, [note])

  const theme = DAY_THEMES[dayIndex]
  const Icon = theme.icon

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
        <Icon size={120} stroke={1} />
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
          <Icon size={24} stroke={1.5} />
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
