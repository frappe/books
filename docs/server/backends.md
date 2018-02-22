# Backends

Frappe.js comes with built-in backends for data storage. These can be client-side or server-side

- SQLite
- REST

There can be only one backend at a time that can be accessed by the `frappe.db` property.

## API

The backend will implement the following `async` methods

- `get_doc`
- `get_all`
- `get_value`
- `insert`
- `update`

## sqlite Backend

Connection paramter required for the sqlite backend is the path of the file

```js
sqllite = require('frappejs/frappe/backends/sqlite');

frappe.db = await new sqlite.Database({dbPath: dbPath})
```

### SQL Queries

You can also directly write SQL with `frappe.db.sql`

```js
all_todos = frappe.db.sql('select name from todo');
```

## REST Backend

For the client, the backend is the REST API that executes calls with web-requests.

Before using, you must initialize the `frappe.fetch` property with `window.fetch` or `node-fetch`

```js
const Database = require('frappejs/frappe/backends/rest_client').Database;

frappe.fetch = window.fetch.bind();
frappe.db = await new Database({server: server});
```