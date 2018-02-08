# Lists

A list object handles object listing and paging, for a standard model.

### Example

```js
const Page = require('frappejs/frappe/client/view/page');
const List = require('frappejs/frappe/client/view/list');

// create a new page
let todo_list = new Page('ToDo List');

// init a new list
todo_list.list = new List({
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

## Extending

Lists can be extended by defining a client module for the doctype, similar to forms

```js
const BaseList = require('frappejs/client/view/list');

class ToDoList extends BaseList {
    getFields()  {
        return ['name', 'subject', 'status'];
    }
    getRowHTML(data) {
        let symbol = data.status=="Closed" ? "✔" : "";
        return `<a href="#edit/todo/${data.name}">${symbol} ${data.subject}</a>`;
    }
}

module.exports = {
    List: ToDoList
}
```