# Controls

Frappe.js comes in with built-in controls for various types of inputs

## Creating

A new control can be created with `control.make_control` method.

```js
const controls = require('./controls');

let control = controls.make_control({
	fieldname: 'test',
	fieldtype: 'Data',
	label: 'Test Control'
}, body);
```

## Structure

The control has the following structure of HTML Elements

- `form_group`
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