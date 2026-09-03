---
description: Rules and context for AI agents building Rarebooks
globs: "*"
alwaysApply: true
---

# RareBooks — Agent Configuration

## Read Before Anything Else

Read the context files in this exact order before writing any code:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-tokens.md`
4. `context/ui-rules.md`
5. `context/ui-registry.md`
6. `context/code-standards.md`
7. `context/library-docs.md`
8. `context/build-plan.md`
9. `context/progress-tracker.md`

## Overview

Simple bookkeeping app for small and medium businesses, forked from Frappe Books. Ships today as an Electron desktop app (Vue 3 + TypeScript + SQLite); a migration to a hosted web app (Cloudflare Workers, Hono, Clerk, Neon, per silo tenant databases) is planned but not yet present in this branch's code.

## Stack

- **Language**: TypeScript (strict mode), Vue 3 SFCs
- **Framework**: Electron (main + renderer process), Vue Router 4
- **Database**: SQLite via better-sqlite3, Knex query builder
- **Key dependencies**: Vue 3, Knex, Luxon (dates), Bree (job scheduling), Tailwind CSS
- **Package manager**: yarn (yarn.lock is authoritative; a package-lock.json also exists but yarn is what scripts assume)

## Build approach

<TBD, set by /scope>

## Commands

```bash
# Install
yarn
yarn postinstall   # rebuilds native modules (better-sqlite3) for Electron

# Dev server
yarn dev

# Build
yarn build
yarn build --linux | --windows | --mac

# Test
yarn test           # mocha + tape, server-side
yarn uitest          # UI tests
yarn lint
yarn format
```

## Specs

No `docs/specs/` yet.

## Rules

- Strict client/server separation: `src/`, `fyo/`, `models/`, `reports/` are client(-adjacent); `main/`, `backend/`, `schemas/`, `scripts/`, `translations/` are server-side. Client code never imports server code and vice versa.
- All platform-specific (Electron vs. browser) calls go through `fyo/demux/*.ts` only — no other client file should know which platform it's running on.
- `models/**` must not import Vue or the `src/` singleton `Fyo` globally (breaks mocha tests); use dynamic `await import('...')` if frontend code is genuinely needed, and pass `fyo` in as a parameter.
- `**/types.ts` files are side-agnostic and import only other type files.
- Tests live in `**/tests/*.spec.ts`, run server-side via mocha/tape, never imported at runtime.
- TypeScript strict mode; ESLint + Prettier enforced (`no-floating-promises`, `no-misused-promises` as warnings).
- Absolute imports via tsconfig `paths` (`src/*`, `backend/*`, `custom/*`, etc.) instead of deep relative paths.

## Context files

- [custom/licensing/AGENTS.md](custom/licensing/AGENTS.md) (Licensing, subscription, and payment provider integration for the Electron app)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
