<div align="center" markdown="1">

<h1>Books</h1>

**Offline desktop accounting, with Estonian compliance and a modular country-addon system.**

</div>

> Fork of [Frappe Books](https://github.com/frappe/books), licensed under **AGPL-3.0**.
> For the original product, general accounting features, and full development docs, see the upstream repo and its [documentation](https://docs.frappe.io/books).

---

## What this fork adds

1. **Estonian (EE) compliance** — VAT (KMD/VD), the Annual Report with XBRL export + validation, and bank-statement import.
2. **A modular addon system** so country-specific and app-level features plug in **without touching core files** — keeping merges with upstream small.

The two are related: the EE work is the first consumer of the addon system, and the same pattern is how you'd add any other jurisdiction.

---

## Estonian compliance features

- **VAT return (KMD + Annex VD)** — XML export conforming to the EMTA schema, correct VAT-code mapping, EU triangular and reverse-charge handling.
- **Annual Report** — Estonian GAAP taxonomy mapping with **XBRL** export, validated through [Arelle](https://arelle.org/) (runs as a local process).
- **Bank import** — LHV CSV and ISO 20022 **CAMT.053** statements, auto-classified into journal entries with reverse-charge VAT, optional draft/review flow.
- **VAT-code migration** — patch to move legacy entries onto the conformed EE VAT codes.

EE-specific settings (`vatNumber`, `registryCode`, `arellePath`) appear only when the company country is Estonia.

---

## General improvements

Not country-specific — these apply everywhere:

- **Post-submit invoice attachment** — attach a source PDF/image to an already-posted journal entry (writes only the attachment, ledger untouched).
- **In-app attachment viewer** — view attached PDFs/images without downloading.
- **One-click single actions** — a dropdown with a single action runs it on click instead of opening a menu.

---

## Architecture: two extension layers

The fork keeps upstream's core untouched as much as possible by routing additions through **two** layers. Everything the fork adds to a core file is fenced with a grep-able marker:

```bash
grep -rn "CUSTOM:\|EE:" src/ models/ main/   # every place the fork touches core
```

### Layer 1 — Native regional (upstream's own system)

Country-scoped **data** rides upstream's existing, country-code-keyed extension points. These are small, additive, low-conflict edits marked `// EE:` (or `// LV:`, …):

| Concern | File | Keyed by |
|---|---|---|
| Models | `models/index.ts` → `getRegionalModels()` | country code |
| Schemas | `schemas/regional/index.ts` + `schemas/regional/<cc>/` | country code |
| Setup records | `src/regional/index.ts` → `createRegionalRecords()` | country name |
| Chart of accounts | `models/baseModels/SetupWizard/SetupWizard.ts` | country code |
| Settings field visibility | `models/baseModels/AccountingSettings/AccountingSettings.ts` | country code |
| Migrations | `backend/patches/index.ts` | version |

Region code itself lives in owned folders: `src/regional/<cc>/`, `models/regionalModels/<cc>/`, `schemas/regional/<cc>/`.

### Layer 2 — Addon system (this fork's aggregation layer)

An addon can bundle **any** functionality — a whole new page or sub-app, custom logic, background work, native integrations — not just reports. The manifest is simply the *registration surface*: it tells the app where each contribution plugs in (routes, sidebar, reports, list-view actions, native IPC), while the feature code itself lives in owned folders and can do whatever it needs. The EE addon, for example, mounts a complete bank-import page. **Adding any of this touches zero core files.**

The contribution types below are what the core currently exposes hooks for; new types can be added by wiring one more delegation point in core (once) and a field on the `AppAddon` contract.

- **Renderer addons** live in `src/custom/<addon>/index.ts` and export an `AppAddon` (see `src/custom/types.ts`):

  ```ts
  const ee: AppAddon = {
    name: 'ee',
    condition: (fyo) => fyo.singles?.SystemSettings?.countryCode === 'ee',
    reports: { KmdReport, AnnualReport },
    routes: [{ path: '/regional/ee/bank-import', name: 'EE Bank Import',
               component: () => import('src/pages/BankImport/BankImportPage.vue') }],
    sidebar: getEstoniaSidebar,
    listActions: { JournalEntry: [{ label: t`Submit Drafts`, action: submitDrafts }] },
  };
  export default ee;
  ```

  The aggregator `src/custom/index.ts` merges all addons; core registries spread the result in **once** (marked `// CUSTOM:`): `reports/index.ts`, `src/router.ts`, `src/utils/sidebarConfig.ts`, and the `ListView` action bar.

- **Main-process addons** (native/Node IPC, e.g. Arelle) live in `main/addons/`. Channels are namespaced strings (`ee:validate-xbrl`) — no edits to the core `IPC_ACTIONS` enum. The preload surface and handler registrar are each spread into core once (`main/preload.ts`, `main/registerIpcMainActionListeners.ts`).

> **Rule:** addon manifests are imported at app start, so keep them light at module load — reference pages/heavy components lazily (`component: () => import(...)`), never with a top-level `import`.

### What the layers do **not** cover

A handful of changes modify how an existing upstream component *behaves* (not what's registered) — e.g. the in-app attachment viewer, single-click dropdown actions, `plugins: true` for the PDF viewer. No addon system can remove these; they stay as thin, `// CUSTOM:`-marked patches and are candidates to upstream.

---

## Adding a country (worked example: Latvia `lv`)

### A. Regional data (Layer 1)

1. **Models** — create `models/regionalModels/lv/` and add a marked branch to `getRegionalModels()` in `models/index.ts`:
   ```ts
   // LV: Latvian regional models (native regional pattern)
   if (countryCode === 'lv') {
     const { Party } = await import('./regionalModels/lv/Party');
     return { Party };
   }
   ```
2. **Schemas** — add `schemas/regional/lv/` and register `lv: LatvianSchemas` in `schemas/regional/index.ts` (`// LV`).
3. **Setup records** — add `src/regional/lv/lv.ts` exporting `createLatvianRecords`, wire an `else if (country === 'Latvia')` branch in `src/regional/index.ts` (`// LV`).
4. **Chart of accounts** — add `{ countryCode: 'lv', name: 'Latvia - Chart of Accounts' }` to `getCOAList()` (`// LV`).
5. **Settings fields** — if LV needs custom settings fields, add them to the schema and gate visibility in `AccountingSettings.ts` (`// LV`).
6. **Migrations** — add to `backend/patches/index.ts` only if needed.

### B. App features (Layer 2 — no core edits)

1. Build whatever the country needs in owned folders — custom pages (`src/pages/…` or `src/regional/lv/…`), reports (`reports/LatvianTax/…`), helpers, etc.
2. Create `src/custom/lv/index.ts` exporting an `AppAddon` (`condition: countryCode === 'lv'`) and declare each contribution it should register — any of `routes`, `sidebar`, `reports`, `listActions` (only what you need).
3. Register it in `src/custom/index.ts`:
   ```ts
   import lv from './lv';
   export const addons: AppAddon[] = [ee, lv];
   ```
4. **Native IPC?** Add `main/addons/lv.channels.ts`, `lv.preload.ts`, `lv.handlers.ts`, then register them in `main/addons/preload.ts` and `main/addons/index.ts`.

That's it — every Latvian feature is live, with **no** edits to `reports/index.ts`, `router.ts`, `sidebarConfig.ts`, or the IPC core.

---

## Development

This fork uses the upstream toolchain (Electron + Vue 3 + TypeScript). See the [upstream README](https://github.com/frappe/books) for full environment setup.

```bash
yarn install
yarn dev          # run the app in development
yarn build        # package the desktop app
./scripts/test.sh # run the test suite (tape)
```

---

## License & attribution

Licensed under the **GNU AGPL-3.0** — see [`LICENSE`](./LICENSE). This project is an independent fork.
