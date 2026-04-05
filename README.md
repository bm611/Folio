# Folio - Aura Note-taking App

Folio (Aura) is a local-first, Tiptap-based rich-text/markdown note-taking application. Notes are stored locally in `localStorage` with optional Supabase cloud sync. The project is structured as an npm workspaces monorepo targeting Web, Desktop, and Mobile platforms.

## Overview

Folio aims to provide a fast, local-first note-taking experience with seamless cloud synchronization and built-in AI chat support. It features a modern interface built with React, Vite, and Tailwind CSS, leveraging Tiptap for the rich-text editor and Tauri for the desktop native shell.

## Features

- **Local-First & Offline Capable:** Notes are saved to `localStorage` immediately, enabling seamless offline usage.
- **Rich-Text & Markdown Editor:** Powered by Tiptap, supporting rich text editing with custom extensions and reliable markdown conversion.
- **Optional Cloud Sync:** Synchronize your notes across devices using Supabase.
- **AI Chat Support:** Built-in AI chat proxy via Netlify functions (web) or Tauri streaming (desktop).
- **Cross-Platform:** Works on Web, Desktop (Tauri), and Mobile (React Native / Expo).
- **Desktop Native Features:** Global quick-capture shortcuts, window state persistence, OS-native file export, secure API key store, and auto-updates.

## Tech Stack

### Web & Frontend
- React 19
- Vite 7
- Tailwind CSS v4
- Tiptap (Rich Text Editor)
- Framer Motion

### Desktop Shell
- Tauri v2 (Rust backend)

### Mobile App
- React Native (Expo 53)

### Shared / Data Layer
- Supabase (Auth & Database)
- TypeScript (progressive migration)

## Monorepo Architecture

Folio uses an **npm workspaces monorepo** structure.

```
folio/
├── apps/
│   ├── web/               # React + Vite web app (+ Tauri desktop shell)
│   └── mobile/            # React Native (Expo) mobile app
├── packages/
│   └── shared/            # Platform-agnostic code (types, utils, data layer)
├── package.json
└── tsconfig.base.json
```

For detailed architectural information, please see [MONOREPO.md](./MONOREPO.md).

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Rust toolchain (`rustup`) for Tauri desktop development
- Xcode or Android Studio for React Native development

### Installation

Clone the repository and install dependencies from the root directory:

```bash
npm install
```

### Development Commands

#### Web (from repo root)

```bash
npm run dev        # Start Vite dev server for Web
npm run build      # Production build (apps/web/dist/)
npm run preview    # Preview the production build locally
npm run test       # Run Vitest tests
npm run lint       # Run ESLint
```

#### Tauri Desktop (from repo root)

```bash
npm run tauri:dev    # Run desktop app in dev mode
npm run tauri:build  # Build distributable
```

#### React Native Mobile (from apps/mobile)

```bash
cd apps/mobile
npx expo start       # Start Expo dev server
npx expo run:ios     # Run on iOS simulator
npx expo run:android # Run on Android emulator
```

## Environment Variables

For the application to function correctly, you need to set up certain environment variables. Create a `.env` file in the `apps/web/` directory based on `.env.example` (if available):

| Variable                 | Where                                 | Purpose                 |
| ------------------------ | ------------------------------------- | ----------------------- |
| `VITE_SUPABASE_URL`      | `apps/web/.env`                       | Supabase project URL    |
| `VITE_SUPABASE_ANON_KEY` | `apps/web/.env`                       | Supabase anonymous key  |
| `OPENROUTER_API_KEY`     | Netlify env / shell env / Tauri store | AI chat proxy API key   |

Do not commit `.env` files.

For the Tauri desktop app, the OpenRouter API key can be set securely via the Tauri store (`settings.json`).

## Testing & Code Quality

- **Testing:** We use Vitest (with jsdom) and React Testing Library. Run `npm run test` or `npx vitest run`.
- **Linting:** ESLint is configured with the new flat config format. Run `npm run lint`. Formatting is not enforced by Prettier/Biome.
- **Styling:** Tailwind CSS v4 is used with CSS variables for custom styling (no `tailwind.config.js`).

## More Documentation

- [AGENTS.md](./AGENTS.md) - Contains codebase conventions, rules, project structure, and developer tips.
- [MONOREPO.md](./MONOREPO.md) - Detailed information about the monorepo setup, Tauri configuration, code-sharing strategies, and deployment processes.
