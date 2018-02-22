# Single Documents

Single doctypes have only one instance. They are useful for using DocTypes as views or for settings.

To make a Single DocType, set the `isSingle` property as true.

Single documents are best viewed in a modal since they do not have a corresponding list view.

Values of single documents are stored in the table `SingleValue`

## API

### frappe.getSingle

Load a single document

```js
let systemSettings = frappe.getSingle('SystemSettings');
```

Since Single documents are also documents, you can update them with the `update()` method.
