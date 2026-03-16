import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { IconSun, IconCoffee, IconTarget, IconFlame, IconRocket, IconComet, IconMoonStars } from '@tabler/icons-react'

const DAY_THEMES = [
  {
    day: 'Sunday',
    greeting: 'Restful Sunday',
    message: 'Take a breath and reflect on the week.',
    icon: IconMoonStars,
    gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    accent: 'text-purple-600 dark:text-purple-400',
  },
  {
    day: 'Monday',
    greeting: 'Fresh Monday',
    message: "A new week stands before you. Let's get to work.",
    icon: IconCoffee,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    day: 'Tuesday',
    greeting: 'Focused Tuesday',
    message: 'Keep the momentum going.',
    icon: IconTarget,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    day: 'Wednesday',
    greeting: 'Hump Day Wednesday',
    message: 'Halfway there. Keep pushing forward.',
    icon: IconFlame,
    gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    accent: 'text-orange-600 dark:text-orange-400',
  },
  {
    day: 'Thursday',
    greeting: 'Pre-Friday Thursday',
    message: 'The weekend is almost in sight.',
    icon: IconRocket,
    gradient: 'from-indigo-500/20 via-blue-500/10 to-transparent',
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    day: 'Friday',
    greeting: 'Fabulous Friday',
    message: 'Finish out the week strong.',
    icon: IconComet,
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    accent: 'text-rose-600 dark:text-rose-400',
  },
  {
    day: 'Saturday',
    greeting: 'Joyful Saturday',
    message: 'Time to enjoy and recharge.',
    icon: IconSun,
    gradient: 'from-yellow-500/20 via-orange-500/10 to-transparent',
    accent: 'text-yellow-600 dark:text-yellow-400',
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
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} border border-[var(--border-subtle)] p-6 mb-6`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
        <Icon size={120} stroke={1} />
      </div>
      
      <div className="relative z-10 flex items-center gap-4">
        <div className={`p-3 rounded-full bg-white/60 dark:bg-black/20 backdrop-blur-md shadow-sm border border-white/20 dark:border-white/5 ${theme.accent}`}>
          <Icon size={24} stroke={1.5} />
        </div>
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${theme.accent}`} style={{ fontFamily: 'var(--font-display)' }}>
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
