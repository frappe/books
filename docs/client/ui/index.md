# UI

Frappe.js UI library helps create elements from the Native DOM

### frappe.ui.add

Add a new HTMLElement

```js
let div = frappe.ui.add('div', 'box', parentElement);
```

### frappe.ui.remove

Remove a new HTMLElement from its parent

```js
frappe.ui.remove(element);
```

### frappe.ui.add_class

Add a class to an existing document

```js
frappe.ui.add_class(element, 'box');
```

### frappe.ui.make_dropdown

Create and return a new dropdown element

```js
let dropdown = frappe.ui.make_dropdown('Actions', this.toolbar);
```