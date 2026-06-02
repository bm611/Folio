import type { CSSProperties } from 'react'

/**
 * "Slate & Clay" — the editorial entry/home identity for Folio.
 *
 * A fresh re-anchor of the older warm-paper "Quiet" look: cool oat paper,
 * slate-blue ink (replacing the warm brown-black), and a single clay accent
 * for warmth against the cool ink. Display headings use Fraunces
 * (var(--font-folio-display)); body/UI stays on the Google Sans stack.
 *
 * Applied as an inline scope on both HomeScreen and LandingPage so the two
 * surfaces read as one app regardless of the user's saved theme. The editor
 * keeps its own Merriweather note-title token, untouched.
 */
export const FOLIO_SCOPE: CSSProperties = {
  ['--bg-primary' as string]: '#f5f5f2',
  ['--bg-surface' as string]: '#eceae3',
  ['--bg-elevated' as string]: '#fcfcfa',
  ['--bg-hover' as string]: '#e6e4db',
  ['--bg-deep' as string]: '#ddd9cf',
  ['--ink' as string]: '#20242b',
  ['--ink-soft' as string]: '#474d56',
  ['--text-primary' as string]: '#20242b',
  ['--text-secondary' as string]: '#474d56',
  ['--text-muted' as string]: '#868a8f',
  ['--text-inverse' as string]: '#f5f5f2',
  ['--border-subtle' as string]: '#e6e3da',
  ['--border-default' as string]: '#d4d0c5',
  ['--accent' as string]: '#b0533c',
  ['--accent-hover' as string]: '#8f4330',
  ['--accent-text' as string]: '#f5f5f2',
  ['--accent-soft' as string]: '#f0e1da',
  ['--success' as string]: '#5c7257',
  ['--warning' as string]: '#9a7a42',
  ['--danger' as string]: '#a4554a',
  background: '#f5f5f2',
  color: '#20242b',
  fontFamily:
    '"Google Sans", "Google Sans Text", "Product Sans", "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif',
}
