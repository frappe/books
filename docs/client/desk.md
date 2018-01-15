# Desk

Desk includes the default routing and menu system for the single page application

## Menus

You can add a new menu to the desk via

```js
frappe.desk.add_sidebar_item('New ToDo', '#new/todo');
```

## Views

Default route handling for various views

### List Documents

All list views are rendered at `/list/:doctype`

### Edit Documents

Documents can be edited via `/edit/:doctype/:name`

### New Documents

New Documents can be created via `/new/:doctype`