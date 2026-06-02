import {
  Add01Icon,
  CloudUploadIcon,
  File01Icon,
  SidebarLeftIcon,
} from '@hugeicons/core-free-icons'

import Icon from './Icon'

interface LandingPageProps {
  onStart: () => void
  onSignIn: () => void
}

const previewNotes = ['Today', 'Reading', 'Drafts']

export default function LandingPage({ onStart, onSignIn }: LandingPageProps) {
  return (
    <main className="quiet-entry">
      <section className="quiet-entry-shell">
        <div className="quiet-entry-sidebar" aria-hidden>
          <div className="quiet-entry-brand">Folio</div>
          <div className="quiet-entry-side-row is-active">
            <Icon icon={File01Icon} size={13} strokeWidth={1.7} />
            Notes
          </div>
          {previewNotes.map((note) => (
            <div key={note} className="quiet-entry-side-row">
              <span />
              {note}
            </div>
          ))}
        </div>

        <div className="quiet-entry-page">
          <div className="quiet-entry-top">
            <Icon icon={SidebarLeftIcon} size={17} strokeWidth={1.7} />
            <span>Local notes</span>
          </div>

          <div className="quiet-entry-copy">
            <p className="quiet-label">Folio</p>
            <h1>Start with a blank page.</h1>
            <p>
              A calm local-first space for notes, drafts, and daily writing.
            </p>
          </div>

          <div className="quiet-entry-actions">
            <button type="button" onClick={onStart} className="quiet-action quiet-action--primary">
              <Icon icon={Add01Icon} size={15} strokeWidth={1.8} />
              Start writing
            </button>
            <button type="button" onClick={onSignIn} className="quiet-action">
              <Icon icon={CloudUploadIcon} size={15} strokeWidth={1.8} />
              Sign in
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
