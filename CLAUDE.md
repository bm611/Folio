# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Folio** — a local-first, Tiptap-based rich-text note-taking app. Notes persist in `localStorage` with optional Supabase cloud sync and built-in AI chat (OpenRouter). Targets Web, Desktop (Tauri v2), and Mobile (Expo).

## Commands

All root-level scripts delegate to `apps/web/`:

```bash
npm run dev           # Vite dev server (web)
npm run dev:ai        # Vite + local Netlify AI proxy (run from apps/web/)
npm run build         # tsc --noEmit && vite build
npm run test          # vitest run (all tests)
npm run lint          # ESLint flat config
npm run typecheck     # tsc --noEmit only

# Run a single test file
npx vitest run apps/web/src/utils/tree.test.js

# Tauri desktop
npm run tauri:dev     # dev mode (requires Rust toolchain)
npm run tauri:build   # build distributable

# Mobile (from apps/mobile/)
npx expo start
```

## Architecture

### Monorepo

```
apps/web/        # React 19 + Vite 7 + Tailwind v4 (primary codebase)
apps/web/src-tauri/  # Tauri v2 Rust backend (desktop shell)
apps/web/netlify/    # Serverless AI chat proxy (web/Netlify)
apps/mobile/     # Expo 53 scaffold (early stage)
packages/shared/ # @folio/shared — platform-agnostic TS (mostly empty, migrate incrementally)
```

### Web app (`apps/web/src/`)

- **`App.tsx`** — root component; owns most global state (notes list, selected note, sync queue)
- **`components/`** — UI components (`PascalCase.tsx`)
- **`contexts/AuthContext.tsx`** — Supabase auth state, wrapped via `useAuth()` hook
- **`editor/core/`** — Tiptap editor config and commands
- **`editor/extensions/`** — custom Tiptap extension nodes
- **`editor/markdown/`** — Tiptap JSON ↔ markdown conversion (keep pure and tested)
- **`lib/notesDb.ts`** — all `localStorage` CRUD for notes
- **`lib/supabase.ts`** — Supabase client (reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)
- **`utils/aiChat.ts`** — platform-aware AI streaming: Tauri (`invoke`/`listen`) vs web (`fetch` SSE)
- **`utils/exportNote.ts`** — native file export (Tauri dialog) or Blob download (web)
- **`config/accents.js`** — accent color definitions used with `var(--accent)`
- **`hooks/useTauriGlobalShortcut.ts`** — `Cmd/Ctrl+Shift+N` global capture shortcut
- **`hooks/useTauriUpdater.ts`** — in-app auto-update checker

### AI chat routing

`utils/aiChat.ts` detects runtime via `window.__TAURI_INTERNALS__`:
- **Desktop**: `invoke('chat_stream')` → Rust `src-tauri/src/chat.rs` → OpenRouter (reads key from Tauri store → env var fallback)
- **Web**: `fetch('/.netlify/functions/chat')` → `apps/web/netlify/functions/chat.ts` → OpenRouter

### Data flow

Notes are always written to `localStorage` first (local-first). Cloud sync to Supabase is queued in `App.tsx` and flushed asynchronously. Auth state from `AuthContext` gates cloud operations.

## Conventions

### Language & modules
- Progressive TS migration: new files use `.ts`/`.tsx`; existing `.jsx` files are OK
- ES modules only — no `require()`; no path aliases (use relative imports)
- `tsconfig.json`: `strict: true`, `allowJs: true`, `checkJs: false`

### Naming

| Thing | Convention |
|---|---|
| Component files | `PascalCase.tsx` |
| Utility/lib files | `camelCase.ts` |
| Constants | `SCREAMING_SNAKE_CASE` |
| Context/hooks | `useX` / `XContext` / `XProvider` |
| Test files | `*.test.ts` / `*.test.tsx` co-located |

### Styling
- Tailwind CSS v4 via `@tailwindcss/vite` — **no `tailwind.config.js`**
- Theme via CSS custom properties in `index.css` (`var(--accent)`, `var(--bg-deep)`, etc.)
- Animations via Framer Motion (`motion.*`, `AnimatePresence`)

### State management
- Global state: `App.tsx` props drilling — **no Zustand/Redux**
- Cross-cutting concerns: React Context + custom hook pattern
- Functional components and hooks only — no class components

### Testing
- Vitest v4 + jsdom + `@testing-library/react`
- Use `describe`/`it` (not `test`), `vi.fn()`, `vi.spyOn()`
- Always `cleanup()` in `afterEach` for component tests

## Environment variables

Create `apps/web/.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

`OPENROUTER_API_KEY`: Netlify env var (web) or Tauri store key `openrouter_api_key` (desktop).

## What to avoid

- No Zustand, Redux, or other state managers
- No `tailwind.config.js` — extend via CSS variables
- No `require()` or CommonJS syntax
- No path aliases without updating `vite.config.js`
- No Prettier config — formatting is not enforced
