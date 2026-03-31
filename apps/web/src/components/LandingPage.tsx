import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

import {
  ArrowRight01Icon,
  CloudIcon,
  SparklesIcon,
  LockPasswordIcon,
  WifiOff01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  PencilEdit01Icon,
  FireIcon,
  TextFontIcon,
} from '@hugeicons/core-free-icons';

import Icon from './Icon';

interface LandingPageProps {
  onStart: () => void;
  onSignIn: () => void;
}

// ─── Shared animation helpers ────────────────────────────────────────────────

const spring = { type: 'spring', duration: 0.55, bounce: 0 } as const;

function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FadeBlur({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ ...spring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mb-4 inline-block rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]"
    >
      {children}
    </span>
  );
}

// ─── Grain overlay (reused across sections) ──────────────────────────────────

const GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' fill='%23000'/%3E%3C/svg%3E\")";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Editor
// ═══════════════════════════════════════════════════════════════════════════════

function EditorMock() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
      {/* Chrome bar */}
      <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--danger)] opacity-70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--warning)] opacity-70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)] opacity-70" />
        <span className="ml-4 text-[11px] text-[var(--text-muted)]">Weekly Planning</span>
      </div>

      {/* Editor body */}
      <div className="space-y-4 p-6 text-sm leading-relaxed">
        {/* H1 */}
        <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
          Weekly Planning
        </div>

        {/* Callout — tip */}
        <div className="flex gap-3 rounded-xl border border-[#5ea8c8]/25 bg-[#5ea8c8]/8 px-4 py-3">
          <span className="mt-0.5 shrink-0 text-[#5ea8c8]">
            <Icon icon={FireIcon} size={15} strokeWidth={1.5} />
          </span>
          <div>
            <span className="text-xs font-semibold text-[#5ea8c8]">Tip</span>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Use <code className="rounded bg-[var(--bg-hover)] px-1 text-[var(--accent)]">/</code> to insert any block — headings, tables, code, callouts and more.</p>
          </div>
        </div>

        {/* H2 */}
        <div className="pt-1 text-base font-semibold" style={{ color: 'var(--color-h2)' }}>
          This week's focus
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {[
            { done: true,  text: 'Finish Q2 roadmap document' },
            { done: true,  text: 'Review pull requests' },
            { done: false, text: 'Write release notes' },
            { done: false, text: 'Sync with design team' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
                style={{
                  background: t.done ? 'var(--accent)' : 'transparent',
                  border: t.done ? 'none' : '1.5px solid var(--border-default)',
                }}
              >
                {t.done && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={t.done ? 'text-xs text-[var(--text-muted)] line-through' : 'text-xs text-[var(--text-secondary)]'}>
                {t.text}
              </span>
            </div>
          ))}
        </div>

        {/* H2 */}
        <div className="pt-1 text-base font-semibold" style={{ color: 'var(--color-h2)' }}>
          Notes
        </div>

        {/* Callout — warning */}
        <div className="flex gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/6 px-4 py-3">
          <span className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>
            <Icon icon={AlertCircleIcon} size={15} strokeWidth={1.5} />
          </span>
          <div>
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Important</span>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Deadline moved to Friday — confirm with stakeholders before EOD.</p>
          </div>
        </div>

        {/* Code block */}
        <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
            <span className="text-[10px] font-medium text-[var(--text-muted)]">typescript</span>
          </div>
          <pre className="px-4 py-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            <span style={{ color: 'var(--success)' }}>const</span>
            <span style={{ color: 'var(--text-primary)' }}> note </span>
            <span style={{ color: 'var(--accent)' }}>=</span>
            <span style={{ color: 'var(--color-h2)' }}> await</span>
            <span style={{ color: 'var(--text-primary)' }}> getNotes(userId)</span>
          </pre>
        </div>

        {/* Blinking cursor */}
        <div className="flex items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span>Type something</span>
          <span className="inline-block h-3.5 w-0.5 animate-[blink_1s_step-end_infinite] bg-[var(--accent)]" />
        </div>
      </div>
    </div>
  );
}

function SectionEditor() {
  return (
    <section className="relative px-6 py-32 sm:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left — copy */}
          <div>
            <FadeUp delay={0}>
              <Label>Editor</Label>
            </FadeUp>
            <FadeUp delay={0.06}>
              <h2
                className="mt-3 mb-6 text-4xl leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-5xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Write without<br />
                <span style={{ color: 'var(--accent)' }}>friction.</span>
              </h2>
            </FadeUp>
            <FadeUp delay={0.12}>
              <p className="mb-10 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
                A rich text editor that stays out of your way. Type <code className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-sm text-[var(--accent)]">/</code> for slash commands, paste Markdown and watch it transform, or just write.
              </p>
            </FadeUp>
            <FadeUp delay={0.18}>
              <div className="space-y-4">
                {[
                  { icon: PencilEdit01Icon, label: 'Callouts', desc: '14 types — tip, warning, bug, quote and more. Foldable too.' },
                  { icon: CheckmarkCircle01Icon, label: 'Task lists', desc: 'Nested checkboxes with Tab indent and slash command insert.' },
                  { icon: TextFontIcon, label: 'Code blocks', desc: 'Syntax highlighting across 36 languages with a language picker.' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="flex gap-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent)]">
                      <Icon icon={icon} size={15} strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                      <p className="text-sm text-[var(--text-muted)]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* Right — mock */}
          <FadeBlur delay={0.1}>
            <EditorMock />
          </FadeBlur>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — AI Assistant
// ═══════════════════════════════════════════════════════════════════════════════

function AiMock() {
  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
      {/* Prompt input */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {['Q2 Roadmap', 'Meeting Notes'].map((note) => (
            <span
              key={note}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]"
            >
              <span className="opacity-60">@</span>{note}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="flex-1">Summarise the key risks across these notes</span>
          <span className="inline-block h-3.5 w-0.5 animate-[blink_1s_step-end_infinite] bg-[var(--accent)]" />
        </div>
      </div>

      {/* Streamed response */}
      <div className="space-y-4 p-5 text-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-h2)]">
          <Icon icon={SparklesIcon} size={13} strokeWidth={1.5} />
          <span>Folio AI</span>
          <span className="ml-auto rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--success)]">Streaming…</span>
        </div>

        {/* Callout in response */}
        <div className="flex gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/6 px-3.5 py-3">
          <span className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>
            <Icon icon={AlertCircleIcon} size={14} strokeWidth={1.5} />
          </span>
          <div>
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Important</span>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Deadline risk identified across both documents. Stakeholder sign-off not yet confirmed.</p>
          </div>
        </div>

        {/* Bullet summary */}
        <div className="space-y-2">
          {[
            'Q2 scope has grown — 3 unplanned features added since last sync',
            'Design handoff blocked on font licensing approval',
            'No fallback plan documented for the API migration',
          ].map((item, i) => (
            <div key={i} className="flex gap-2.5 text-xs text-[var(--text-secondary)]">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--text-muted)]" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Fading trail at bottom to imply more content */}
        <div className="h-8 bg-gradient-to-b from-transparent to-[var(--bg-primary)]" />
      </div>
    </div>
  );
}

function SectionAI() {
  return (
    <section className="relative overflow-hidden px-6 py-32 sm:px-16 lg:px-24">
      {/* Lavender glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, var(--color-h2) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Heading — centered */}
        <div className="mb-16 text-center">
          <FadeUp delay={0}>
            <Label>AI Assistant</Label>
          </FadeUp>
          <FadeUp delay={0.07}>
            <h2
              className="mt-3 mb-5 text-4xl leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your notes,{' '}
              <span style={{ color: 'var(--color-h2)' }}>amplified.</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.13}>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
              Type <code className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-sm" style={{ color: 'var(--color-h2)' }}>/ai</code> anywhere in a note, <code className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-sm text-[var(--accent)]">@mention</code> other notes as context, and get a streamed response that replaces the block with rich formatted content.
            </p>
          </FadeUp>
        </div>

        {/* Mock */}
        <FadeBlur delay={0.1}>
          <AiMock />
        </FadeBlur>

        {/* Three capabilities below */}
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {[
            { title: '@mention context', desc: 'Attach any of your notes as context. The AI reads them so you don\'t have to copy-paste.' },
            { title: 'Streams inline', desc: 'Response appears token by token directly in the document. Cancel anytime mid-stream.' },
            { title: 'Renders rich', desc: 'Output is converted to full editor nodes — headings, callouts, code blocks, lists.' },
          ].map(({ title, desc }, i) => (
            <FadeUp key={title} delay={0.08 * i}>
              <div className="border-t border-[var(--border-subtle)] pt-6">
                <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Command Palette
// ═══════════════════════════════════════════════════════════════════════════════

function PaletteMock() {
  const groups = [
    {
      label: 'Actions',
      color: 'var(--accent)',
      items: ['New note', 'Toggle dark mode', 'Open search'],
    },
    {
      label: 'Notes',
      color: 'var(--success)',
      items: ['Q2 Roadmap', 'Weekly Planning', 'Interview Prep'],
    },
    {
      label: 'Insert',
      color: 'var(--color-h2)',
      items: ['Callout — Tip', 'Code block', 'Table'],
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5">
        <svg className="h-4 w-4 shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-sm text-[var(--text-muted)]">Search or type a command…</span>
        <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">⌘K</kbd>
      </div>

      {/* Results */}
      <div className="py-2">
        {groups.map((group, gi) => (
          <div key={group.label} className="px-2 pb-1">
            <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {group.label}
            </p>
            {group.items.map((item, ii) => (
              <div
                key={item}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs ${gi === 0 && ii === 0 ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: group.color, opacity: 0.7 }}
                />
                {item}
                {gi === 0 && ii === 0 && (
                  <kbd className="ml-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">↵</kbd>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionPalette() {
  return (
    <section className="relative px-6 py-32 sm:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left — mock (order reversed on desktop) */}
          <FadeBlur delay={0.08} className="order-2 lg:order-1">
            <PaletteMock />
          </FadeBlur>

          {/* Right — copy */}
          <div className="order-1 lg:order-2">
            <FadeUp delay={0}>
              <Label>Command Palette</Label>
            </FadeUp>
            <FadeUp delay={0.07}>
              <h2
                className="mt-3 mb-6 text-4xl leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-5xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                One keystroke<br />
                <span style={{ color: 'var(--success)' }}>away.</span>
              </h2>
            </FadeUp>
            <FadeUp delay={0.13}>
              <p className="mb-10 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
                Press <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 text-sm text-[var(--text-primary)]">⌘K</kbd> to open a spotlight-style palette. Navigate notes, run actions, insert blocks, switch fonts — all without touching the mouse.
              </p>
            </FadeUp>
            <FadeUp delay={0.18}>
              <div className="flex flex-wrap gap-2">
                {['New note', 'Search notes', 'Insert block', 'Switch font', 'Export .md', 'Toggle theme'].map((cap) => (
                  <span
                    key={cap}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Sync & Privacy
// ═══════════════════════════════════════════════════════════════════════════════

function SectionSync() {
  const pillars = [
    {
      icon: WifiOff01Icon,
      color: 'var(--accent)',
      title: 'No account required',
      desc: 'Everything lives in your browser first. Open the app, start writing. Sign in only when you want to sync across devices.',
    },
    {
      icon: CloudIcon,
      color: 'var(--success)',
      title: 'Offline resilient',
      desc: 'Go offline mid-session — every keystroke is queued locally and flushed the moment your connection returns. A live sync badge keeps you informed.',
    },
    {
      icon: LockPasswordIcon,
      color: 'var(--color-h2)',
      title: 'Your data, your cloud',
      desc: 'Sync runs through Supabase with row-level security enforced. No telemetry. No third-party analytics. Your notes never touch a shared server.',
    },
  ];

  return (
    <section className="relative overflow-hidden px-6 py-32 sm:px-16 lg:px-24">
      {/* Subtle tonal background shift */}
      <div className="pointer-events-none absolute inset-0 bg-[var(--bg-surface)] opacity-40" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <FadeUp delay={0}>
            <Label>Sync & Privacy</Label>
          </FadeUp>
          <FadeUp delay={0.07}>
            <h2
              className="mt-3 text-4xl leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Local first.{' '}
              <span style={{ color: 'var(--accent)' }}>Cloud when you want it.</span>
            </h2>
          </FadeUp>
        </div>

        <div className="grid gap-0 lg:grid-cols-3">
          {pillars.map(({ icon, color, title, desc }, i) => (
            <FadeUp key={title} delay={0.1 * i}>
              <div className={`px-0 py-8 lg:px-10 ${i > 0 ? 'border-t border-[var(--border-subtle)] lg:border-t-0 lg:border-l' : ''}`}>
                <span
                  className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                  style={{ color }}
                >
                  <Icon icon={icon} size={18} strokeWidth={1.5} />
                </span>
                <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Sync status strip */}
        <FadeUp delay={0.3}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {[
              { dot: 'var(--success)', label: 'Saved' },
              { dot: 'var(--accent)', label: 'Syncing…', spin: true },
              { dot: 'var(--warning)', label: 'Offline — queuing writes' },
            ].map(({ dot, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-xs text-[var(--text-muted)]"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
                {label}
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Personalization
// ═══════════════════════════════════════════════════════════════════════════════

const ACCENT_SWATCHES = [
  { label: 'Rose',     color: '#e07a8a' },
  { label: 'Lavender', color: '#a893ce' },
  { label: 'Teal',     color: '#5ea8c8' },
  { label: 'Amber',    color: '#d4a24e' },
  { label: 'Sage',     color: '#7abc8a' },
];

const FONTS = ['Outfit', 'Lora', 'Fraunces', 'Newsreader', 'Inter', 'DM Sans'];

function SectionPersonalization() {
  const swatchRef = useRef(null);
  const swatchInView = useInView(swatchRef, { once: true, margin: '-60px' });

  return (
    <section className="relative px-6 py-32 sm:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left — copy */}
          <div>
            <FadeUp delay={0}>
              <Label>Personalization</Label>
            </FadeUp>
            <FadeUp delay={0.07}>
              <h2
                className="mt-3 mb-6 text-4xl leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-5xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Make it<br />
                <span style={{ color: 'var(--color-h2)' }}>yours.</span>
              </h2>
            </FadeUp>
            <FadeUp delay={0.13}>
              <p className="mb-10 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
                Five accent palettes, eight editor fonts, dark and light mode, and a wide layout toggle. Every preference is saved locally — no account needed.
              </p>
            </FadeUp>

            {/* Accent swatches */}
            <FadeUp delay={0.18}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Accent</p>
              <div ref={swatchRef} className="mb-8 flex gap-3">
                {ACCENT_SWATCHES.map(({ label, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={swatchInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ ...spring, delay: 0.22 + i * 0.07 }}
                    title={label}
                    className="group relative cursor-default"
                  >
                    <div
                      className="h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg-deep)] transition-transform duration-200 group-hover:scale-110"
                      style={{ background: color, ['--tw-ring-color' as string]: color }}
                    />
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </FadeUp>

            {/* Font pills */}
            <FadeUp delay={0.28}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Font</p>
              <div className="flex flex-wrap gap-2">
                {FONTS.map((font, i) => (
                  <span
                    key={font}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${i === 0 ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </span>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* Right — theme toggle mock */}
          <FadeBlur delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Appearance</p>

              {/* Theme toggles */}
              <div className="mb-6 space-y-2">
                {[
                  { label: 'Dark', active: true },
                  { label: 'Light', active: false },
                ].map(({ label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${active ? 'border-[var(--accent)]/30 bg-[var(--accent)]/8' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'}`}
                  >
                    <span className={`text-sm ${active ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{label}</span>
                    {active && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'var(--accent)' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-2 h-px bg-[var(--border-subtle)]" />

              {/* Wide mode */}
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Wide mode</p>
                  <p className="text-xs text-[var(--text-muted)]">Full-width editor layout</p>
                </div>
                <div className="flex h-5 w-9 items-center rounded-full bg-[var(--accent)] px-0.5">
                  <div className="ml-auto h-4 w-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>

              {/* Icon preview */}
              <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Active accent</p>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full" style={{ background: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Rose</span>
                  <span className="ml-auto text-xs text-[var(--text-muted)]">#e07a8a</span>
                </div>
              </div>
            </div>
          </FadeBlur>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — CTA (closing bookend)
// ═══════════════════════════════════════════════════════════════════════════════

function SectionCTA({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-6 py-32">
      {/* Ambient orbs — mirrors hero */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-25 mix-blend-screen">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="cta-orb1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cta-orb2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-h2)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="35%" cy="60%" r="45%">
            <animate attributeName="cx" values="35%;40%;35%" dur="18s" repeatCount="indefinite" />
            <animate attributeName="cy" values="60%;55%;60%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="fill" values="url(#cta-orb1);url(#cta-orb1)" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="65%" cy="40%" r="40%" fill="url(#cta-orb2)">
            <animate attributeName="cx" values="65%;60%;65%" dur="20s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="relative z-10 text-center">
        <FadeUp delay={0}>
          <p
            className="mb-4 text-[5rem] leading-none tracking-tight sm:text-[8rem]"
            style={{ fontFamily: 'var(--font-logo)', color: 'var(--accent)' }}
          >
            Folio.
          </p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className="mb-12 text-lg text-[var(--text-secondary)] sm:text-xl">
            Your ethereal workspace. Ready when you are.
          </p>
        </FadeUp>
        <FadeUp delay={0.18}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={onStart}
              className="neu-btn-primary group inline-flex items-center gap-3 rounded-full bg-[var(--accent)] px-8 py-4 font-medium text-white transition-[transform,filter,box-shadow] duration-300 hover:brightness-110 active:scale-[0.96]"
            >
              <span className="text-base font-semibold tracking-wide">Get Started</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-sm transition-[transform,background-color] duration-300 group-hover:translate-x-1 group-hover:bg-white/30">
                <Icon icon={ArrowRight01Icon} size={16} stroke={2} />
              </div>
            </button>

            <button
              onClick={onSignIn}
              className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3.5 text-[14px] font-medium text-[var(--text-muted)] shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-[transform,color,border-color,box-shadow] duration-200 ease-out hover:border-[var(--border-default)] hover:text-[var(--text-primary)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.16)] active:scale-[0.96]"
            >
              <Icon icon={CloudIcon} size={16} stroke={1.5} className="transition-colors duration-300 group-hover:text-[var(--accent)]" />
              <span>Sign in to sync</span>
            </button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LandingPage({ onStart, onSignIn }: LandingPageProps) {
  const contentTransition = { type: 'spring', duration: 0.3, bounce: 0 } as const;

  return (
    <div className="relative w-screen bg-[var(--bg-deep)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30">
      {/* ── Persistent grain overlay across all sections ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[5] opacity-[0.03]"
        style={{ backgroundImage: GRAIN_SVG }}
        aria-hidden="true"
      />

      {/* ══ HERO (unchanged, exactly first viewport) ══ */}
      <div className="relative flex h-[100dvh] w-full overflow-hidden">
        {/* Background Ambient SVG */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-screen">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--success)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="orb3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--color-h2)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="20%" cy="80%" r="50%" fill="url(#orb1)">
              <animate attributeName="cx" values="20%;25%;20%" dur="20s" repeatCount="indefinite" />
              <animate attributeName="cy" values="80%;75%;80%" dur="25s" repeatCount="indefinite" />
            </circle>
            <circle cx="80%" cy="20%" r="45%" fill="url(#orb2)">
              <animate attributeName="cx" values="80%;75%;80%" dur="22s" repeatCount="indefinite" />
              <animate attributeName="cy" values="20%;25%;20%" dur="18s" repeatCount="indefinite" />
            </circle>
            <circle cx="50%" cy="50%" r="60%" fill="url(#orb3)">
              <animate attributeName="r" values="60%;65%;60%" dur="15s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        <div className="relative z-20 grid w-full grid-cols-1 lg:grid-cols-2">
          {/* Left Content */}
          <div className="flex flex-col justify-center px-6 sm:px-16 lg:px-24">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ ...contentTransition, delay: 0.08 }}
                className="mb-6 max-w-2xl text-5xl leading-[1.05] tracking-tight text-[var(--accent)] sm:text-7xl lg:text-8xl xl:text-[10rem]"
                style={{ fontFamily: 'var(--font-logo)', textWrap: 'balance' }}
              >
                Folio.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ ...contentTransition, delay: 0.18 }}
                className="mb-14 max-w-lg text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl"
                style={{ textWrap: 'pretty' }}
              >
                Your ethereal workspace for your most important ideas. Fast, private, and beautifully restrained.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...contentTransition, delay: 0.28 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={onStart}
                    className="neu-btn-primary group inline-flex items-center gap-3 rounded-full bg-[var(--accent)] px-8 py-4 font-medium text-white transition-[transform,filter,box-shadow] duration-300 hover:brightness-110 active:scale-[0.96]"
                  >
                    <span className="text-base font-semibold tracking-wide">Get Started</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-sm transition-[transform,background-color] duration-300 group-hover:translate-x-1 group-hover:bg-white/30">
                      <Icon icon={ArrowRight01Icon} size={16} stroke={2} />
                    </div>
                  </button>

                  <button
                    onClick={onSignIn}
                    className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3.5 text-[14px] font-medium text-[var(--text-muted)] shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-[transform,color,border-color,box-shadow] duration-200 ease-out hover:border-[var(--border-default)] hover:text-[var(--text-primary)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.16)] active:scale-[0.96]"
                  >
                    <Icon icon={CloudIcon} size={16} stroke={1.5} className="transition-colors duration-300 group-hover:text-[var(--accent)]" />
                    <span>Sign in to sync</span>
                  </button>
                </div>

                {/* Scroll hint */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="mt-6 flex items-center gap-2 text-xs text-[var(--text-muted)]"
                >
                  <svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M8 3v10M4 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Explore features</span>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Right Abstract Art */}
          <div className="pointer-events-none relative hidden items-center justify-center lg:flex">
            <motion.div
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ ...contentTransition, delay: 0.38 }}
              className="absolute inset-0 h-full w-full"
            >
              <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#glow)">
                  <path d="M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z" fill="none" stroke="var(--success)" strokeWidth="2" strokeOpacity="0.5">
                    <animate attributeName="d"
                      values="M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z;
                              M 400 250 C 650 150, 750 450, 550 650 C 350 850, 150 650, 250 450 C 350 250, 150 350, 400 250 Z;
                              M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z"
                      dur="20s" repeatCount="indefinite" />
                  </path>
                  <path d="M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.6">
                    <animate attributeName="d"
                      values="M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z;
                              M 400 200 C 500 150, 700 350, 600 550 C 500 750, 200 600, 200 450 C 200 300, 300 250, 400 200 Z;
                              M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z"
                      dur="15s" repeatCount="indefinite" />
                  </path>
                  <path d="M 400 300 C 500 300, 600 400, 500 500 C 400 600, 300 550, 300 450 C 300 350, 300 300, 400 300 Z" fill="none" stroke="var(--color-h2)" strokeWidth="1" strokeOpacity="0.7">
                    <animate attributeName="d"
                      values="M 400 300 C 500 300, 600 400, 500 500 C 400 600, 300 550, 300 450 C 300 350, 300 300, 400 300 Z;
                              M 400 350 C 550 250, 550 450, 450 550 C 350 650, 250 500, 350 400 C 450 300, 250 400, 400 350 Z;
                              M 400 300 C 500 300, 600 400, 500 500 C 400 600, 300 550, 300 450 C 300 350, 300 300, 400 300 Z"
                      dur="10s" repeatCount="indefinite" />
                  </path>
                </g>
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="15" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
              </svg>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══ FEATURE SECTIONS ══ */}
      <SectionEditor />

      {/* Thin divider */}
      <div className="mx-auto max-w-6xl px-6 sm:px-16 lg:px-24">
        <div className="h-px bg-[var(--border-subtle)]" />
      </div>

      <SectionAI />

      <div className="mx-auto max-w-6xl px-6 sm:px-16 lg:px-24">
        <div className="h-px bg-[var(--border-subtle)]" />
      </div>

      <SectionPalette />

      <SectionSync />

      <div className="mx-auto max-w-6xl px-6 sm:px-16 lg:px-24">
        <div className="h-px bg-[var(--border-subtle)]" />
      </div>

      <SectionPersonalization />

      {/* Full-width divider before CTA */}
      <div className="h-px bg-[var(--border-subtle)]" />

      <SectionCTA onStart={onStart} onSignIn={onSignIn} />
    </div>
  );
}
