# Page

A page is a basic container that fills up the `main` area of the Frappe.js SPA.

### Example

```js
const Page = require('frappejs/frappe/client/view/page').Page;

let todo_list = new Page('ToDo List');

// make the current page active
todo_list.show();
```

## Structure

The page has the following elements

1. Body

## Events

You can `show` a page or `hide` a page.

## Bind Events

- `show` when a page is shown
- `hide` when a page is hidden

```js
let todo_list = new Page('ToDo List');

// run the refresh when it is shown
todo_list.on('show', () => todo_list.list.run());
```


## Current Page

The current page is maintained in `frappe.router.current_page` and is set the the lastest shown page.