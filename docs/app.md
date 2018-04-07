# Creating a new App

## Install Frappe.js

```
yarn add frappejs
```

FrappeJS comes with built in rollup config for your files

## Build

There are 2 files that get built for the Desk single page application

- `/dist/js/bundle.js`
- `/dist/css/style.css`

Your `rollup.config.js` should look like:

```js
module.exports = [
	require('frappejs/config/rollup.config.style.js'),
	require('frappejs/config/rollup.config.app.js')
]
```

## Create a basic app

### index.html

The UI for the single page app (desk) will be built inside the `body` element, so you just need to have an empty body element, and link your JS bundle in `index.html`

Sample index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Document</title>
	<link href="/dist/css/style.css" rel="stylesheet">
</head>
<body>
	<script src="/dist/js/socket.io.js"></script>
	<script src="js/bundle.js"></script>
</body>
</html>
```
## For development setup

Clone frappejs in the same folder as your app, since you will be developing frappejs on the side.

### Link frappejs

```sh
# make frappejs linkable
cd frappejs

yarn link
yarn link frappejs

# link frappejs in all
cd ../myapp
yarn link frappejs

# install libs
yarn
```

### server.js

Create your server file `server.js`

```js
const server = require('frappejs/server');

server.start({
    backend: 'sqlite',
    connection_params: {db_path: 'test.db'},
    static: './'
});
```

### index.js

In your client file you will have to import all your controllers and init them.

`frappejs/client` lib will initialize your server and user interface with the Desk.

Example starting point for a to-do app:

```js
const client = require('frappejs/client');
const todo = require('frappejs/models/doctype/todo/todo.js');

// start server
client.start({
    server: 'localhost:8000',
}).then(() => {
    frappe.init_controller('todo', todo);

    frappe.desk.add_sidebar_item('Home', '#');
    frappe.desk.add_sidebar_item('New ToDo', '#new/todo');

    frappe.router.default = '/list/todo';
    frappe.router.show(window.location.hash);
});
```

## Start

To start the app and build webpack simultaneously you can use a `Procfile`

```yml
server: nodemon server.js
watch: node_modules/.bin/rollup -c --watch
```

You can use any procfile handler like `node-foreman` to start the processes.

```
yarn global add node-foreman
```

Then

```
nf start
```
