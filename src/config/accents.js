// ─── Accent Color Palettes ──────────────────────────────────────────────────
// Each palette provides separate values for dark and light themes.
// `accent`      → --accent (primary interactive color)
// `accentHover` → --accent-hover (slightly lighter/brighter on hover)
// `colorH1`     → --color-h1 (heading level 1 — mirrors accent by convention)

export const ACCENT_COLORS = [
  {
    id: 'rose',
    label: 'Rose',
    dark:  { accent: '#e07a8a', accentHover: '#f0909f', colorH1: '#e07a8a' },
    light: { accent: '#c4566a', accentHover: '#d87080', colorH1: '#c4566a' },
  },
  {
    id: 'lavender',
    label: 'Lavender',
    dark:  { accent: '#a893ce', accentHover: '#bcabdf', colorH1: '#a893ce' },
    light: { accent: '#7a5ea8', accentHover: '#9070bf', colorH1: '#7a5ea8' },
  },
  {
    id: 'teal',
    label: 'Teal',
    dark:  { accent: '#5ea8c8', accentHover: '#74c2e0', colorH1: '#5ea8c8' },
    light: { accent: '#3a7a9c', accentHover: '#4e8fb5', colorH1: '#3a7a9c' },
  },
  {
    id: 'amber',
    label: 'Amber',
    dark:  { accent: '#d4a24e', accentHover: '#e8b860', colorH1: '#d4a24e' },
    light: { accent: '#a07830', accentHover: '#b88c40', colorH1: '#a07830' },
  },
  {
    id: 'sage',
    label: 'Sage',
    dark:  { accent: '#7abc8a', accentHover: '#8ed0a0', colorH1: '#7abc8a' },
    light: { accent: '#4a8a60', accentHover: '#5da070', colorH1: '#4a8a60' },
  },
]
