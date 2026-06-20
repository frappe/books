#!/usr/bin/env bash
# Run the Frappe Books kriya-exec handler headlessly, reusing Books' OWN runner (Electron-as-Node
# + ts-node + tsconfig-paths). The external `kriya-mcp` governor points its `--exec` at this script.
#
# Frappe Books ships no API package, and its better-sqlite3 is built for Electron's ABI by the
# repo's `postinstall: electron-rebuild`, so we run under the repo's Electron-as-Node (cwd = repo
# root) to resolve the path aliases + the native module. `TS_NODE_TRANSPILE_ONLY` keeps the repo's
# strict typecheck from gating this standalone script.
#
# Env (all optional — sensible defaults for running inside the repo):
#   BOOKS_DIR            Books checkout root (default: this script's parent dir)
#   BOOKS_KRIYA_HANDLER  path to kriya-exec.ts (default: alongside this script)
#   FRAPPE_BOOKS_DB      your company .books.db  (omit + set FRAPPE_BOOKS_DEMO=1 to demo)
#   FRAPPE_BOOKS_DEMO    "1" → fresh in-memory demo company (seeded chart of accounts)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOOKS_DIR="${BOOKS_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
HANDLER="${BOOKS_KRIYA_HANDLER:-$SCRIPT_DIR/kriya-exec.ts}"

cd "$BOOKS_DIR" # cwd must be the repo root so tsconfig-paths resolves Books' aliases + native deps
export ELECTRON_RUN_AS_NODE=true
export TS_NODE_TRANSPILE_ONLY=true
export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'
# Let Node resolve plain deps (tslib, …) from the checkout's node_modules even if the handler
# lives elsewhere.
export NODE_PATH="$BOOKS_DIR/node_modules${NODE_PATH:+:$NODE_PATH}"
exec ./node_modules/.bin/electron \
  --require ts-node/register \
  --require tsconfig-paths/register \
  "$HANDLER"
