import { useEffect, useRef, useState } from 'react';
import { Cancel01Icon, Loading01Icon, Mail01Icon, LockPasswordIcon, UserAccountIcon } from '@hugeicons/core-free-icons';
import Icon from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

// GRAIN_SVG reused from LandingPage
const GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' fill='%23000'/%3E%3C/svg%3E\")";

interface AuthPageProps {
  onBack: () => void;
}

export default function AuthPage({ onBack }: AuthPageProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const contentTransition = { type: 'spring', duration: 0.3, bounce: 0 } as const;

  useEffect(() => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setDisplayName('');
    setTimeout(() => emailRef.current?.focus(), 60);
  }, [tab]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'signin') {
        await signInWithEmail(email, password);
        // App.tsx handles unmounting this component once authenticated
      } else {
        await signUpWithEmail(email, password, displayName || undefined);
        setSuccess("You're in! Welcome to Folio. ✨");
      }
    } catch (err) {
      setError((err as Error).message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 flex">
      {/* ── Persistent grain overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[5] opacity-[0.03]"
        style={{ backgroundImage: GRAIN_SVG }}
        aria-hidden="true"
      />

      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-4 py-2 text-sm font-medium text-[var(--text-muted)] backdrop-blur-md transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
      >
        <Icon icon={Cancel01Icon} size={16} strokeWidth={1.5} />
        Back to home
      </button>

      <div className="relative z-20 grid w-full grid-cols-1 lg:grid-cols-2">
        {/* Left Side — Auth Form */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-16 lg:p-24 h-full relative z-30">
          
          {/* Ambient orbs behind the form (mobile only, visible on small screens where right side is hidden) */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-screen lg:hidden">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="orb1-mobile" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="20%" cy="80%" r="50%" fill="url(#orb1-mobile)">
                <animate attributeName="cx" values="20%;25%;20%" dur="20s" repeatCount="indefinite" />
                <animate attributeName="cy" values="80%;75%;80%" dur="25s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[400px]"
          >
            {/* Header */}
            <div className="mb-8 text-center">
              <h1
                className="text-4xl tracking-tight text-[var(--text-primary)] mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {tab === 'signin' ? 'Welcome back.' : 'Join the fold.'}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {tab === 'signin' ? 'Your notes missed you.' : 'Keep your thoughts in sync, everywhere.'}
              </p>
            </div>

            {/* Auth Form Area */}
            {/* Tab switcher */}
            <div
              className="mb-12 flex border-b border-[var(--border-subtle)]"
              role="tablist"
            >
              {([
                { id: 'signin' as const, label: 'Sign In' },
                { id: 'signup' as const, label: 'Sign Up' },
              ]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-3 text-sm font-medium transition-[color,border-color] duration-200 border-b-2 -mb-[1px] ${
                    tab === t.id
                      ? 'text-[var(--text-primary)] border-[var(--accent)]'
                      : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)] hover:border-[var(--border-subtle)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="space-y-6">
                {/* Display Name (sign-up only) */}
                {tab === 'signup' && (
                  <div className="relative group">
                    <Icon
                      icon={UserAccountIcon}
                      size={22}
                      strokeWidth={1.5}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none"
                    />
                    <input
                      id="auth-display-name"
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Display name"
                      className="w-full bg-transparent border-0 border-b-2 border-[var(--border-subtle)] focus:border-[var(--border-subtle)] focus:border-b-[var(--accent)] focus:ring-0 py-4 pl-10 pr-4 text-xl sm:text-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 transition-colors duration-300 rounded-none !outline-none !shadow-none"
                      style={{ boxShadow: 'none' }}
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative group">
                  <Icon
                    icon={Mail01Icon}
                    size={22}
                    strokeWidth={1.5}
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none"
                  />
                  <input
                    ref={emailRef}
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-transparent border-0 border-b-2 border-[var(--border-subtle)] focus:border-[var(--border-subtle)] focus:border-b-[var(--accent)] focus:ring-0 py-4 pl-10 pr-4 text-xl sm:text-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 transition-colors duration-300 rounded-none !outline-none !shadow-none"
                    style={{ boxShadow: 'none' }}
                  />
                </div>

                {/* Password */}
                <div className="relative group">
                  <Icon
                    icon={LockPasswordIcon}
                    size={22}
                    strokeWidth={1.5}
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none"
                  />
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-transparent border-0 border-b-2 border-[var(--border-subtle)] focus:border-[var(--border-subtle)] focus:border-b-[var(--accent)] focus:ring-0 py-4 pl-10 pr-4 text-xl sm:text-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 transition-colors duration-300 rounded-none !outline-none !shadow-none"
                    style={{ boxShadow: 'none' }}
                  />
                </div>
              </div>

              {/* Error / success */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-2 text-sm text-[var(--danger)] leading-relaxed"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-2 text-sm text-[var(--success)] leading-relaxed"
                >
                  {success}
                </motion.p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-4 text-lg font-semibold text-white transition-[transform,filter,opacity] duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-[var(--accent)]/20"
              >
                {loading && <Icon icon={Loading01Icon} size={20} strokeWidth={2} className="animate-spin" />}
                {tab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[var(--border-subtle)]" />
              <span className="text-xs text-[var(--text-muted)]">or</span>
              <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={async () => {
                setError('');
                try {
                  await signInWithGoogle();
                } catch (err) {
                  setError((err as Error).message || 'Google sign-in failed.');
                }
              }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 py-4 text-base font-medium text-[var(--text-primary)] backdrop-blur-sm transition-[background,border-color,transform] duration-200 hover:bg-[var(--bg-surface)] hover:border-[var(--text-muted)]/30 active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>
        </div>

        {/* Right Side — Abstract Art */}
        <div className="pointer-events-none relative hidden items-center justify-center lg:flex border-l border-[var(--border-subtle)]/50 bg-[var(--bg-primary)]/20">
          
          {/* Ambient Orbs */}
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
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

          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ ...contentTransition, delay: 0.38 }}
            className="absolute inset-0 h-full w-full z-10"
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
  );
}
