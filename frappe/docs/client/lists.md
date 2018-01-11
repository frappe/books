# Lists

A list object handles object listing and paging, for a standard model.

### Example

```js
const Page = require('frappe-core/frappe/client/view/page').Page;
const ListView = require('frappe-core/frappe/client/view/list').ListView;

// create a new page
let todo_list = new Page('ToDo List');

// init a new list
todo_list.list = new ListView({
	doctype: 'ToDo',
	parent: this.todo_list.body
});

todo_list.on('show', () => {
	// refresh on show
	todo_list.list.run();
})
```

## Creating a new List

You can create a new list object by passing the `DocType` and the parent element of the list

## Refreshing

To reload the list, call the `run` method