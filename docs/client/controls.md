# Controls

Frappe.js comes in with built-in controls for various types of inputs

## Creating

A new control can be created with `control.makeControl` method.

```js
const controls = require('./controls');

let control = controls.makeControl({
	fieldname: 'test',
	fieldtype: 'Data',
	label: 'Test Control'
}, body);
```

## Structure

The control has the following structure of HTML Elements

- `formGroup`
	- `label`
	- `input`
	- `description`

## Types

Type of control is defined by the `fieldtype` property.

### Data

Short text input (`<input>`)

## Text

Long text input (`<textarea>`)

## Select

Select a single value from a list of options (`<select>`)

Options can be set in the `options` property as a list

Example:

```js
let control = controls.makeControl({
	fieldname: 'test',
	fieldtype: 'Select',
	label: 'Test Select',
	options: [
		"Option 1",
		"Option 2"
	]
}, body);
```

## Link

You can select a value from another DocType with a Link type field. The value of the target table should be in "target"

Example:

```js
let control = controls.makeControl({
	fieldname: 'user',
	fieldtype: 'Link',
	label: 'User',
	target: 'User'
}, body);
```

## Table

A table control renders a grid object (datatable). The columns of the table are defined by the `childtype` property of the field definition

Example:

```js
let control = controls.makeControl({
	fieldname: 'roles',
	fieldtype: 'Table',
	label: 'Roles',
	childtype: 'User Role'
}, body);
```
