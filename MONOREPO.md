# Folio Architecture

## Overview

Folio is a local-first, Tiptap-based note-taking app structured as an **npm workspaces monorepo**:

| Platform   | Location            | Tech                                            |
| ---------- | ------------------- | ----------------------------------------------- |
| **Web**    | `apps/web/`         | React 19 + Vite 7 + Tailwind v4                 |
| **Shared** | `packages/shared/`  | Platform-agnostic TS (types, utils, data layer) |

---

## Directory Structure

```
folio/
├── apps/
│   └── web/                          # React + Vite web app
│       ├── src/                      # React components, editor, hooks, utils
│       ├── public/                   # Static assets, fonts
│       ├── netlify/                  # Serverless functions (AI chat proxy)
│       │   ├── functions/chat.ts     # OpenRouter streaming proxy
│       │   └── dev-server.js         # Local dev proxy
│       ├── index.html
│       ├── vite.config.js
│       ├── vitest.config.js
│       ├── eslint.config.js
│       ├── tsconfig.json             # Extends ../../tsconfig.base.json
│       └── package.json              # name: "note"
│
├── packages/
│   └── shared/                       # @folio/shared — platform-agnostic code
│       ├── src/
│       └── package.json
│
├── package.json                      # Root workspaces config
├── tsconfig.base.json                # Shared TS compiler options
├── netlify.toml                      # Deploys from apps/web/
├── AGENTS.md
├── README.md
└── MONOREPO.md
```

---

## Commands

```bash
npm run dev                              # Vite dev server
npm run build                            # Production build (apps/web/dist/)
npm run test                             # Vitest
npm run lint                             # ESLint
```

---

## Deployment

### Netlify

`netlify.toml` at repo root:

```toml
[build]
  command = "npm install && npm run build --workspace=apps/web"
  publish = "apps/web/dist"
  functions = "apps/web/netlify/functions"
```

The Netlify function `apps/web/netlify/functions/chat.ts` proxies AI requests to OpenRouter. It requires the `OPENROUTER_API_KEY` env var in Netlify settings.

---

## Environment Variables

| Variable                 | Where            | Purpose                 |
| ------------------------ | ---------------- | ----------------------- |
| `VITE_SUPABASE_URL`      | `apps/web/.env`  | Supabase project URL    |
| `VITE_SUPABASE_ANON_KEY` | `apps/web/.env`  | Supabase anonymous key  |
| `OPENROUTER_API_KEY`     | Netlify env      | AI chat proxy API key   |

Never commit `.env` files. See `.env.example` for required variables.
