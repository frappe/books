<!-- UI rules: how the interface behaves — layout, interactions, and component patterns -->

# UI Rules

Concise rules for building RareBooks UI. RareBooks is a fork of Frappe Books, so existing base components/pages are the source of truth for visual decisions — match their conventions before inventing new ones. These rules cover the most important patterns and constraints to keep the UI consistent without over-specifying every detail.

**Applies to both targets.** RareBooks now ships as Desktop (Electron) and, in progress, Web (Cloudflare) — see `architecture.md`. The UI layer (Vue components, Tailwind styling, these rules) is fully shared between them; nothing in this file changes for Web. New Web-only screens (sign-in, billing, payment review — see `ui-registry.md`) must follow these same rules, not a different visual language.

---

## Font

Inter is the only typeface used. Do not introduce a new font or fall back to system fonts. This is a Vue/Vite (not Next.js) app, so font loading does not go through `next/font/google` — check `src/styles/` and `src/index.html` for the current loading mechanism before adding a new typeface reference.

---

## Layout

- The app runs inside an Electron window (desktop, not a max-width web page) — layout is built around the app's own `Sidebar` + content area, not a centered max-width marketing-style page.
- Main content area uses standard Tailwind padding (`p-4`/`p-6`), consistent with the rest of the app's forms and list views.
- Navigation is a **left sidebar** (`src/components/Sidebar.vue`), not a top navbar — RareBooks-specific nav items are configured in `custom/src/utils/sidebarConfig.ts` rather than editing `Sidebar.vue` directly, to stay fork-safe.
- Custom title bar (`src/components/WindowsTitleBar.vue`) is used on Windows in place of the native OS title bar.

---

## Navbar / Sidebar

Sidebar groups (see `custom/src/utils/sidebarConfig.ts` for the RareBooks-specific item list/ordering) generally follow the base Frappe Books groups: Dashboard, Sales, Purchases, Point of Sale, Inventory, Expenses (RareBooks addition), Reports, Settings.

- Active item: highlighted background/left accent, per existing `Sidebar.vue` classes — match its exact classes rather than re-deriving new ones.
- Sidebar shows the current username/company at the bottom in muted text (`text-xs text-gray-500 dark:text-gray-400`).
- Dark mode is supported (`dark:` variants present throughout `Sidebar.vue`) — every new component must include dark-mode classes alongside light-mode ones, not add dark mode later.

---

## Cards

Every content section lives in a card-style container.

```
background:    bg-white (dark:bg-gray-850/875, matching existing dark-mode usage)
border:        1px solid border-gray-300 (dark:border-gray-800)
border-radius: rounded (project DEFAULT, 5px) or rounded-lg for larger panels
padding:       p-4 or p-6
box-shadow:    shadow (project DEFAULT token)
```

Never use colored card backgrounds — always white/gray-scale. Color goes inside cards via `StatusPill`/`Badge` and text, never on the card surface itself.

---

## Typography Hierarchy

Three levels used consistently throughout (values per `ui-tokens.md`, sizes are the project's custom smaller scale — `base` = 13px, not the Tailwind default 16px):

**Section headings** — card titles, page section titles

```
font-size:   text-lg (14px)
font-weight: 600
color:       text-gray-900 (dark:text-gray-100)
```

**Body / primary content text**

```
font-size:   text-base (13px)
font-weight: 400–500
color:       text-gray-900 (dark:text-gray-100)
```

**Secondary / muted text** — labels, timestamps, subtitles

```
font-size:   text-xs (11px)
font-weight: 400
color:       text-gray-500 (dark:text-gray-400)
```

---

## Badges / Status Pills

Always use the existing `StatusPill.vue` / `Badge.vue` components rather than a hand-rolled pill. `StatusPill` derives its color via `getBgTextColorClass()` (`src/utils/colors.ts`) from one of the six UI status colors: `gray`, `orange`, `red`, `green`, `blue`, `yellow`. Do not introduce a seventh status color without updating `getValidColor()`/`UIColors` in `src/utils/colors.ts`.

```
border-radius: rounded-full (pill shape)
padding:       px-2 py-0.5 (project's small badge padding)
font-size:     text-xs
font-weight:   font-medium
```

---

## Buttons

Always use the shared `Button.vue` component (`type="primary"` / `type="secondary"`, plus `icon`, `loading`, `disabled`, `padding`, `background` props) — never a raw `<button>` styled from scratch. `Button.vue` already renders a loading spinner when `loading` is true; don't duplicate that logic in a feature component.

**Primary button:** solid background (confirm current shade against `Button.vue`), white text, `rounded-md`, `px-4 py-2`, `font-medium`.

**Secondary button:** white/gray background, `border border-gray-300`, `text-gray-900`, same radius/padding as primary.

**Ghost button:** transparent background, `text-gray-600`/`text-gray-700`, hover uses a light gray surface.

---

## Form Inputs

```
background:        bg-white (dark:bg-gray-850)
border:             border border-gray-300 (dark:border-gray-700)
border-radius:      rounded-md
padding:            px-3 py-2
font-size:           text-base
color:               text-gray-900 (dark:text-gray-100)
placeholder color:   text-gray-500
focus:               ring-1 ring-blue-500 border-blue-500 (confirm shade against existing form components before reuse)
```

Reuse `src/components/Controls/` field components (Data, Link, Select, Date, Currency, etc.) for any new doctype field in a form rather than building a raw `<input>` — this keeps validation, translation, and read-only behavior consistent with the rest of the accounting forms.

---

## Table

- No alternating row colors — white/gray-25 rows only, separated by a `border-gray-200` bottom border.
- Column headers: uppercase, `text-xs`, `font-medium`, `text-gray-600`/`text-gray-500`.
- Row text: `text-base` (13px), `text-gray-900`.
- Hover state: light gray background (`hover:bg-gray-50` / dark equivalent).
- Child tables (per `WARP.md` code-quality guidance): max 5 visible columns; extra fields go into the row's edit form rather than crowding the table.

---

## Empty States

Every list/section that can be empty must have a minimal empty state:

- Short descriptive text in muted gray (`text-gray-500`)
- Optional feather icon above the text (`src/components/FeatherIcon.vue` / `Icon.vue`)
- CTA button if there's a logical next action (e.g. "Create Expense")

---

## Progressive Disclosure & Simplicity (from WARP.md code guidelines)

- Hide features until they're needed — big features go behind a feature flag, small features stay hidden until contextually relevant.
- Avoid crowding: keep even spacing using multiples of the project's spacing scale (not arbitrary pixel values).
- Maintain alignment across form fields, table columns, and card grids.

---

## Tailwind v3 Note

This project uses **Tailwind v3** (`postcss7-compat`), configured via `tailwind.config.js` + `colors.json` — **not** Tailwind v4 and **not** the `@theme` CSS-directive pattern. Never introduce `@theme` blocks or CSS custom properties for colors; add new tokens to `colors.json` instead (see `ui-tokens.md`).

---

## Do Nots

- Never use Tailwind's built-in color classes that aren't backed by `colors.json` (e.g. `bg-purple-500` is fine only because `purple` exists in `colors.json` — a class like `bg-slate-500` or `bg-rose-600` is not, and must not be used).
- Never define colors directly in `tailwind.config.js` — add to `colors.json` first.
- Never add gradients to card backgrounds.
- Never use more than one font weight in a single UI element.
- Never show raw error messages to users — always translate to human-readable text (see `code-standards.md` → Error Handling; the phone-validation error rewrite is the reference example).
- Never skip dark-mode classes on a new component — the base app supports `dark:` throughout.
- Never hand-roll a status pill, badge, or button — reuse `StatusPill.vue`, `Badge.vue`, `Button.vue`.
- Never edit `Sidebar.vue`'s core nav list directly for RareBooks-specific items — extend via `custom/src/utils/sidebarConfig.ts` to stay fork-safe against upstream Frappe Books merges.
