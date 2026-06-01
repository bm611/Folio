interface AccentThemeValues {
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

const swatch = (accent: string, accentHover: string): AccentColor['light'] => ({
  accent,
  accentHover,
  colorH1: '#26231f',
})

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: 'graphite',
    label: 'Graphite',
    dark: swatch('#5f574d', '#3d3933'),
    light: swatch('#5f574d', '#3d3933'),
  },
  {
    id: 'ink',
    label: 'Ink',
    dark: swatch('#26231f', '#171512'),
    light: swatch('#26231f', '#171512'),
  },
  {
    id: 'sage',
    label: 'Sage',
    dark: swatch('#66745f', '#485142'),
    light: swatch('#66745f', '#485142'),
  },
  {
    id: 'clay',
    label: 'Clay',
    dark: swatch('#87685b', '#604940'),
    light: swatch('#87685b', '#604940'),
  },
  {
    id: 'slate',
    label: 'Slate',
    dark: swatch('#65707a', '#434b52'),
    light: swatch('#65707a', '#434b52'),
  },
  {
    id: 'ochre',
    label: 'Ochre',
    dark: swatch('#8c744d', '#5f4f35'),
    light: swatch('#8c744d', '#5f4f35'),
  },
  {
    id: 'violet',
    label: 'Violet',
    dark: swatch('#70677f', '#50495e'),
    light: swatch('#70677f', '#50495e'),
  },
]
