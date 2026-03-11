import React, { useEffect, useState } from 'react';
import { IconArrowRight, IconPlus } from '@tabler/icons-react';

export default function LandingPage({ onStart, onCreateNew }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#0a0a0c] text-[#f2f0ed] selection:bg-[#d17b88]/30">
      {/* Background Ambient SVG */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-screen">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d17b88" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0a0a0c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5e9fb8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0a0a0c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="orb3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#aba1c4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0a0a0c" stopOpacity="0" />
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
        <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24">
          <div className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C12 8 16 12 21 12C16 12 12 16 12 21C12 16 8 12 3 12C8 12 12 8 12 3Z" stroke="#d4cfc7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 6C18 7.5 19.5 9 21 9C19.5 9 18 10.5 18 12C18 10.5 16.5 9 15 9C16.5 9 18 7.5 18 6Z" stroke="#d17b88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h1 className="mb-6 max-w-2xl font-serif text-6xl font-medium leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl xl:text-[9rem]" style={{ fontFamily: '"Fraunces", serif', letterSpacing: '-0.03em' }}>
              Think in<br/>
              <span className="italic text-[#d17b88]">motion.</span>
            </h1>
            
            <p className="mb-12 max-w-md text-lg text-[#a39e97] sm:text-xl" style={{ fontFamily: '"DM Sans", sans-serif', lineHeight: '1.6' }}>
              A luminous, local-first workspace for your most important ideas. Fast, private, and beautifully restrained.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onStart}
                className="group relative inline-flex items-center gap-4 overflow-hidden rounded-full bg-[#f2f0ed] px-8 py-4 font-medium text-[#0a0a0c] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                <span className="relative z-10 text-base font-semibold tracking-wide transition-colors duration-300 group-hover:text-[#f2f0ed]">Get Started</span>
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a0c]/10 transition-all duration-300 group-hover:bg-[#f2f0ed]/20 group-hover:text-[#f2f0ed] group-hover:translate-x-1">
                  <IconArrowRight size={16} stroke={1.5} />
                </div>
                <div className="absolute inset-0 z-0 scale-y-0 bg-[#d17b88] transition-transform duration-500 origin-bottom group-hover:scale-y-100"></div>
              </button>

              <button
                onClick={onCreateNew}
                className="group relative inline-flex items-center gap-4 overflow-hidden rounded-full bg-transparent border border-white/20 px-8 py-4 font-medium text-[#f2f0ed] transition-all duration-300 hover:border-white/40 hover:bg-white/5 active:scale-[0.98]"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                <span className="relative z-10 text-base font-semibold tracking-wide transition-colors duration-300">Create New Note</span>
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:bg-white/20">
                  <IconPlus size={16} stroke={1.5} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Abstract Art */}
        <div className="hidden lg:flex items-center justify-center relative pointer-events-none">
           <div className={`w-full h-full absolute inset-0 transition-opacity duration-[2000ms] ease-out delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#glow)">
                  <path d="M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z" fill="none" stroke="#5e9fb8" strokeWidth="2" strokeOpacity="0.5">
                    <animate attributeName="d" 
                      values="M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z;
                              M 400 250 C 650 150, 750 450, 550 650 C 350 850, 150 650, 250 450 C 350 250, 150 350, 400 250 Z;
                              M 400 200 C 600 200, 700 400, 600 600 C 500 800, 200 700, 200 500 C 200 300, 200 200, 400 200 Z" 
                      dur="20s" repeatCount="indefinite" />
                  </path>
                  <path d="M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z" fill="none" stroke="#d17b88" strokeWidth="1.5" strokeOpacity="0.6">
                    <animate attributeName="d" 
                      values="M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z;
                              M 400 200 C 500 150, 700 350, 600 550 C 500 750, 200 600, 200 450 C 200 300, 300 250, 400 200 Z;
                              M 400 250 C 550 250, 650 400, 550 550 C 450 700, 250 650, 250 500 C 250 350, 250 250, 400 250 Z" 
                      dur="15s" repeatCount="indefinite" />
                  </path>
                  <path d="M 400 300 C 500 300, 600 400, 500 500 C 400 600, 300 550, 300 450 C 300 350, 300 300, 400 300 Z" fill="none" stroke="#aba1c4" strokeWidth="1" strokeOpacity="0.7">
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