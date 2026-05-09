import { useEffect, useRef, useState } from 'react';
import { Cancel01Icon, Loading01Icon } from '@hugeicons/core-free-icons';
import Icon from './Icon';
import { useAuth } from '../contexts/AuthContext';

interface AuthPageProps {
  onBack: () => void;
}

const FONT   = '"Poppins", system-ui, -apple-system, sans-serif';
const INK    = '#202124';
const MUTED  = '#5f6368';
const DIV    = '#e8eaed';
const BLUE   = '#1a73e8';
const SURF   = '#f8f9fa';
const HOVER  = '#f1f3f4';

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
      } else {
        await signUpWithEmail(email, password, displayName || undefined);
        setSuccess("You're in! Welcome to Folio.");
      }
    } catch (err) {
      setError((err as Error).message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full rounded-[10px] border px-3.5 py-2.5 text-[14px] outline-none';
  const inputStyle = {
    borderColor: DIV,
    background: '#ffffff',
    color: INK,
    fontFamily: FONT,
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = BLUE;
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.12)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = DIV;
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(32,33,36,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onBack(); }}
    >
      <div
        className="relative w-full max-w-[440px] overflow-hidden rounded-[20px]"
        style={{ background: '#ffffff', boxShadow: '0 24px 60px -12px rgba(32,33,36,0.25)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <div>
            <h1
              className="text-[26px] leading-none tracking-[-0.02em]"
              style={{ fontFamily: FONT, fontWeight: 500, color: INK }}
            >
              {tab === 'signin' ? 'Welcome back' : 'Get started'}
            </h1>
            <p className="mt-2 text-[13px] leading-[1.4]" style={{ color: MUTED, fontFamily: FONT }}>
              {tab === 'signin'
                ? 'Your notes missed you.'
                : 'Keep your thoughts in sync, everywhere.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[#f1f3f4] active:scale-[0.92]"
            style={{ color: MUTED, transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 150ms ease' }}
            aria-label="Close"
          >
            <Icon icon={Cancel01Icon} size={15} strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-5">
          {/* Tabs */}
          <div
            className="mb-5 inline-flex h-8 items-center rounded-full p-0.5"
            style={{ background: SURF }}
          >
            {([
              { id: 'signin' as const, label: 'Sign in' },
              { id: 'signup' as const, label: 'Sign up' },
            ]).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className="inline-flex h-7 items-center rounded-full px-4 text-[12.5px] font-medium transition-colors duration-150"
                style={{
                  background: tab === t.id ? '#ffffff' : 'transparent',
                  color: tab === t.id ? INK : MUTED,
                  boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontFamily: FONT,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium" style={{ color: MUTED, fontFamily: FONT }}>
                  Display name
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium" style={{ color: MUTED, fontFamily: FONT }}>
                Email
              </span>
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium" style={{ color: MUTED, fontFamily: FONT }}>
                Password
              </span>
              <input
                type="password"
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </label>

            {error && (
              <div
                className="rounded-[10px] px-3.5 py-2.5 text-[13px]"
                style={{ background: 'rgba(217,48,37,0.08)', color: '#d93025', fontFamily: FONT }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="rounded-[10px] px-3.5 py-2.5 text-[13px]"
                style={{ background: 'rgba(30,142,62,0.08)', color: '#1e8e3e', fontFamily: FONT }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium active:scale-[0.97] disabled:opacity-60"
              style={{
                background: BLUE,
                color: '#ffffff',
                fontFamily: FONT,
                transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 150ms ease',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#1765cc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = BLUE)}
            >
              {loading && <Icon icon={Loading01Icon} size={14} strokeWidth={2} className="animate-spin" />}
              {tab === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: DIV }} />
            <span className="text-[12px]" style={{ color: MUTED, fontFamily: FONT }}>or</span>
            <div className="h-px flex-1" style={{ background: DIV }} />
          </div>

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
            className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-full border text-[14px] font-medium active:scale-[0.97]"
            style={{
              borderColor: DIV,
              background: '#ffffff',
              color: INK,
              fontFamily: FONT,
              transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
