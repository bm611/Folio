import { useRef, useEffect, useState, memo } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import {
  ArrowRight01Icon,
  CloudIcon,
  SparklesIcon,
  LockPasswordIcon,
  WifiOff01Icon,
  CheckmarkCircle01Icon,
  PencilEdit01Icon,
  TextFontIcon,
  Settings02Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';

import Icon from './Icon';

interface LandingPageProps {
  onStart: () => void;
  onSignIn: () => void;
}

// ─── Google Store palette (scoped to this page only) ─────────────────────────
//
// White canvas, warm-gray section rhythm, single saturated accent.
// All `style` overrides on the root cascade through every child.
//
const GS = {
  '--gs-canvas':      '#ffffff',        // primary background — 80%+ of viewport
  '--gs-canvas-alt':  '#f8f9fa',        // alternating section rhythm + product tile
  '--gs-ink':         '#202124',        // primary headlines & body
  '--gs-ink-soft':    '#3c4043',        // dense body
  '--gs-ink-muted':   '#5f6368',        // taglines, prefixes, footnotes
  '--gs-ink-subtle':  '#80868b',        // metadata, icons
  '--gs-divider':     '#e8eaed',        // hairline rules
  '--gs-blue':        '#1a73e8',        // singular accent: text links + rare filled CTA
  '--gs-blue-hover':  '#1765cc',
  '--gs-blue-tint':   '#e8f0fe',        // tonal surface
  // product-derived tints — borrowed from device colorways
  '--gs-tint-lavender': '#eee7f7',
  '--gs-tint-jade':     '#e0efe5',
  '--gs-tint-stone':    '#efece6',
  '--gs-tint-rose':     '#f7e9ea',
  '--gs-tint-sky':      '#e3edf6',
  // type — Google Sans is proprietary; Poppins is a Google-hosted geometric
  // sans that closely matches its rhythm and round shoulders.
  '--gs-display':     '"Poppins", system-ui, -apple-system, sans-serif',
  '--gs-text':        '"Poppins", system-ui, -apple-system, sans-serif',
  '--gs-mono':        '"IBM Plex Mono", ui-monospace, monospace',
} as React.CSSProperties;

// ─── Motion primitives ───────────────────────────────────────────────────────
//
// Restrained per Google Store's "recessive UI". One spring config; transforms
// + opacity only; no blur, no rotation, no scale. Reduced-motion respected.
//
const SPRING = { type: 'spring', stiffness: 110, damping: 22, mass: 0.9 } as const;

function Reveal({
  children,
  delay = 0,
  className = '',
  y = 14,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-72px' });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      animate={inView ? (reduced ? { opacity: 1 } : { opacity: 1, y: 0 }) : {}}
      transition={{ ...SPRING, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Reusable atoms ──────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[13px] font-medium uppercase tracking-[0.14em]"
      style={{ color: 'var(--gs-ink-muted)' }}
    >
      {children}
    </span>
  );
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`text-[40px] leading-[1.12] tracking-[-0.02em] sm:text-[52px] ${className}`}
      style={{ fontFamily: 'var(--gs-display)', color: 'var(--gs-ink)', fontWeight: 400 }}
    >
      {children}
    </h2>
  );
}

function Lede({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`text-[17px] leading-[1.55] sm:text-[18px] ${className}`}
      style={{ color: 'var(--gs-ink-muted)' }}
    >
      {children}
    </p>
  );
}

// Plain text-link CTA in Google Blue — primary affordance per the design language.
function TextLink({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const Component: any = href ? 'a' : 'button';
  return (
    <Component
      onClick={onClick}
      href={href}
      className="group inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[-0.005em] transition-colors duration-150"
      style={{ color: 'var(--gs-blue)' }}
    >
      <span className="relative">
        {children}
        <span
          className="absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
          style={{ background: 'var(--gs-blue)' }}
        />
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      >
        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Component>
  );
}

// Pill filled button — used sparingly per Google Store.
function PillButton({
  children,
  onClick,
  variant = 'filled',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'filled' | 'ghost';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium tracking-[-0.005em] transition-all duration-200 active:scale-[0.985]';
  if (variant === 'filled') {
    return (
      <button
        onClick={onClick}
        className={base}
        style={{ background: 'var(--gs-blue)', color: '#ffffff' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gs-blue-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gs-blue)')}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`${base} border`}
      style={{ borderColor: 'var(--gs-divider)', color: 'var(--gs-ink)', background: 'transparent' }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO — left-aligned content, right-side product showcase on tinted surface
// ═══════════════════════════════════════════════════════════════════════════════

function Hero({ onStart, onSignIn }: LandingPageProps) {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  // Subtle parallax on the showcase tile — only when motion is allowed.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const tileY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -40]);

  return (
    <section
      ref={heroRef}
      className="relative w-full overflow-hidden"
      style={{ background: 'var(--gs-canvas)', minHeight: '100dvh' }}
    >
      {/* Top utility row — borrowed from Google Store's mega-nav cleanliness */}
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 pt-8 sm:px-10">
        <span
          className="text-[20px] tracking-[-0.02em]"
          style={{ fontFamily: 'var(--gs-display)', fontWeight: 500, color: 'var(--gs-ink)' }}
        >
          Folio
        </span>
        <nav className="hidden items-center gap-8 md:flex">
          {['Editor', 'AI', 'Sync', 'Personalize'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="text-[14px] font-medium tracking-[-0.005em] transition-colors duration-150"
              style={{ color: 'var(--gs-ink)' }}
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          onClick={onSignIn}
          className="text-[14px] font-medium tracking-[-0.005em] transition-colors duration-150"
          style={{ color: 'var(--gs-blue)' }}
        >
          Sign in
        </button>
      </div>

      {/* Main hero grid — 5/7 split, asymmetric whitespace */}
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-6 pb-20 pt-16 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:pb-32 lg:pt-28">
        {/* Left — copy */}
        <div className="lg:col-span-5">
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.05 }}
          >
            <Eyebrow>New · Folio 2.0</Eyebrow>
          </motion.div>

          <motion.h1
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.12 }}
            className="mt-4 text-[44px] leading-[1.05] tracking-[-0.025em] sm:text-[64px] lg:text-[68px]"
            style={{ fontFamily: 'var(--gs-display)', fontWeight: 400, color: 'var(--gs-ink)' }}
          >
            Notes built for the{' '}
            <span style={{ color: 'var(--gs-blue)' }}>way you think.</span>
          </motion.h1>

          <motion.p
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.2 }}
            className="mt-6 max-w-[440px] text-[17px] leading-[1.55]"
            style={{ color: 'var(--gs-ink-muted)' }}
          >
            A local-first writing surface with a quiet AI inside. Open the app and
            start typing — sync to the cloud only when you choose.
          </motion.p>

          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.28 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <PillButton onClick={onStart}>
              Start writing
              <Icon icon={ArrowRight01Icon} size={16} stroke={1.8} />
            </PillButton>
            <TextLink onClick={onSignIn}>Sign in to sync</TextLink>
          </motion.div>

          {/* Spec strip — three small data points, no card chrome */}
          <motion.dl
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.36 }}
            className="mt-14 grid max-w-[440px] grid-cols-3 gap-6"
          >
            {[
              { v: '0 ms', l: 'time to first keystroke' },
              { v: '36', l: 'syntax languages' },
              { v: '14', l: 'callout types' },
            ].map(({ v, l }) => (
              <div key={l}>
                <dt
                  className="text-[24px] leading-none tracking-[-0.02em]"
                  style={{ fontFamily: 'var(--gs-display)', fontWeight: 400, color: 'var(--gs-ink)' }}
                >
                  {v}
                </dt>
                <dd className="mt-2 text-[12px] leading-[1.4]" style={{ color: 'var(--gs-ink-muted)' }}>
                  {l}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Right — product showcase on lavender tint */}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.18 }}
          style={{ y: tileY }}
          className="lg:col-span-7"
        >
          <div
            className="relative aspect-[5/4] w-full overflow-hidden rounded-[28px]"
            style={{ background: 'var(--gs-tint-lavender)' }}
          >
            <HeroEditorShowcase />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Editor showcase floating inside the hero tint.
const HeroEditorShowcase = memo(function HeroEditorShowcase() {
  const reduced = useReducedMotion();
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 lg:p-16">
      <div
        className="relative w-full max-w-[520px] overflow-hidden rounded-[14px]"
        style={{ background: '#ffffff', boxShadow: '0 24px 60px -28px rgba(32,33,36,0.18)' }}
      >
        {/* Window chrome — minimal */}
        <div
          className="flex items-center gap-4 px-5 py-3"
          style={{ borderBottom: '1px solid var(--gs-divider)' }}
        >
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#e8eaed' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#e8eaed' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#e8eaed' }} />
          </div>
          <span className="text-[12px]" style={{ color: 'var(--gs-ink-subtle)' }}>
            Weekly review · just now
          </span>
        </div>

        {/* Body */}
        <div className="px-7 py-7 sm:px-9">
          <p
            className="text-[24px] leading-[1.15] tracking-[-0.015em]"
            style={{ fontFamily: 'var(--gs-display)', color: 'var(--gs-ink)', fontWeight: 500 }}
          >
            What I learned this week
          </p>
          <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: 'var(--gs-ink-soft)' }}>
            Three things stood out — clarity beats throughput, async writing
            compounds, and the team
          </p>

          {/* AI block */}
          <div
            className="mt-5 rounded-[10px] p-4"
            style={{ background: 'var(--gs-blue-tint)' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span style={{ color: 'var(--gs-blue)' }}>
                <Icon icon={SparklesIcon} size={13} stroke={1.6} />
              </span>
              <span className="text-[11px] font-medium tracking-[0.04em]" style={{ color: 'var(--gs-blue)' }}>
                FOLIO AI
              </span>
              <motion.span
                animate={reduced ? {} : { opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="ml-auto text-[11px]"
                style={{ color: 'var(--gs-ink-muted)' }}
              >
                Drafting…
              </motion.span>
            </div>
            <p className="text-[13px] leading-[1.55]" style={{ color: 'var(--gs-ink-soft)' }}>
              Continue with: <span style={{ color: 'var(--gs-ink)' }}>"shipped two ideas that needed
              another pair of eyes — write them up before Monday."</span>
            </p>
          </div>

          {/* Inline checklist */}
          <ul className="mt-5 space-y-2.5">
            {[
              { done: true, t: 'Draft Q3 narrative' },
              { done: true, t: 'Share with Mira' },
              { done: false, t: 'Pin to home' },
            ].map((it) => (
              <li key={it.t} className="flex items-center gap-3">
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-[3px]"
                  style={{
                    background: it.done ? 'var(--gs-blue)' : 'transparent',
                    border: it.done ? '0' : '1.5px solid var(--gs-ink-subtle)',
                  }}
                >
                  {it.done && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.6L3.6 6.7 7.5 2.5"
                        stroke="#fff"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className="text-[13px]"
                  style={{
                    color: it.done ? 'var(--gs-ink-subtle)' : 'var(--gs-ink-soft)',
                    textDecoration: it.done ? 'line-through' : 'none',
                  }}
                >
                  {it.t}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHOWCASE — generic zigzag block (image left | text right OR reversed)
// ═══════════════════════════════════════════════════════════════════════════════

function Showcase({
  id,
  eyebrow,
  title,
  description,
  ctaLabel,
  onCta,
  bullets,
  visual,
  reverse = false,
  tint,
  background,
}: {
  id?: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  bullets?: { label: string; desc: string }[];
  visual: React.ReactNode;
  reverse?: boolean;
  tint: string;
  background?: string;
}) {
  return (
    <section
      id={id}
      className="relative w-full"
      style={{ background: background ?? 'var(--gs-canvas)' }}
    >
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
        {/* Visual */}
        <div className={`lg:col-span-7 ${reverse ? 'lg:order-2' : ''}`}>
          <Reveal y={20}>
            <div
              className="relative aspect-[5/4] w-full overflow-hidden rounded-[28px]"
              style={{ background: tint }}
            >
              {visual}
            </div>
          </Reveal>
        </div>

        {/* Copy */}
        <div className={`lg:col-span-5 ${reverse ? 'lg:order-1' : ''}`}>
          <Reveal delay={0.05}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <H2 className="mt-3">{title}</H2>
          </Reveal>
          <Reveal delay={0.16}>
            <Lede className="mt-5 max-w-[460px]">{description}</Lede>
          </Reveal>

          {bullets && (
            <Reveal delay={0.22}>
              <ul className="mt-8 space-y-5">
                {bullets.map((b) => (
                  <li key={b.label}>
                    <p
                      className="text-[15px] tracking-[-0.005em]"
                      style={{ color: 'var(--gs-ink)', fontWeight: 500 }}
                    >
                      {b.label}
                    </p>
                    <p
                      className="mt-1 text-[14px] leading-[1.55]"
                      style={{ color: 'var(--gs-ink-muted)' }}
                    >
                      {b.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {ctaLabel && (
            <Reveal delay={0.3}>
              <div className="mt-9">
                <TextLink onClick={onCta}>{ctaLabel}</TextLink>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Visual mocks for showcases ──────────────────────────────────────────────

const EditorVisual = memo(function EditorVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 lg:p-14">
      <div
        className="relative w-full max-w-[480px] overflow-hidden rounded-[14px]"
        style={{ background: '#ffffff', boxShadow: '0 24px 60px -28px rgba(32,33,36,0.16)' }}
      >
        <div className="px-7 py-7">
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--gs-ink-subtle)' }}>
            <Icon icon={PencilEdit01Icon} size={12} stroke={1.6} />
            <span>Slash menu</span>
          </div>
          <p
            className="mt-4 text-[20px] leading-[1.2] tracking-[-0.015em]"
            style={{ fontFamily: 'var(--gs-display)', color: 'var(--gs-ink)', fontWeight: 500 }}
          >
            Paste, type, or just /
          </p>

          <div className="mt-6 space-y-1.5">
            {[
              { label: 'Heading',     hint: 'h1' },
              { label: 'Callout',     hint: '/call', active: true },
              { label: 'Code block',  hint: '```' },
              { label: 'Task list',   hint: '[]' },
              { label: 'Table',       hint: '/tbl' },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-[8px] px-3 py-2 text-[13px]"
                style={{
                  background: row.active ? 'var(--gs-blue-tint)' : 'transparent',
                  color: row.active ? 'var(--gs-blue)' : 'var(--gs-ink-soft)',
                }}
              >
                <span style={{ fontWeight: row.active ? 500 : 400 }}>{row.label}</span>
                <span
                  className="text-[11px]"
                  style={{
                    color: row.active ? 'var(--gs-blue)' : 'var(--gs-ink-subtle)',
                    fontFamily: 'var(--gs-mono)',
                  }}
                >
                  {row.hint}
                </span>
              </div>
            ))}
          </div>

          {/* Output preview underneath */}
          <div className="mt-6 rounded-[10px] p-4" style={{ background: 'var(--gs-canvas-alt)' }}>
            <p className="text-[11px] font-medium" style={{ color: 'var(--gs-ink-muted)' }}>
              TIP
            </p>
            <p className="mt-1.5 text-[13px] leading-[1.55]" style={{ color: 'var(--gs-ink-soft)' }}>
              Press <code style={{ fontFamily: 'var(--gs-mono)', color: 'var(--gs-blue)' }}>/</code> on a
              new line for any block — headings, tables, callouts, and code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

const AIVisual = memo(function AIVisual() {
  const reduced = useReducedMotion();
  const prompts = [
    'Summarise this week of standups',
    'Pull out the unresolved questions',
    'Draft a release note from these PRs',
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % prompts.length), 2800);
    return () => clearInterval(t);
  }, [reduced]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 lg:p-14">
      <div
        className="relative w-full max-w-[480px] overflow-hidden rounded-[14px]"
        style={{ background: '#ffffff', boxShadow: '0 24px 60px -28px rgba(32,33,36,0.16)' }}
      >
        {/* Prompt */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--gs-divider)' }}>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {['@Q3-roadmap', '@team-sync'].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: 'var(--gs-blue-tint)', color: 'var(--gs-blue)', fontFamily: 'var(--gs-mono)' }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[14px]" style={{ color: 'var(--gs-ink)' }}>
            <motion.span
              key={idx}
              initial={reduced ? {} : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {prompts[idx]}
            </motion.span>
            <motion.span
              animate={reduced ? {} : { opacity: [1, 0, 1] }}
              transition={{ duration: 1.05, repeat: Infinity, ease: 'linear' }}
              className="inline-block h-[14px] w-[1.5px]"
              style={{ background: 'var(--gs-blue)' }}
            />
          </div>
        </div>

        {/* Stream */}
        <div className="px-6 py-5">
          <div className="mb-3 flex items-center gap-2">
            <span style={{ color: 'var(--gs-blue)' }}>
              <Icon icon={SparklesIcon} size={13} stroke={1.6} />
            </span>
            <span className="text-[11px] font-medium tracking-[0.04em]" style={{ color: 'var(--gs-blue)' }}>
              FOLIO AI
            </span>
            <span className="ml-auto text-[11px]" style={{ color: 'var(--gs-ink-subtle)' }}>
              streaming
            </span>
          </div>

          <p
            className="text-[14px] leading-[1.55]"
            style={{ color: 'var(--gs-ink-soft)' }}
          >
            Three threads moved this week:
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {[
              'Auth migration — unblocked, owner Mira',
              'Pricing page — copy locked, design in review',
              'Mobile editor — needs spec by Friday',
            ].map((line, i) => (
              <motion.li
                key={line}
                initial={reduced ? {} : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 * i, ...SPRING }}
                className="flex gap-2 text-[13px]"
                style={{ color: 'var(--gs-ink-soft)' }}
              >
                <span
                  className="mt-1.5 inline-block h-1 w-1 rounded-full"
                  style={{ background: 'var(--gs-ink-subtle)' }}
                />
                <span>{line}</span>
              </motion.li>
            ))}
            <motion.li
              animate={reduced ? {} : { opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="ml-3 mt-2 h-2 w-24 rounded-full"
              style={{ background: 'var(--gs-divider)' }}
            />
          </ul>
        </div>
      </div>
    </div>
  );
});

const PaletteVisual = memo(function PaletteVisual() {
  const groups: { label: string; items: { name: string; kbd?: string }[] }[] = [
    {
      label: 'Actions',
      items: [
        { name: 'New note', kbd: 'N' },
        { name: 'Open search', kbd: '/' },
        { name: 'Export markdown', kbd: 'E' },
      ],
    },
    {
      label: 'Notes',
      items: [
        { name: 'Q3 roadmap' },
        { name: 'Hiring loop · Hannelore' },
        { name: 'Reading queue' },
      ],
    },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 lg:p-14">
      <div
        className="relative w-full max-w-[480px] overflow-hidden rounded-[14px]"
        style={{ background: '#ffffff', boxShadow: '0 24px 60px -28px rgba(32,33,36,0.16)' }}
      >
        {/* Search */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--gs-divider)' }}
        >
          <Icon icon={Search01Icon} size={15} stroke={1.6} color="var(--gs-ink-subtle)" />
          <input
            readOnly
            value="open r"
            className="flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: 'var(--gs-ink)' }}
          />
          <span
            className="rounded-md px-2 py-0.5 text-[11px]"
            style={{
              background: 'var(--gs-canvas-alt)',
              color: 'var(--gs-ink-muted)',
              fontFamily: 'var(--gs-mono)',
            }}
          >
            ⌘K
          </span>
        </div>

        {/* Results */}
        <div className="py-2">
          {groups.map((g) => (
            <div key={g.label} className="px-2 pb-1">
              <p
                className="px-3 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[0.12em]"
                style={{ color: 'var(--gs-ink-subtle)' }}
              >
                {g.label}
              </p>
              {g.items.map((it, i) => (
                <div
                  key={it.name}
                  className="flex items-center justify-between rounded-[8px] px-3 py-2 text-[13px]"
                  style={{
                    background: g.label === 'Notes' && i === 0 ? 'var(--gs-blue-tint)' : 'transparent',
                    color: g.label === 'Notes' && i === 0 ? 'var(--gs-blue)' : 'var(--gs-ink-soft)',
                  }}
                >
                  <span style={{ fontWeight: g.label === 'Notes' && i === 0 ? 500 : 400 }}>
                    {it.name}
                  </span>
                  {it.kbd && (
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--gs-ink-subtle)', fontFamily: 'var(--gs-mono)' }}
                    >
                      ⌘{it.kbd}
                    </span>
                  )}
                  {g.label === 'Notes' && i === 0 && (
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--gs-blue)', fontFamily: 'var(--gs-mono)' }}
                    >
                      ↵
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// VALUE PROPOSITION STRIP — icon + text row, no card chrome
// ═══════════════════════════════════════════════════════════════════════════════

function ValuePropStrip() {
  const props = [
    { icon: WifiOff01Icon,        title: 'Works offline',     desc: 'Every keystroke saved locally first.' },
    { icon: LockPasswordIcon,     title: 'Yours by default',  desc: 'No telemetry, no third-party analytics.' },
    { icon: CloudIcon,            title: 'Sync when ready',   desc: 'Optional Supabase backend with row-level security.' },
    { icon: CheckmarkCircle01Icon,title: 'Open formats',      desc: 'Export the full library to Markdown anytime.' },
  ];

  return (
    <section
      className="w-full"
      style={{ background: 'var(--gs-canvas-alt)', borderTop: '1px solid var(--gs-divider)', borderBottom: '1px solid var(--gs-divider)' }}
    >
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 px-6 py-14 sm:px-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-16">
        {props.map((p, i) => (
          <Reveal key={p.title} delay={0.05 * i} y={10}>
            <div className="flex items-start gap-4">
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--gs-canvas)', color: 'var(--gs-ink)' }}
              >
                <Icon icon={p.icon} size={16} stroke={1.6} />
              </span>
              <div>
                <p
                  className="text-[15px] tracking-[-0.005em]"
                  style={{ color: 'var(--gs-ink)', fontWeight: 500 }}
                >
                  {p.title}
                </p>
                <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: 'var(--gs-ink-muted)' }}>
                  {p.desc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT GRID — borderless cards, tinted image rectangles, vertical stack
// ═══════════════════════════════════════════════════════════════════════════════

function ShopGrid() {
  const cards = [
    {
      tag: 'Theme',
      name: 'Linen',
      tagline: 'Warm parchment palette, hand-set monospace numerals.',
      tint: 'var(--gs-tint-stone)',
      ink: '#7a6e58',
    },
    {
      tag: 'Theme',
      name: 'Lavender',
      tagline: 'Quiet violet accent on a near-white canvas. Reads at a distance.',
      tint: 'var(--gs-tint-lavender)',
      ink: '#5f4b8b',
    },
    {
      tag: 'Theme',
      name: 'Jade',
      tagline: 'Cool botanical accent. Designed for long writing sessions.',
      tint: 'var(--gs-tint-jade)',
      ink: '#3a7a52',
    },
    {
      tag: 'Theme',
      name: 'Sky',
      tagline: 'Cool, professional. The default for most teams.',
      tint: 'var(--gs-tint-sky)',
      ink: '#1a73e8',
    },
  ];

  return (
    <section className="w-full" style={{ background: 'var(--gs-canvas)' }} id="personalize">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-24 sm:px-10 lg:py-32">
        <div className="mb-12 flex items-end justify-between gap-8">
          <div>
            <Reveal>
              <Eyebrow>Make it yours</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <H2 className="mt-3">Themes, the way you like to read.</H2>
            </Reveal>
          </div>
          <Reveal delay={0.12} className="hidden md:block">
            <TextLink>Browse all themes</TextLink>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <Reveal key={c.name} delay={0.06 * i}>
              <article className="group">
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px]"
                  style={{ background: c.tint }}
                >
                  <ThemeTile ink={c.ink} name={c.name} />
                </div>
                <div className="mt-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: 'var(--gs-ink-muted)' }}>
                    {c.tag}
                  </p>
                  <p
                    className="mt-1.5 text-[18px] tracking-[-0.01em]"
                    style={{ color: 'var(--gs-ink)', fontWeight: 500 }}
                  >
                    {c.name}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-[1.55]" style={{ color: 'var(--gs-ink-muted)' }}>
                    {c.tagline}
                  </p>
                  <div className="mt-4">
                    <TextLink>Apply theme</TextLink>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// Miniature “theme product” preview — a tiny card-of-text floating on the tint.
function ThemeTile({ ink, name }: { ink: string; name: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div
        className="w-full max-w-[220px] rounded-[10px] bg-white p-4"
        style={{ boxShadow: '0 18px 36px -22px rgba(32,33,36,0.18)' }}
      >
        <p
          className="text-[14px] tracking-[-0.01em]"
          style={{ color: ink, fontFamily: 'var(--gs-display)', fontWeight: 500 }}
        >
          {name} preview
        </p>
        <div className="mt-3 space-y-1.5">
          <span className="block h-1.5 w-full rounded-full" style={{ background: 'var(--gs-divider)' }} />
          <span className="block h-1.5 w-[88%] rounded-full" style={{ background: 'var(--gs-divider)' }} />
          <span className="block h-1.5 w-[64%] rounded-full" style={{ background: ink, opacity: 0.35 }} />
        </div>
        <div className="mt-3 flex gap-1.5">
          {[0.9, 0.55, 0.3].map((o, i) => (
            <span
              key={i}
              className="h-3.5 w-3.5 rounded-[3px]"
              style={{ background: ink, opacity: o }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY BANNER — landscape lifestyle card with text overlay
// ═══════════════════════════════════════════════════════════════════════════════

function CategoryBanner({ onStart }: { onStart: () => void }) {
  return (
    <section className="w-full" style={{ background: 'var(--gs-canvas)' }}>
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 sm:px-10 lg:pb-32">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[28px]"
            style={{
              background:
                'linear-gradient(135deg, var(--gs-tint-jade) 0%, var(--gs-tint-sky) 100%)',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="px-8 pb-10 pt-10 sm:px-12 sm:pb-14 sm:pt-14 lg:py-20 lg:pl-16">
                <Eyebrow>Workspace</Eyebrow>
                <h3
                  className="mt-3 text-[34px] leading-[1.1] tracking-[-0.02em] sm:text-[42px]"
                  style={{ fontFamily: 'var(--gs-display)', color: 'var(--gs-ink)', fontWeight: 400 }}
                >
                  A quiet desk, every time you open a file.
                </h3>
                <p className="mt-4 max-w-[420px] text-[15px] leading-[1.55]" style={{ color: 'var(--gs-ink-muted)' }}>
                  Wide layout, distraction-free toolbar, and a sidebar that gets out
                  of the way the moment you start typing.
                </p>
                <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                  <PillButton onClick={onStart}>Start a workspace</PillButton>
                  <TextLink>See the tour</TextLink>
                </div>
              </div>

              <div className="relative min-h-[260px] lg:min-h-[420px]">
                {/* Layered cards — abstract “workspace” preview */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="relative h-full w-full max-w-[440px]">
                    <div
                      className="absolute right-0 top-4 w-[78%] rounded-[12px] bg-white p-4"
                      style={{ boxShadow: '0 16px 36px -22px rgba(32,33,36,0.22)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon={Settings02Icon} size={12} stroke={1.6} color="var(--gs-ink-subtle)" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: 'var(--gs-ink-subtle)' }}>
                          Preferences
                        </span>
                      </div>
                      {[
                        { l: 'Wide layout', on: true },
                        { l: 'Show line numbers', on: false },
                        { l: 'Auto-collapse sidebar', on: true },
                      ].map((r) => (
                        <div key={r.l} className="mt-3 flex items-center justify-between">
                          <span className="text-[12px]" style={{ color: 'var(--gs-ink-soft)' }}>
                            {r.l}
                          </span>
                          <span
                            className="flex h-4 w-7 items-center rounded-full px-0.5"
                            style={{ background: r.on ? 'var(--gs-blue)' : 'var(--gs-divider)' }}
                          >
                            <span
                              className="h-3 w-3 rounded-full bg-white transition-transform duration-200"
                              style={{ transform: r.on ? 'translateX(12px)' : 'translateX(0)' }}
                            />
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      className="absolute bottom-0 left-0 w-[68%] rounded-[12px] bg-white p-4"
                      style={{ boxShadow: '0 18px 38px -22px rgba(32,33,36,0.22)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--gs-blue)' }}>
                          <Icon icon={TextFontIcon} size={12} stroke={1.6} />
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: 'var(--gs-ink-subtle)' }}>
                          Reading mode
                        </span>
                      </div>
                      <p
                        className="mt-3 text-[12px] leading-[1.5]"
                        style={{ color: 'var(--gs-ink-soft)' }}
                      >
                        Increase line-height, hide the chrome, and let the page
                        breathe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CTA BOOKEND — minimal centered, single primary action
// ═══════════════════════════════════════════════════════════════════════════════

function ClosingCTA({ onStart, onSignIn }: LandingPageProps) {
  return (
    <section
      className="w-full"
      style={{ background: 'var(--gs-canvas-alt)', borderTop: '1px solid var(--gs-divider)' }}
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 py-24 text-center sm:px-10 lg:py-32">
        <Reveal>
          <Eyebrow>Get started</Eyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <H2 className="mt-4 max-w-[640px]">
            Open Folio. <span style={{ color: 'var(--gs-blue)' }}>Start writing in three seconds.</span>
          </H2>
        </Reveal>
        <Reveal delay={0.16}>
          <p
            className="mt-5 max-w-[480px] text-[16px] leading-[1.55]"
            style={{ color: 'var(--gs-ink-muted)' }}
          >
            No download. No account required. Sign in only when you want your notes
            available on every device.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <PillButton onClick={onStart}>
              Open the editor
              <Icon icon={ArrowRight01Icon} size={16} stroke={1.8} />
            </PillButton>
            <TextLink onClick={onSignIn}>Sign in to sync</TextLink>
          </div>
        </Reveal>
      </div>

      {/* Footer hairline */}
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
        <div style={{ borderTop: '1px solid var(--gs-divider)' }} />
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 text-[13px]" style={{ color: 'var(--gs-ink-muted)' }}>
          <span>© {new Date().getFullYear()} Folio</span>
          <div className="flex gap-6">
            <a href="#" style={{ color: 'inherit' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit' }}>Terms</a>
            <a href="#" style={{ color: 'inherit' }}>Changelog</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LandingPage({ onStart, onSignIn }: LandingPageProps) {
  return (
    <div
      className="relative w-full"
      style={{ ...GS, background: 'var(--gs-canvas)', color: 'var(--gs-ink)', fontFamily: 'var(--gs-text)' }}
    >
      <Hero onStart={onStart} onSignIn={onSignIn} />

      <Showcase
        id="editor"
        eyebrow="Editor"
        title={
          <>
            Write the way<br />
            <span style={{ color: 'var(--gs-blue)' }}>your hands move.</span>
          </>
        }
        description="A rich-text editor with a slash menu, drag-handle blocks, and 14 callout types. Paste markdown and watch it transform — or just type."
        ctaLabel="See every block"
        bullets={[
          { label: 'Slash commands',  desc: 'Press / for any block — heading, code, table, callout, embed.' },
          { label: 'Drag and reorder', desc: 'Grab a block from its handle and drop it anywhere in the page.' },
          { label: '36 syntax languages', desc: 'Code blocks ship with a language picker and inline highlighting.' },
        ]}
        visual={<EditorVisual />}
        tint="var(--gs-tint-lavender)"
      />

      <ValuePropStrip />

      <Showcase
        id="ai"
        eyebrow="Folio AI"
        title={
          <>
            Quiet intelligence,<br />
            <span style={{ color: 'var(--gs-blue)' }}>on tap.</span>
          </>
        }
        description="Type /ai anywhere in a note. @-mention other notes for context. The response streams inline as fully formatted blocks — not a chat bubble."
        ctaLabel="Read the AI guide"
        bullets={[
          { label: '@mention notes',  desc: 'Pull any note in as context. The AI reads them so you don’t have to copy and paste.' },
          { label: 'Inline streaming', desc: 'Tokens land directly in the document. Cancel mid-stream with Esc.' },
          { label: 'Renders rich',     desc: 'Output becomes real editor nodes — headings, callouts, code, lists.' },
        ]}
        visual={<AIVisual />}
        reverse
        tint="var(--gs-tint-jade)"
        background="var(--gs-canvas-alt)"
      />

      <Showcase
        id="sync"
        eyebrow="Command palette"
        title={
          <>
            Anything in the app,<br />
            <span style={{ color: 'var(--gs-blue)' }}>two keys away.</span>
          </>
        }
        description="Press ⌘K to open a spotlight palette. Search notes, jump between files, or run any action without lifting your hands from the keyboard."
        ctaLabel="See all shortcuts"
        bullets={[
          { label: 'Fuzzy search',    desc: 'Match across titles, tags, and recent activity.' },
          { label: 'Action grouping', desc: 'Notes, actions, and inserts are grouped — never one long list.' },
          { label: 'Always one key',  desc: 'Open from anywhere. Closes when you start typing.' },
        ]}
        visual={<PaletteVisual />}
        tint="var(--gs-tint-sky)"
      />

      <ShopGrid />

      <CategoryBanner onStart={onStart} />

      <ClosingCTA onStart={onStart} onSignIn={onSignIn} />
    </div>
  );
}
