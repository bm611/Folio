import React, { useEffect, useState } from 'react';
import { IconArrowRight, IconCloud } from '@tabler/icons-react';

export default function LandingPage({ onStart, onCreateNew, onSignIn }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30">
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

      {/* Grain Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' fill=\'%23000\'/%3E%3C/svg%3E")' }}
      ></div>

      <div className="relative z-20 grid w-full grid-cols-1 lg:grid-cols-2">
        {/* Left Content */}
        <div className="flex flex-col justify-center px-6 sm:px-16 lg:px-24">
          <div className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>

            <h1 className="mb-6 max-w-2xl text-5xl leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl xl:text-[10rem] text-[var(--accent)]" style={{ fontFamily: 'var(--font-logo)' }}>
              Aura.
            </h1>

            <p className="mb-14 max-w-lg text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
              Your ethereal, local-first workspace for your most important ideas. Fast, private, and beautifully restrained.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={onStart}
                  className="neu-btn-primary group inline-flex items-center gap-3 rounded-full bg-[var(--accent)] px-8 py-4 font-medium text-white transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
                >
                  <span className="text-base font-semibold tracking-wide">Get Started</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 shadow-sm group-hover:translate-x-1 group-hover:bg-white/30">
                    <IconArrowRight size={16} stroke={2} />
                  </div>
                </button>

                <button
                  onClick={onSignIn}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3.5 text-[14px] font-medium text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--text-primary)] hover:border-[var(--border-default)] active:scale-[0.97]"
                >
                  <IconCloud size={16} stroke={1.5} className="transition-colors duration-300 group-hover:text-[var(--accent)]" />
                  <span>Sign in to sync</span>
                </button>
              </div>
              <span className="text-[12px] text-[var(--text-muted)] tracking-wide ml-1">
                 Local-first · No account required
              </span>
            </div>
          </div>
        </div>

        {/* Right Abstract Art */}
        <div className="hidden lg:flex items-center justify-center relative pointer-events-none">
          <div className={`w-full h-full absolute inset-0 transition-opacity duration-[2000ms] ease-out delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
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
          </div>
        </div>
      </div>
    </div>
  );
}