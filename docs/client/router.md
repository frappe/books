# Client-side Routing

The Frappe.js client comes in with a built in router, that is handles via hashing (example `#route`)

## Adding new route handlers

You can add a new route by calling `frappe.router.add`

Dynamic routes can be added by declaring each parameter as `:param` in the route string (similar to express.js)

### Example

```js
const Page = require('frappejs/frappe/client/view/page').Page;

let todo_list = new Page('ToDo List');

// make the current page active
todo_list.show();

// to do list
frappe.router.add('default', () => {
	todo_list.show();
	todo_list.list.run();
});

// setup todo form
frappe.router.add('edit/todo/:name', async (params) => {
	app.doc = await frappe.get_doc('ToDo', params.name);
	app.edit_page.show();
	app.edit_page.form.use(app.doc);
});

// setup todo new
frappe.router.add('new/todo', async (params) => {
	app.doc = await frappe.get_doc({doctype: 'ToDo'});
	app.doc.set_name();
	app.edit_page.show();
	app.edit_page.form.use(app.doc, true);
});
```

## Setting route

You can change route with

```js
await frappe.router.setRoute('list', 'todo');
```

## Getting current route

`frappe.router.getRoute()` will return the current route as a list.

```js
await frappe.router.setRoute('list', 'todo');

// returns ['list', 'todo'];
route = frappe.router.getRoute();
```

## Show a route

To set a route, you can call `frappe.router.show(route_name)`

```js
frappe.router.show(window.location.hash);
```