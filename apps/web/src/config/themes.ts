export interface ThemeConfig {
  id: string
  label: string
  mode: 'dark' | 'light'
  group: string
  bg: string
  surface: string
  accent: string
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    mode: 'light',
    group: 'Aura',
    bg: '#fbfaf7',
    surface: '#fffefa',
    accent: '#5f574d',
  },
]
