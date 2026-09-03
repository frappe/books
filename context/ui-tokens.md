<!-- UI tokens: the design system values the agent must use for all styling -->

# UI Tokens

Design tokens for RareBooks. All colors, typography, spacing, and component values are extracted from `colors.json` and `tailwind.config.js`. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind color classes in components.

**Applies to both targets.** These tokens are shared unchanged between Desktop (Electron) and Web (Cloudflare) — see `architecture.md`. Web-only components (billing, payment review, auth screens) draw from this same `colors.json`, including the existing 6-color status system for subscription-state badges (`ACTIVE`/`PAST_DUE`/`EXPIRED`/`PENDING_REVIEW`) — do not introduce new colors for Web-specific states.

---

## How to Use

This project uses **Tailwind CSS v3** (`tailwindcss: npm:@tailwindcss/postcss7-compat`), **not v4**. There is no `@theme` directive and no CSS custom properties for colors — tokens are defined in `colors.json` at the project root and merged into `theme.extend.colors` inside `tailwind.config.js`:

```javascript
// tailwind.config.js
const colors = JSON.parse(fs.readFileSync('colors.json', { encoding: 'utf-8' }));
module.exports = {
  darkMode: 'class',
  theme: {
    extend: { colors /* ...spacing, boxShadow, borderRadius overrides */ },
  },
  plugins: [require('tailwindcss-rtl')],
};
```

Tailwind auto-generates utility classes from these color scales (e.g. `colors.gray[100]` → `bg-gray-100`, `text-gray-100`, `border-gray-100`).

```tsx
// Correct — uses generated utility classes from colors.json scales
className="bg-gray-25 text-gray-900 border-gray-300"

// Never — hardcoded hex values
className="bg-[#F8F8F8] text-[#171717]"

// Never — Tailwind's built-in color classes not backed by colors.json
className="bg-purple-500 text-slate-600"
```

To add a new token: add it to `colors.json` (respecting the existing scale-step convention below), never define it inline in `tailwind.config.js` and never in a component.

---

## colors.json — Complete Token Definition

```json
{
  "black": "#1E293B",
  "gray":   { "25": "#FBFBFB", "50": "#F8F8F8", "100": "#F3F3F3", "200": "#EDEDED", "300": "#E2E2E2", "400": "#C7C7C7", "500": "#999999", "600": "#7C7C7C", "700": "#525252", "800": "#383838", "850": "#282828", "875": "#212121", "890": "#1C1C1C", "900": "#171717" },
  "red":    { "50": "#FFF7F7", "100": "#FFF0F0", "200": "#FCD7D7", "300": "#F9C6C6", "400": "#EB9091", "500": "#E03636", "600": "#CC2929", "700": "#B52A2A", "800": "#941F1F", "900": "#6B1515" },
  "orange": { "50": "#FFF9F5", "100": "#FFF1E7", "200": "#FCE6D5", "300": "#F7D6BD", "400": "#F0B58B", "500": "#E86C13", "600": "#D45A08", "700": "#BD3E0C", "800": "#9E3513", "900": "#6B2711" },
  "yellow": { "50": "#FFFCEF", "100": "#FFF7D3", "200": "#F7E9A8", "300": "#F5E171", "400": "#F2D14B", "500": "#EDBA13", "600": "#D1930D", "700": "#AB6E05", "800": "#8C5600", "900": "#733F12" },
  "green":  { "50": "#F3FCF5", "100": "#E4F5E9", "200": "#DAF0E1", "300": "#CAE5D4", "400": "#B6DEC5", "500": "#59BA8B", "600": "#30A66D", "700": "#278F5E", "800": "#16794C", "900": "#173B2C" },
  "teal":   { "50": "#F0FDFA", "100": "#E6F7F4", "200": "#BAE8E1", "300": "#97DED4", "400": "#73D1C4", "500": "#36BAAD", "600": "#0B9E92", "700": "#0F736B", "800": "#115C57", "900": "#114541" },
  "blue":   { "50": "#F7FBFD", "100": "#EDF6FD", "200": "#E3F1FD", "300": "#C9E7FC", "400": "#70B6F0", "500": "#33A1FF", "600": "#007BE0", "700": "#0070CC", "800": "#005CA3", "900": "#004880" },
  "indigo": { "100": "#ebf4ff", "200": "#c3dafe", "300": "#a3bffa", "400": "#7f9cf5", "500": "#667eea", "600": "#5a67d8", "700": "#4c51bf", "800": "#434190", "900": "#3c366b" },
  "purple": { "50": "#FDFAFF", "100": "#F9F0FF", "200": "#F1E5FA", "300": "#E9D6F5", "400": "#D6C1E6", "500": "#9C45E3", "600": "#8642C2", "700": "#6E399D", "800": "#5C2F83", "900": "#401863" },
  "pink":   { "50": "#FFF7FC", "100": "#FEEEF8", "200": "#F8E2F0", "300": "#F2D4E6", "400": "#E9C4DA", "500": "#DF9EB8", "600": "#CF3A96", "700": "#9C2671", "800": "#801458", "900": "#570F3E" },
  "violet": { "50": "#FBFAFF", "100": "#F5F2FF", "200": "#E5E1FA", "300": "#DAD2F7", "400": "#BDB1F0", "500": "#6846E3", "600": "#5F46C7", "700": "#4F3DA1", "800": "#392980", "900": "#251959" },
  "cyan":   { "50": "#F5FBFC", "100": "#E0F8FF", "200": "#B3ECFC", "300": "#94E6FF", "400": "#6BD3F2", "500": "#34BAE3", "600": "#32A4C7", "700": "#267A94", "800": "#125C73", "900": "#164759" },
  "amber":  { "50": "#FDFAED", "100": "#FCF3CF", "200": "#F7E28D", "300": "#F5D261", "400": "#F2BE3A", "500": "#E79913", "600": "#DB7706", "700": "#B35309", "800": "#91400D", "900": "#763813" }
}
```

`tailwind.config.js` also defines, in addition to these colors:

```javascript
fontFamily: { sans: ['Inter', 'sans-serif'] },
fontSize: { xs: '11px', sm: '12px', base: '13px', lg: '14px', xl: '18px', '2xl': '20px', '3xl': '24px', '4xl': '28px' },
borderRadius: { sm: '0.25rem', DEFAULT: '0.313rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
boxShadow: {
  'outline-px': '0 0 0 1px rgba(66, 153, 225, 0.5)',
  DEFAULT: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  md: '0 0 2px 0 rgba(0, 0, 0, 0.10), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
  button: '0 0.5px 0 0 rgba(0, 0, 0, 0.08)',
},
spacing: { 7: '1.75rem', 14: '3.5rem', 18: '4.5rem', 28: '7rem', 72: '18rem', 80: '20rem' },
```

---

## Color Usage Guide

### Page Layout

| Element              | Token (color)                       |
| ---------------------- | ------------------------------------ |
| Page background       | `bg-gray-25` / `bg-gray-50`         |
| Card / surface         | `bg-white` (no colored card surfaces — color goes inside via badges/text only) |
| Secondary surface      | `bg-gray-50` / `bg-gray-100`        |
| Default border         | `border-gray-300`                    |
| Light border            | `border-gray-200`                    |

### Typography

| Element                 | Token                    |
| -------------------------- | -------------------------- |
| Headings, primary text    | `text-gray-900`           |
| Secondary text, labels    | `text-gray-700` / `text-gray-600` |
| Placeholder, muted        | `text-gray-500`           |

### Accent (Primary Color)

RareBooks does not define a single dedicated `accent` token distinct from the color scale — primary/active UI state is conventionally drawn from `blue` (`blue-500`/`blue-600`) in the base Frappe Books UI. Confirm the exact shade in `src/components/Button.vue` / `src/components/Sidebar.vue` before introducing a new accent usage, and prefer reusing whatever shade those components already use over picking a new one.

### Status Colors

| Status   | Background        | Text/Foreground     |
| ---------- | -------------------- | ---------------------- |
| Success   | `bg-green-100`       | `text-green-800`       |
| Info      | `bg-blue-100`        | `text-blue-700`        |
| Warning   | `bg-yellow-100`      | `text-yellow-800`      |
| Error     | `bg-red-100`         | `text-red-700`         |

---

## Typography

| Element              | Size (Tailwind) | Weight     | Color token      |
| ----------------------- | ------------------ | ------------ | ------------------ |
| Page heading            | `text-3xl` (24px)  | 700         | `text-gray-900`   |
| Section heading         | `text-lg` (14px)   | 600         | `text-gray-900`   |
| Body text               | `text-base` (13px) | 400/500     | `text-gray-900`   |
| Label                   | `text-sm` (12px)   | 500         | `text-gray-700`   |
| Muted / timestamp        | `text-xs` (11px)   | 400         | `text-gray-500`   |

Font family: **Inter** — imported via the project's own font loading (not `next/font/google`, since this is a Vue/Vite app, not Next.js) — never fall back to a system font.

---

## Spacing

Custom spacing additions beyond Tailwind defaults (from `tailwind.config.js`):

| Token       | Value  | Usage                         |
| ------------ | ------ | ------------------------------- |
| `p-7`        | 1.75rem (28px) | Occasional larger card padding |
| `p-14`       | 3.5rem  | Large section spacing          |
| `p-18`       | 4.5rem  | Large section spacing          |
| `p-28`       | 7rem    | Rare, large layout gaps        |
| `p-72`/`p-80`| 18/20rem| Sidebar/panel widths           |

Use standard Tailwind spacing scale (`gap-2`, `gap-4`, `p-4`, `p-6`, `px-4 py-2`, `px-3 py-1`) for the common card/button/badge paddings — these are not overridden.

---

## Component Tokens

### Cards

```
background:    bg-white
border:        1px solid theme('colors.gray.300')
border-radius: rounded (DEFAULT = 0.313rem / 5px), or rounded-lg for larger cards
padding:       p-4 or p-6
box-shadow:    shadow (DEFAULT token above)
```

### Buttons

Component: `src/components/Button.vue` — `type` prop drives styling (`primary` / `secondary`), plus `icon`, `disabled`, `loading`, `padding`, `background` props. Always reuse this component rather than a raw `<button>`.

**Primary:**

```
background:    bg-blue-500 (confirm current shade in Button.vue before reuse)
text:          text-white
border-radius: rounded-md
padding:       px-4 py-2
font-weight:   font-medium
```

**Secondary:**

```
background:    bg-white
border:        border border-gray-300
text:          text-gray-900
border-radius: rounded-md
padding:       px-4 py-2
```

### Input Fields

```
background:  bg-white
border:      border border-gray-300
border-radius: rounded-md
padding:     px-3 py-2
text:        text-gray-900
placeholder: text-gray-500
focus:       ring-1 ring-blue-500 (confirm shade against existing form components)
```

### Badges

Component: `src/components/StatusPill.vue`, `src/components/Badge.vue` — always reuse rather than hand-rolling a pill.

```
border-radius: rounded-full
padding:       px-2 py-0.5
font-size:     text-xs
font-weight:   font-medium
```

---

## Invariants

- Never use hex values directly in components — always use Tailwind color utility classes generated from `colors.json`.
- Never define a new color in `tailwind.config.js` directly — add it to `colors.json` first, following the existing `50`–`900` scale-step convention.
- Font is Inter — never fall back to a system font.
- Never use a Tailwind built-in color class that isn't backed by `colors.json` (e.g. `slate-*`, `emerald-*`, `rose-*` are not defined here).
- Don't invent a new `accent` shade — reuse the blue tone already used in `Button.vue` / `Sidebar.vue` for active/primary UI state.
- This project is on Tailwind v3, not v4 — do not introduce `@theme` or CSS custom properties for color tokens; keep everything flowing through `colors.json` → `tailwind.config.js`.
