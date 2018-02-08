# Forms

Forms are automatically created from the model (DocType)

Form objects create the controls and also handler insert and update.

Note: A single Form object can handle multiple documents.

### Example

```js
const Page = require('frappejs/frappe/client/view/page');
const Form = require('frappejs/frappe/client/view/form');

edit_page = new Page('Edit To Do');

router.add('/edit/todo/:name', edit_page);

edit_page.form = new Form({
	doctype: 'ToDo',
	parent: edit_page.body
});
```

## Creating

To create a new Form, you need to pass the model (DocType) and `parent` element.

Controls will be created for all the `fields` of the model that is passed along with a `Submit` button

## Set Document for Editing

To setup a form for editing, you can bind a document by calling the `use` method.

```js
edit_page.on('show', async (params) => {
	let doc = await frappe.get_doc('ToDo', params.name);
	edit_page.form.use(doc);
})
```

## Extending

You can extend the form for any DocType by passing creating a module with `_client` suffix. For example `account_client` for Account

The module can export two classes `Form` and `List` these will be used to override the forms and list for the given doctypes

Example:

```js
const BaseForm = require('frappejs/client/view/form');

class AccountForm extends BaseForm {
    make() {
        super.make();

        // override controller event
        this.controls['parent_account'].get_filters = (query) => {
            return {
                keywords: ["like", query],
                name: ["!=", this.doc.name]
            }
        }
    }
}

module.exports = {
    Form: AccountForm
}
```

## New Document

To setup a form for a new document, just create a new document with the Frappe.js document helpers, and `use` it with paramter `is_new` = true

```js
// setup todo new
frappe.router.add('new/todo', async (params) => {

	// new document
	app.doc = await frappe.getDoc({doctype: 'ToDo'});

	// set a random name
	app.doc.setName();

	// show the page
	app.edit_page.show();

	// is_new=true
	app.edit_page.form.use(app.doc, true);
});
```