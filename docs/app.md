# Creating a new App

## Install Frappe.js

```
yarn add frappejs
```

## Webpack

You can use webpack to build your JS bundle.

Since Frappe.js use Bootstrap 4, you will need to add SASS handlers

Your `webpack.config.js` should look like:

```js
const path = require('path');

module.exports = {
    entry: './index.js',
    devtool: 'inline-source-map',
    output: {
        filename: './js/bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
            {
                loader: "style-loader" // creates style nodes from JS strings
            },
            {
                loader: "css-loader" // translates CSS into CommonJS
            },
            {
                loader: 'postcss-loader', // Run post css actions
                options: {
                  plugins: function () { // post css plugins, can be exported to postcss.config.js
                    return [
                      require('precss'),
                      require('autoprefixer')
                    ];
                  }
                },
            },
            {
                loader: "sass-loader", // compiles Sass to CSS
                options: {
                    includePaths: ["node_modules", "./client/scss"]
                }
            }]
        }]
    }
};
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
</head>
<body>
	<script src="js/bundle.js"></script>
</body>
</html>
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
watch: node_modules/.bin/webpack --watch
```

You can use any procfile handler like `node-foreman` to start the processes.

```
yarn global add node-foreman
```

Then

```
nf start
```