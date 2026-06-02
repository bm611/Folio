import {
  Add01Icon,
  CloudUploadIcon,
  HardDriveIcon,
  PenTool01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'

import Icon from './Icon'
import { FOLIO_SCOPE } from './folioScope'

interface LandingPageProps {
  onStart: () => void
  onSignIn: () => void
}

const BEATS = [
  {
    icon: HardDriveIcon,
    title: 'Local-first',
    body: 'Your notes are written to this device first. Folio works offline, and nothing leaves until you ask it to.',
  },
  {
    icon: SparklesIcon,
    title: 'Ask your notes',
    body: 'Built-in AI chat reads across what you have written, so you can find a thread or pick up a draft by asking.',
  },
  {
    icon: PenTool01Icon,
    title: 'Calm by design',
    body: 'A quiet, rich-text editor with slash commands and Markdown — made for daily writing, not for getting in the way.',
  },
]

export default function LandingPage({ onStart, onSignIn }: LandingPageProps) {
  return (
    <main className="folio-landing" style={FOLIO_SCOPE}>
      <div className="folio-landing-shell">
        <header className="folio-landing-masthead">
          <span className="folio-landing-wordmark">Folio</span>
          <span className="folio-landing-tag">Local-first notes</span>
        </header>

        <section className="folio-landing-hero">
          <p className="folio-landing-eyebrow">A home for everything you write</p>
          <h1 className="folio-landing-headline">
            Write it down. <em>Keep it yours.</em>
          </h1>
          <p className="folio-landing-lede">
            Folio is a calm, local-first notebook for notes, drafts, and daily
            writing — with optional cloud sync and an AI that actually knows
            what you have written.
          </p>

          <div className="folio-landing-actions">
            <button
              type="button"
              onClick={onStart}
              className="quiet-action quiet-action--primary folio-landing-cta"
            >
              <Icon icon={Add01Icon} size={16} strokeWidth={1.8} />
              Start writing
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="quiet-action folio-landing-cta"
            >
              <Icon icon={CloudUploadIcon} size={16} strokeWidth={1.8} />
              Sign in to sync
            </button>
          </div>
          <p className="folio-landing-note">No account needed — a blank page opens straight away.</p>
        </section>

        <section className="folio-landing-beats" aria-label="What Folio is">
          {BEATS.map((beat) => (
            <article key={beat.title} className="folio-landing-beat">
              <span className="folio-landing-beat-icon" aria-hidden>
                <Icon icon={beat.icon} size={18} strokeWidth={1.7} />
              </span>
              <h2 className="folio-landing-beat-title">{beat.title}</h2>
              <p className="folio-landing-beat-body">{beat.body}</p>
            </article>
          ))}
        </section>

        <footer className="folio-landing-footer">
          <span>Folio</span>
          <span className="folio-landing-footer-dot" aria-hidden>·</span>
          <span>Local-first</span>
          <span className="folio-landing-footer-dot" aria-hidden>·</span>
          <span>Optional sync</span>
        </footer>
      </div>
    </main>
  )
}
