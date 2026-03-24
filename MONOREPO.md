# Folio Monorepo Architecture

## Overview

Folio is a local-first, Tiptap-based note-taking app structured as an **npm workspaces monorepo** targeting three platforms:

| Platform | Location | Tech |
|---|---|---|
| **Web** | `apps/web/` | React 19 + Vite 7 + Tailwind v4 |
| **Desktop** | `apps/web/src-tauri/` | Tauri v2 (wraps the same React frontend) |
| **Mobile** | `apps/mobile/` | React Native (Expo 53) |
| **Shared** | `packages/shared/` | Platform-agnostic TS (types, utils, data layer) |

---

## Directory Structure

```
folio/
├── apps/
│   ├── web/                          # React + Vite web app (+ Tauri desktop shell)
│   │   ├── src/                      # React components, editor, hooks, utils
│   │   ├── public/                   # Static assets, fonts
│   │   ├── src-tauri/                # Tauri v2 desktop shell
│   │   │   ├── src/main.rs           # Tauri entry point
│   │   │   ├── src/lib.rs            # Tauri commands (AI proxy, etc.)
│   │   │   ├── Cargo.toml
│   │   │   ├── build.rs
│   │   │   └── tauri.conf.json       # Window config, build paths, bundle settings
│   │   ├── netlify/                  # Serverless functions (AI chat proxy)
│   │   │   ├── functions/chat.ts     # OpenRouter streaming proxy
│   │   │   └── dev-server.js         # Local dev proxy
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── vitest.config.js
│   │   ├── eslint.config.js
│   │   ├── tsconfig.json             # Extends ../../tsconfig.base.json
│   │   └── package.json              # name: "note"
│   │
│   └── mobile/                       # React Native (Expo) mobile app
│       ├── src/
│       │   ├── screens/              # (empty — ready for implementation)
│       │   ├── components/
│       │   └── hooks/
│       ├── assets/                   # App icons, splash screen
│       ├── App.tsx                   # Placeholder entry component
│       ├── index.js                  # Expo registerRootComponent
│       ├── app.json                  # Expo config (com.folio.mobile)
│       ├── tsconfig.json             # Extends ../../tsconfig.base.json
│       └── package.json              # name: "@folio/mobile"
│
├── packages/
│   └── shared/                       # @folio/shared — platform-agnostic code
│       ├── src/
│       │   └── index.ts              # Barrel export (empty — migrate incrementally)
│       ├── tsconfig.json             # composite: true
│       └── package.json              # name: "@folio/shared"
│
├── package.json                      # Root workspaces config
├── tsconfig.base.json                # Shared TS compiler options
├── netlify.toml                      # Deploys from apps/web/
├── .gitignore                        # Includes Tauri target/ and Expo ios/android/
├── AGENTS.md
└── README.md
```

---

## Workspaces

Root `package.json` defines npm workspaces:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

Apps import shared code as:

```ts
import { fetchNotes } from '@folio/shared/supabase/notesDb'
import { buildTree } from '@folio/shared/utils/tree'
import type { TreeNode } from '@folio/shared/types'
```

---

## Commands

### Web (from repo root)

```bash
npm run dev                              # Vite dev server (web)
npm run build                            # Production build (apps/web/dist/)
npm run test                             # Vitest (all 20 tests)
npm run lint                             # ESLint
```

### Tauri Desktop

```bash
cd apps/web
npx tauri dev                            # Run desktop app in dev mode
npx tauri build                          # Build distributable (.dmg, .msi, .AppImage)
```

**Prerequisites:** Rust toolchain (`rustup`) and system deps per [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

### React Native Mobile

```bash
cd apps/mobile
npx expo start                           # Expo dev server
npx expo run:ios                         # Run on iOS simulator
npx expo run:android                     # Run on Android emulator
```

**Prerequisites:** Xcode (iOS) or Android Studio (Android).

---

## Deployment

### Netlify (Web)

`netlify.toml` at repo root:

```toml
[build]
  command = "npm install && npm run build --workspace=apps/web"
  publish = "apps/web/dist"
  functions = "apps/web/netlify/functions"
```

The Netlify function `apps/web/netlify/functions/chat.ts` proxies AI requests to OpenRouter. It requires the `OPENROUTER_API_KEY` env var in Netlify settings.

### Tauri (Desktop)

`npx tauri build` produces platform-specific installers:
- **macOS:** `.dmg` / `.app`
- **Windows:** `.msi` / `.exe`
- **Linux:** `.AppImage` / `.deb`

### Expo (Mobile)

Use `eas build` for production builds or `npx expo run:ios/android` for local dev builds.

---

## Tauri Configuration

`apps/web/src-tauri/tauri.conf.json` key settings:

| Setting | Value | Purpose |
|---|---|---|
| `build.frontendDist` | `../dist` | Points to Vite build output |
| `build.devUrl` | `http://localhost:5173` | Vite dev server URL |
| `app.windows[0]` | 1200×800, min 800×600 | Default window dimensions |
| `identifier` | `com.folio.app` | App bundle ID |

The Rust backend (`src/lib.rs`) has a placeholder `greet` command. The main task is to implement the **AI chat proxy** as a Tauri command to replace the Netlify function, securely storing the API key on the Rust side.

---

## Code Sharing Strategy

### What belongs in `packages/shared/`

These files in `apps/web/src/` are **already platform-agnostic** and should be migrated incrementally:

| File | Why it's portable |
|---|---|
| `types.ts` | Pure type definitions |
| `utils/tree.ts` | Pure functions, no DOM deps |
| `utils/knowledgeBase.ts` | Pure search logic |
| `utils/noteMeta.ts` | Pure string helpers |
| `utils/markdownText.ts` | Pure string helpers |
| `lib/supabase.ts` | `@supabase/supabase-js` works on RN |
| `lib/notesDb.ts` | Supabase CRUD, uses `fetch` internally |
| `utils/aiChat.ts` | `fetch`-based streaming, works everywhere |
| `contexts/AuthContext.tsx` | Auth *logic* is portable (split from React context) |
| Sync queue logic (in `App.tsx`) | localStorage queue logic → extract as `syncEngine.ts` |

### What stays platform-specific

| Layer | Web/Desktop | Mobile |
|---|---|---|
| Editor | Tiptap (DOM-based) | RN rich-text (e.g. `tentap-editor`) |
| UI components | Tailwind + Framer Motion | RN components + Reanimated |
| Local storage | `localStorage` | `react-native-mmkv` |
| Navigation | State-based | React Navigation |
| File export | Blob download / Tauri dialog | Share sheet |
| Haptics | `navigator.vibrate` | `expo-haptics` |

---

## Key Decisions

1. **Tauri over Electron** — No Node.js APIs needed in renderer. ~5 MB bundle vs ~200 MB. Rust backend is ideal for securely proxying the OpenRouter API key.
2. **React Native over Flutter** — Shares ~60% of code (types, utils, Supabase layer, AI chat) via `@folio/shared`. Flutter would require rewriting the entire data layer in Dart.
3. **Expo managed workflow** — Simplifies builds and OTA updates. Can eject to bare if needed.
4. **Incremental migration** — `packages/shared/` starts empty. Move modules one at a time, updating imports in `apps/web/` and adding them to `apps/mobile/` as the mobile app is built out.

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `apps/web/.env` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `apps/web/.env` | Supabase anonymous key |
| `OPENROUTER_API_KEY` | Netlify env / Tauri Rust backend | AI chat proxy API key |

Never commit `.env` files. See `.env.example` for required variables.
