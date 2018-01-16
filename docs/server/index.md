# Server

The framework comes bundles with an `express.js` web server with pre-built backends, [REST API](rest.md) and ORM.

### Example

```js
const server = require('frappejs/frappe/server');

server.start({
	backend: 'sqllite',
	connection_params: {db_path: 'test.db'},
	static: './',
	port: 8000
});
```

By starting a server, Frappe will automatically handle REST calls for all the declared models.

Database migration (syncing the tables based on models) is also done at the time of server start.