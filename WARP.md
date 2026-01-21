# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Frappe Books is an open-source accounting software built with Electron, Vue.js 3, TypeScript, and SQLite. It follows a client-server architecture where the Electron main process acts as the server and the renderer process acts as the client.

## Development Commands

### Setup
```bash
# Install dependencies (requires Node.js v20.18.1 and yarn)
yarn

# Rebuild native modules after install
yarn postinstall
```

### Development
```bash
# Start development server with hot reload
# Note: First boot takes time as files are individually served
# Electron runs with --inspect flag on port 5858 for debugging
yarn dev
```

### Building
```bash
# Build for current platform
yarn build

# Build for specific platform
yarn build --linux
yarn build --windows
yarn build --mac
```

### Testing
```bash
# Run all tests (uses mocha and tape)
yarn test

# Run specific test file or pattern
scripts/test.sh path/to/test.spec.ts

# Run UI tests
yarn uitest
```

### Linting & Formatting
```bash
# Lint TypeScript and Vue files
yarn lint

# Format code with Prettier
yarn format
```

### Other Commands
```bash
# Generate translations
yarn script:translate

# Profile performance
yarn script:profile
```

## Architecture

### Process Model (Electron)

**Main Process** (`main.ts`): Server-side entry point handling database operations, file system access, and IPC communication. Main process code is in the `main/` directory.

**Renderer Process** (`src/main.js`): Client-side entry point handling the UI layer. All Vue components and view logic are in the `src/` directory.

### Platform Abstraction Layer

The `fyo/demux/*.ts` files provide platform abstraction, isolating platform-specific code (Electron vs Browser). These are the only client-side files that should be aware of the execution platform. All platform-specific calls must go through these demux files.

### Key Directories

**Server-side (_cannot import client code_):**
- `main/`: Electron main process code, IPC listeners, auto-updater, scheduler
- `backend/`: Database management (using Knex + SQLite), CRUD operations
- `schemas/`: Database schemas in JSON format with builder code
- `scripts/`: Build and utility scripts not used during runtime
- `translations/`: CSV files with translations for all supported languages

**Client-side (_cannot import server code directly_):**
- `src/`: All Vue components, pages, and view layer code
  - `src/components/`: Reusable Vue components
  - `src/pages/`: Page-level Vue components
  - `src/setup/`: Setup wizard components
  - `src/renderer/`: Renderer process initialization

**Client-adjacent (_called from client, tested on server_):**
- `fyo/`: Core framework managing client-side operations (singleton Fyo class)
  - `fyo/model/`: ORM abstraction layer (Doc class)
  - `fyo/demux/`: Platform-specific code (auth, db, config)
  - `fyo/core/`: Core handlers (dbHandler, authHandler)
- `models/`: Model classes extending Doc, handling data and business logic
  - Must not import Vue or frontend code globally
  - Can use dynamic imports (`await import('...')`) for frontend code in non-test paths
  - Regional models in `models/regional/`
- `reports/`: Report logic and view config files
  - Individual report directories: `BalanceSheet`, `GeneralLedger`, `ProfitAndLoss`, `TrialBalance`, `GoodsAndServiceTax`, `inventory`

**Platform-agnostic:**
- `utils/`: Shared utility functions used by both client and server
- `dummy/`: Dummy data generation for testing and demos

### Data Flow & Architecture Patterns

**Fyo Singleton**: The `Fyo` class is used as a singleton throughout the application, providing a single source of truth and common interface for `db`, `doc`, and `auth` modules.

**Doc (ORM)**:
- Abstraction layer for database entities defined in `fyo/model/doc.ts`
- All model classes extend `Doc`
- Instances are called "docs" (lowercase)

**Schema-Model-Doc Relationship**:
- **Schema**: JSON object defining data shape in the database
- **Model**: Controller class extending Doc (or Doc itself if no specific controller exists)
- **doc**: Instance of a Model containing actual data

**Initialization Flow**:
1. Connect to database (`fyo.db.createNewDatabase` or `fyo.db.connectToDatabase`)
2. Initialize and register models with `fyo.initializeAndRegister(models, regionalModels)`
3. Schemas and models are set on the fyo singleton

**Observers**: Schema-level observers in `fyo.db.observer` and `fyo.doc.observer` trigger callbacks on doc/db operations using pattern `method:schemaName`.

### Regional Configuration

- Country-specific features controlled by `countryCode` from SystemSettings
- Regional models extend base models and are loaded dynamically via `models/index.ts/getRegionalModels`
- Regional schemas located in `*/regional/` subdirectories

## TypeScript Configuration

All code paths configured with absolute imports:
- `src/*`, `schemas/*`, `main/*`, `backend/*`, `regional/*`
- `models/*`, `reports/*`, `utils/*`, `dummy/*`, `custom/*`

## Testing

- Test files: `**/tests/**/*.spec.ts`
- All tests run server-side using mocha + tape
- Tests piped through tap-spec for formatted output
- Demux classes replaced with direct managers (DatabaseManager, DummyAuthDemux) for testing
- Model tests run on server despite being client-side code at runtime

## Code Guidelines

### General Practices

**Separation of Concerns**:
- Client code must not import server code directly (maintain platform agnostic design)
- Server code must not import client code
- Side-agnostic code should avoid platform-specific APIs (node fs, browser window)

**File Naming Conventions**:
- `**/types.ts`: Type definitions only, side-agnostic, should only import other type files
- `**/tests/*.spec.ts`: Test files, not called during runtime

**TypeScript Usage**:
- Use TypeScript for all code including `.vue` files
- Prefer type safety over any types

**Code Quality (from CONTRIBUTING.md)**:
- Readability over succinctness (write short, well-named functions)
- Use early exits, avoid nested conditionals/loops
- Don't write comments unless code can't be explained by context
- Format code with Prettier and ESLint before pushing

### Models Directory Rules

When adding code to `models/**`:
- DO NOT import Vue or frontend-specific code globally
- Frontend code breaks mocha tests run on node
- Frontend code can be imported using dynamic imports: `await import('...')`
- Do not import singleton Fyo from `src/`, pass fyo as parameter instead

### Frontend Code Rules

Code quality expectations:
- Progressive disclosure: hide features until needed (big features use feature flags, small features hide until context is relevant)
- Simple UI: avoid crowding, ensure even spacing (multiples of 1rem), maintain alignment
- Child tables: max 5 columns visible, extra columns in row edit form

### Translations

- All translations happen at runtime using LanguageMap
- Set via `fyo/utils/translation.ts/setLanguageMapOnTranslationString`
- Never maintain translation strings globally (won't work until map is loaded)
- Schema fields auto-translated: `label`, `description`, `placeholder`

## Schema System

**Schema Types**:
- **Regional**: In `regional/` subdirectories, override non-regional variants
- **Abstract**: Templates for other schemas (marked with `isAbstract`)
- **Subclass**: Schemas with `extends` field pointing to abstract schema
- **Complete**: Neither abstract nor subclass

**Build Order**:
1. Regional schemas override non-regional variants
2. Subclass schemas combine with abstract schemas

**Schema Rules**:
- `name` field is the primary key (auto-added if missing)
- Auto-translated fields: `label`, `description`, `placeholder`

## Development Notes

### Debugging

- Chrome DevTools available at `chrome://inspect` when running in dev mode
- Electron main process runs with `--inspect` flag on port 5858

### First Development Run

UI takes a few seconds to render in dev mode because each file is served individually by the dev server.

### Building

Default build targets current OS and architecture. Use platform flags (`--linux`, `--windows`, `--mac`) for cross-platform builds.

### Version Control

When committing changes, include co-author line:
```
Co-Authored-By: Warp <agent@warp.dev>
```
