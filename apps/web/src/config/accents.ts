// ─── Accent Color Palettes ──────────────────────────────────────────────────
// Each palette provides separate values for dark and light themes.
// `accent`      → --accent (primary interactive color)
// `accentHover` → --accent-hover (slightly lighter/brighter on hover)
// `colorH1`     → --color-h1 (heading level 1 — mirrors accent by convention)

export interface AccentThemeValues {
  accent: string
  accentHover: string
  colorH1: string
}

export interface AccentColor {
  id: string
  label: string
  dark: AccentThemeValues
  light: AccentThemeValues
}

export const ACCENT_COLORS: AccentColor[] = [
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
  {
    id: 'coral',
    label: 'Coral',
    dark:  { accent: '#e08a6a', accentHover: '#f0a080', colorH1: '#e08a6a' },
    light: { accent: '#c06040', accentHover: '#d47858', colorH1: '#c06040' },
  },
  {
    id: 'sky',
    label: 'Sky',
    dark:  { accent: '#6ab0e0', accentHover: '#80c4f0', colorH1: '#6ab0e0' },
    light: { accent: '#3a80b8', accentHover: '#5094cc', colorH1: '#3a80b8' },
  },
  {
    id: 'mauve',
    label: 'Mauve',
    dark:  { accent: '#c48abd', accentHover: '#d6a0d0', colorH1: '#c48abd' },
    light: { accent: '#9a5e94', accentHover: '#b070a8', colorH1: '#9a5e94' },
  },
  {
    id: 'mint',
    label: 'Mint',
    dark:  { accent: '#5ec4b0', accentHover: '#74d8c4', colorH1: '#5ec4b0' },
    light: { accent: '#389880', accentHover: '#4cae96', colorH1: '#389880' },
  },
  {
    id: 'peach',
    label: 'Peach',
    dark:  { accent: '#e0a080', accentHover: '#f0b494', colorH1: '#e0a080' },
    light: { accent: '#b87858', accentHover: '#cc8e6e', colorH1: '#b87858' },
  },
]
