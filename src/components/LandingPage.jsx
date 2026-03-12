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
            
            <h1 className="mb-6 max-w-2xl text-6xl leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl xl:text-[10rem] text-[#d17b88]" style={{ fontFamily: '"Italiana", serif' }}>
              Aura.
            </h1>
            
            <p className="mb-12 max-w-md text-lg text-[#a39e97] sm:text-xl" style={{ fontFamily: '"DM Sans", sans-serif', lineHeight: '1.6' }}>
              Your ethereal, local-first workspace for your most important ideas. Fast, private, and beautifully restrained.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onStart}
                className="group inline-flex items-center gap-4 rounded-full bg-[#d17b88] px-10 py-4.5 font-medium text-white transition-all duration-150 hover:translate-y-[2px] active:translate-y-[6px]"
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  boxShadow: '0 6px 0 #a3505e, 0 8px 0 #8a3f4d, 0 12px 24px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 5px 0 #a3505e, 0 7px 0 #8a3f4d, 0 10px 20px rgba(0,0,0,0.45)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 6px 0 #a3505e, 0 8px 0 #8a3f4d, 0 12px 24px rgba(0,0,0,0.5)'}
                onMouseDown={e => e.currentTarget.style.boxShadow = '0 1px 0 #a3505e, 0 2px 0 #8a3f4d, 0 3px 6px rgba(0,0,0,0.3)'}
                onMouseUp={e => e.currentTarget.style.boxShadow = '0 5px 0 #a3505e, 0 7px 0 #8a3f4d, 0 10px 20px rgba(0,0,0,0.45)'}
              >
                <span className="text-base font-semibold tracking-wide">Get Started</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-1">
                  <IconArrowRight size={16} stroke={1.5} />
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