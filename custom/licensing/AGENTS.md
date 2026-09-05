# custom/licensing

## Overview

Fork-safe licensing, subscription, and payment system for the Electron app, isolated under `custom/` so it survives rebasing on upstream Frappe Books. Handles license issuance/validation via Keymint.dev and subscription payments via ClickPesa (Tanzania mobile money and cards), with an offline grace period so the app keeps working without a network connection.

## Key files

| File | Owns |
|---|---|
| `index.ts` | Main export and singleton entry point |
| `LicenseManager.ts` | Orchestrates online/offline/grace-period validation flow |
| `api/keymint-client.ts` | Keymint.dev REST API client (license issue/validate/delete) |
| `api/clickpesa-client.ts` | ClickPesa REST API client (payment initiation/status) |
| `subscription/subscription-manager.ts` | Orchestrates purchase flow: pay via ClickPesa, then issue license via Keymint, then retire the old license |
| `cache/license-cache.ts` + `cache/encryption.ts` | AES-256-GCM encrypted local license cache |
| `validation/online-validator.ts`, `offline-validator.ts`, `grace-period.ts` | Three-tier validation: online first, cached offline fallback, 7-day grace period before re-validation is forced |
| `fingerprint/device-id.ts` | Hardware fingerprinting for device-bound licenses |
| `ipc/registerLicenseIpcListeners.ts` | Electron IPC bridge exposing licensing to the renderer |

## Conventions

- All licensing/payment code stays under `custom/` — never edit upstream Frappe Books files directly, to keep the fork mergeable.
- Config is read from environment variables: `KEYMINT_API_URL`, `KEYMINT_ACCESS_TOKEN`, `KEYMINT_PRODUCT_ID`, `CLICKPESA_API_URL`, `CLICKPESA_API_KEY`, `CLICKPESA_CHECKSUM_KEY`, `YEARLY_LICENSE_PRICE`; `ENABLE_LICENSING=false` disables licensing for local dev.
- Tanzania phone numbers for ClickPesa payments accept three formats: `+255712345678`, `255712345678`, `0712345678` — validate against all three, not just one.
- License validation is hybrid: try online via Keymint first, fall back to the encrypted offline cache, and allow up to 7 days offline before requiring re-validation.

## Gotchas

- **The repo's committed `.env` file contains a live Keymint access token** (`KEYMINT_ACCESS_TOKEN`), and `.env` is tracked in git history even though current `.gitignore` excludes it going forward. Treat this as a leaked production credential: rotate the Keymint token, scrub `.env` from git history, and confirm ClickPesa keys weren't committed alongside it before doing further work here.
- Per `README.md`, this area went through several rounds of live debugging (see the numerous `*_FIX.md` / `*_SUMMARY.md` files at the `custom/` root and in `subscription/`) around login, phone validation, and expense migration; check those before assuming a past bug is still open or already fixed.
- Per project memory, ClickPesa and Keymint are being removed entirely from the in-progress web migration (kept only for the Electron app) — don't extend this ClickPesa/Keymint integration for the webapp target without confirming that plan hasn't changed.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
