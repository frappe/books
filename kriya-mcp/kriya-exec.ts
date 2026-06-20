/**
 * Headless governed-MCP executor for Frappe Books — the flagship "real double-entry accounting"
 * bolt-on. See README.md for how to run it.
 *
 * Frappe Books has NO published API package and NO REST endpoint — its capabilities live only in
 * the running app's in-process `fyo` doctype layer. That is exactly Kriya's wedge. This script
 * reuses that SAME layer headlessly (the bootstrap proven by Books' own test harness:
 * `new Fyo({ DatabaseDemux: DatabaseManager, AuthDemux: DummyAuthDemux, isElectron: false })`),
 * so an AI tool-call runs the identical `Doc.sync()/.submit()` a human action does — no rewrite,
 * no new API, no GUI.
 *
 * It performs NO governance. The external `kriya-mcp` process decides policy → approval → budget →
 * signed-audit on every call BEFORE forwarding it here (see agent-policy.yaml). By the time a line
 * arrives, the action has cleared every gate. The Books app itself is untouched and unaware.
 *
 * Protocol (one JSON object per line):
 *   in   {"action":"create_sales_invoice","params":{...}}
 *   out  {"success":true,"data":{...}}  |  {"success":false,"error":"..."}
 *
 * Runs inside a Books checkout via its Electron-as-Node + ts-node + tsconfig-paths runner (run.sh),
 * which resolves the `fyo`/`backend`/`models`/`src` path aliases and the Electron-ABI better-sqlite3.
 */

import { createInterface } from 'node:readline';

// Books' own in-process layer (resolved via the checkout's tsconfig path aliases at run time).
import { DatabaseManager } from 'backend/database/manager';
import { Fyo } from 'fyo';
import { DummyAuthDemux } from 'fyo/tests/helpers';
import setupInstance from 'src/setup/setupInstance';
import { getTestSetupWizardOptions } from 'tests/helpers';
import { initializeInstance } from 'src/utils/initialization';

// kriya-mcp reads ONE line of JSON per reply on stdout; Books/fyo/migrations also log to stdout,
// which would corrupt the protocol. Capture the real stdout.write for replies and divert all other
// chatter (console.log, library output) to stderr.
const stdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = process.stderr.write.bind(process.stderr) as typeof process.stdout.write;
console.log = (...args: unknown[]) => console.error(...args);
console.info = (...args: unknown[]) => console.error(...args);

type Json = Record<string, unknown>;

const ok = (data: unknown): string => JSON.stringify({ success: true, data: data ?? null });
const fail = (message: string): string => JSON.stringify({ success: false, error: message });

function reqStr(p: Json, key: string): string {
  const v = p[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`parameter '${key}' is required and must be a string`);
  }
  return v;
}

/** A small, JSON-safe summary of a Doc after a write (avoids serializing Money/pesa objects). */
function summarize(doc: any): unknown {
  return {
    name: doc.name,
    schemaName: doc.schemaName,
    submitted: !!doc.submitted,
    cancelled: !!doc.cancelled,
  };
}

/**
 * Build a headless Fyo and connect a company file. Two modes:
 *   FRAPPE_BOOKS_DEMO=1 → a fresh in-memory company seeded with a chart of accounts (for trying it).
 *   otherwise          → open the existing company file at FRAPPE_BOOKS_DB.
 */
async function buildFyo(): Promise<any> {
  const fyo: any = new Fyo({
    DatabaseDemux: DatabaseManager,
    AuthDemux: DummyAuthDemux,
    isTest: true, // skips backups + keeps telemetry off; safe for headless use
    isElectron: false,
  });

  if (process.env.FRAPPE_BOOKS_DEMO) {
    // Fresh in-memory company (seeds India chart of accounts: 'Sales', 'Debtors', 'Cost of Goods Sold', ...).
    await setupInstance(':memory:', getTestSetupWizardOptions(), fyo);
  } else {
    const dbPath = process.env.FRAPPE_BOOKS_DB;
    if (!dbPath) {
      throw new Error('set FRAPPE_BOOKS_DB to your company .books.db (or FRAPPE_BOOKS_DEMO=1 for an in-memory demo)');
    }
    // isNew=false → connect to the existing file + register models (initializeInstance does both).
    await (initializeInstance as any)(dbPath, false, undefined, fyo);
  }
  return fyo;
}

/**
 * Map an action id to Books' existing `fyo` operations — the SAME ones the UI drives. Unknown
 * actions are rejected so an agent only ever reaches this curated surface. Governance (which of
 * these need approval) is enforced upstream by kriya-mcp via agent-policy.yaml.
 */
async function dispatch(fyo: any, action: string, p: Json): Promise<string> {
  switch (action) {
    // ---- Reads (policy: allow) ----
    case 'list_documents':
      return ok(await fyo.db.getAllRaw(reqStr(p, 'schemaName'), {
        filters: (p.filters as object) ?? {},
        fields: p.fields as string[] | undefined,
      }));
    case 'get_document': {
      const rows = await fyo.db.getAllRaw(reqStr(p, 'schemaName'), { filters: { name: reqStr(p, 'name') } });
      return ok((rows as unknown[])[0] ?? null);
    }
    case 'get_outstanding': // receivables (SalesInvoice) or payables (PurchaseInvoice)
      return ok(await fyo.db.getTotalOutstanding(reqStr(p, 'schemaName'), reqStr(p, 'fromDate'), reqStr(p, 'toDate')));
    case 'get_cashflow':
      return ok(await fyo.db.getCashflow(reqStr(p, 'fromDate'), reqStr(p, 'toDate')));
    case 'get_income_and_expenses':
      return ok(await fyo.db.getIncomeAndExpenses(reqStr(p, 'fromDate'), reqStr(p, 'toDate')));

    // ---- Routine record-keeping (policy: allow + audit) ----
    case 'create_party': {
      const doc = fyo.doc.getNewDoc('Party');
      await doc.set({ name: reqStr(p, 'name'), role: (p.role as string) ?? 'Customer' });
      await doc.sync();
      return ok(summarize(doc));
    }
    case 'create_item': {
      const doc = fyo.doc.getNewDoc('Item');
      await doc.set({
        name: reqStr(p, 'name'),
        for: (p.for as string) ?? 'Sales',
        incomeAccount: reqStr(p, 'incomeAccount'),
        expenseAccount: reqStr(p, 'expenseAccount'),
      });
      if (p.rate != null) await doc.set('rate', fyo.pesa(p.rate as number));
      await doc.sync();
      return ok(summarize(doc));
    }
    case 'create_account': {
      const doc = fyo.doc.getNewDoc('Account');
      await doc.set({ name: reqStr(p, 'name'), rootType: reqStr(p, 'rootType') });
      if (p.parentAccount != null) await doc.set('parentAccount', p.parentAccount);
      if (p.accountType != null) await doc.set('accountType', p.accountType);
      if (p.isGroup != null) await doc.set('isGroup', p.isGroup);
      await doc.sync();
      return ok(summarize(doc));
    }

    // ---- Financial documents — money (policy: require_approval) ----
    case 'create_sales_invoice': {
      const doc = fyo.doc.getNewDoc('SalesInvoice');
      await doc.set({ party: reqStr(p, 'party'), account: reqStr(p, 'account'), date: reqStr(p, 'date') });
      for (const it of ((p.items as Array<Record<string, unknown>>) ?? [])) {
        await doc.append('items', {
          item: it.item,
          quantity: it.quantity ?? 1,
          rate: fyo.pesa((it.rate as number) ?? 0),
        });
      }
      await doc.sync(); // creates a DRAFT invoice (numberSeries default SINV-); submit posts the ledger
      return ok(summarize(doc));
    }
    case 'create_payment': {
      const doc = fyo.doc.getNewDoc('Payment');
      await doc.set({
        party: reqStr(p, 'party'),
        paymentType: reqStr(p, 'paymentType'), // 'Receive' | 'Pay'
        account: reqStr(p, 'account'),
        paymentAccount: reqStr(p, 'paymentAccount'),
        paymentMethod: (p.paymentMethod as string) ?? 'Cash',
        date: reqStr(p, 'date'),
        amount: fyo.pesa((p.amount as number) ?? 0),
      });
      await doc.sync();
      return ok(summarize(doc));
    }
    case 'submit_document': {
      // Posts double-entry ledger entries (Transactional.afterSubmit). The headline governed action.
      const doc = await fyo.doc.getDoc(reqStr(p, 'schemaName'), reqStr(p, 'name'));
      await doc.submit();
      return ok(summarize(doc));
    }
    case 'cancel_document': {
      const doc = await fyo.doc.getDoc(reqStr(p, 'schemaName'), reqStr(p, 'name'));
      await doc.cancel();
      return ok(summarize(doc));
    }
    case 'delete_document': {
      const doc = await fyo.doc.getDoc(reqStr(p, 'schemaName'), reqStr(p, 'name'));
      await doc.delete();
      return ok({ name: reqStr(p, 'name'), deleted: true });
    }

    default:
      return fail(`unknown action '${action}'`);
  }
}

async function main(): Promise<void> {
  const fyo = await buildFyo();
  process.stderr.write('[books kriya-exec] ready\n');

  // One request line → one reply line; EOF ends the session (covers both kriya-mcp executor modes).
  const rl = createInterface({ input: process.stdin });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let req: { action?: string; params?: Json };
    try {
      req = JSON.parse(trimmed);
    } catch {
      stdoutWrite(fail('request was not valid JSON') + '\n');
      continue;
    }
    let out: string;
    try {
      out = await dispatch(fyo, req.action ?? '', req.params ?? {});
    } catch (err) {
      out = fail(err instanceof Error ? err.message : String(err));
    }
    stdoutWrite(out + '\n');
  }

  // stdin closed (session over): close the DB cleanly, then exit. Electron's runtime and the open
  // SQLite handle keep the event loop alive, so without this the process would linger after EOF.
  try {
    await fyo.close();
  } catch {
    /* best effort */
  }
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`[books kriya-exec] fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
