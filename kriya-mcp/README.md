# Governed AI access for Frappe Books (optional)

This folder lets an AI assistant (Claude Desktop, Cursor, …) safely **operate** Frappe Books — not
by screen-scraping or opening the raw SQLite file, but by exposing Books' *existing* actions as a
**governed [MCP](https://modelcontextprotocol.io) server**.

It is **optional and off by default**, adds **no dependency** to the app, and **changes nothing** in
it. If you never wire it into an assistant, none of this runs.

> Why this exists: Frappe Books is local-first with no API, so until now there was no *safe* way to
> let an assistant do things in it. This gives the agent a narrow, permissioned, audited door instead
> of ungoverned database access — and it reuses the **same** in-process `fyo` layer the UI uses, so an
> AI tool-call runs the identical `Doc.sync()` / `.submit()` a human action does.

---

## What you get

- 🔒 **Permissions** — the agent can only call allow-listed actions (everything else denied).
- ✋ **Human approval** — creating a financial document, **submitting one (which posts double-entry
  ledger entries — the money moment)**, and anything destructive pause for a one-click yes/no.
- 🧾 **Signed audit log** — every executed action is an Ed25519-signed receipt you can replay.
- 💸 **Budget cap** — at most N actions per rolling minute.

## How it works

```
  Claude Desktop ──MCP/stdio──▶  kriya-mcp  ──one JSON line per action──▶  run.sh → kriya-exec.ts
  (the agent)                    (governor)                                (Books' headless fyo layer)
                                    │                                          │
                          policy ▸ approval ▸ budget ▸ audit            new Fyo({…isElectron:false})
                          (agent-policy.yaml)                            getNewDoc().sync()/.submit() → .books.db
```

- **`kriya-exec.ts`** builds a headless `Fyo` exactly the way Books' own test harness does
  (`new Fyo({ DatabaseDemux: DatabaseManager, AuthDemux: DummyAuthDemux, isElectron: false })`), opens
  your company file, and dispatches each action to the same `fyo.doc.getNewDoc(...).sync()/.submit()`
  and `fyo.db.*` calls the app uses. No GUI, no rewrite, no `kriya` dependency in this repo.
- **`run.sh`** runs it via Books' own **Electron-as-Node + ts-node + tsconfig-paths** runner (so the
  `fyo`/`backend`/`models` path aliases and the Electron-ABI `better-sqlite3` resolve).
- **`kriya-mcp`** (the open-source [`kriya`](https://crates.io/crates/kriya) crate) is the external
  governor: it speaks MCP to the assistant and enforces every gate before forwarding a cleared action.

## Enable it

1. **Install Books' deps** (from the repo root, if you haven't): `yarn install`
   (its `postinstall` builds `better-sqlite3` for Electron's ABI, which `run.sh` then uses).
2. **Install the governor:** `cargo install kriya` (provides `kriya-mcp` on your PATH).
3. **Point it at your data:** set `FRAPPE_BOOKS_DB` to your company `.books.db`, or
   `FRAPPE_BOOKS_DEMO=1` for a throwaway in-memory company (seeded with a chart of accounts).
4. **Try the handler directly first** (no governor, demo company):
   ```bash
   FRAPPE_BOOKS_DEMO=1 printf '%s\n' \
     '{"action":"create_party","params":{"name":"Acme Corp","role":"Customer"}}' \
     '{"action":"list_documents","params":{"schemaName":"Party"}}' \
   | bash kriya-mcp/run.sh
   ```
5. **Wire it into your assistant:** copy the `mcpServers.frappe-books` block from [`.mcp.json`](.mcp.json)
   into your assistant's MCP config (Claude Desktop on macOS:
   `~/Library/Application Support/Claude/claude_desktop_config.json`), replacing the placeholders.
   Restart and ask: *"What's my outstanding receivable this quarter?"*

## Governance model

| Tier | Actions | Policy |
|---|---|---|
| Read / report | `list_documents`, `get_document`, `get_outstanding`, `get_cashflow`, `get_income_and_expenses` | allow |
| Routine record-keeping | `create_party`, `create_item`, `create_account` | allow + audit |
| Financial document / ledger / destructive | `create_sales_invoice`, `create_payment`, **`submit_document`** (posts the ledger), `cancel_document`, `delete_document` | **human approval** + audit |
| Anything else | — | **denied** |

Edit [`agent-policy.yaml`](agent-policy.yaml) to tighten/loosen (e.g. `allow: false` to forbid, or
drop `require_approval` to run audited). The exposed surface is in [`tools.json`](tools.json).

## Notes for agents

- **Money is in major currency units** (Books uses `pesa` decimals, e.g. `100` or `100.50`): item
  `rate`, payment `amount`, invoice line `rate`.
- **IDs auto-generate**; numbered docs (invoices/payments) get their series number on creation.
- **Foreign keys are enforced** — create the `Party`, `Account`, and `Item` before referencing them in
  an invoice (`account` is the receivable, e.g. `Debtors`; the item's income/expense account auto-resolves).
- **`submit_document` is the money moment** — it posts the double-entry `AccountingLedgerEntry` rows;
  the policy gates it behind human approval.
- `backup_database` / `restore_database` are intentionally **not** exposed (they need the GUI dialog).

## Approval on each OS · audit log

`--approval gui` is a native macOS dialog (works under Claude Desktop's no-terminal host). On
Linux/Windows, run `kriya-mcp` from a terminal with `--approval tty`, or keep the default and know
approval-required actions safely **deny** when no human can be asked. Executed actions are signed into
`$TMPDIR/kriya-audit.jsonl` (override with `--audit-log`).

## License boundary

Frappe Books is **AGPL-3.0**; this folder is an in-repo bolt-on under the same license. `kriya-mcp`
runs as a **separate process** over the stdio JSON pipe (never linked into Books, and no Books/`fyo`
code is vendored into `kriya-mcp`), so the copyleft boundary stays at the exec.
