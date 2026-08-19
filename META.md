This `md` lays out how this project is structured.

## Execution

Since it's an electron project, there are two points from where the execution
begins.

1. **Main Process**: Think of this as the _server_, the file where this beings
   is `books/main.ts`
2. **Renderer Process**: Think of this as the _client_, the file where this
   begins is `books/src/main.js`

_Note: For more insight into how electron execution is structured check out electron's
[Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)._

This process is architected in a _client-server_ manner. If the _client_ side
requires resources from the _server_ side, it does so by making use of
`ipcRenderer.send` or `ipcRenderer.invoke` i.e. if the front end is being run on
electron.

The `ipcRenderer` calls are done only in `fyo/demux/*.ts` files. I.e. these
are the only files on the _client_ side that are aware of the platform the
_client_ is being run on i.e. `electron` or Browser. So all platform specific
calls should go through these _demux_ files.

## Code Structure

Code is structured in a way so as to maintain clear separation between what each
set of files structured under some subdirectory does. It is also to maintain a
clear separation between the _client_ and the _server_.

The _client_ code should not be calling _server_ code directly (i.e. by
importing it) and vice-versa. This is to maintain the _client_ code in a
platform agnostic manner.

Some of the code is side agnostic, i.e. can be called from the _client_ or the
_server_. Only code that doesn't have platform specific calls example using
`node` `fs` or the browsers `window`. Ideally this code won't have an imports.

### Special Folders

Here's a list of subdirectories and their purposes, for more details on
individual ones, check the `README.md` in those subdirectories:

| Folder         | Side       | Description                                                                                                                |
| -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `main`         | _server_   | Electron main process specific code called from `books/main.ts`                                                            |
| `schemas`      | _server_   | Collection of database schemas in a `json` format and the code to combine them                                             |
| `backend`      | _server_   | Database management and CRUD calls                                                                                         |
| `scripts`      | _server_   | Code that is not called when the project is running, but separately to run some task for instance to generate translations |
| `build`        | _server_   | Build specific files not used unless building the project                                                                  |
| `translations` | _server_   | Collection of csv files containing translations                                                                            |
| `src`          | _client_   | Code that mainly deals with the view layer (all `.vue` are stored here)                                                    |
| `reports`      | _client\*_ | Collection of logic code and view layer config files for displaying reports.                                               |
| `models`       | _client\*_ | Collection of `Model.ts` files that manage the data and some business logic on the client side.                            |
| `fyo`          | _client\*_ | Code for the underlying library that manages the client side                                                               |
| `utils`        | _agnostic_ | Collection of code used by either sides.                                                                                   |
| `dummy`        | _agnostic_ | Code used to generate dummy data for testing or demo purposes                                                              |

#### _client\*_

The code in these folders is called during runtime from the _client_
side but since they contain business logic, they are tested using `mocha` on the
_server_ side. This is a bit stupid and so will be fixed later.

Due to this, the code in these files should not be calling _client_ side code
directly. If client side code is to be called, it should be done so only by
using dynamic imports, i.e. `await import('...')` along pathways that won't run
in a test.

### Special Files

Other than this there are two special types of files:

#### `**/types.ts`

These contains all the type information, these files are side agnostic and
should only import code from other type files.

The type information contained depends on the folder it is under i.e. where the
code associated with the types is written.

If trying to understand the code in this project I'd suggest not ignoring these.

#### `**/test/*.spec.ts`

These contain tests, as of now all tests run on the _server_ side using `mocha`.

The tests files are located in `**/test` folders which are nested under the
directories of what they are testing. No code from these files is called during
runtime.
