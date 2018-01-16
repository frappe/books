# Dropdown

Creates a Dropdown button with JS events

## API

Methods

- `add_item`
- `float_right`
- `expand`
- `collapse`
- `toggle`

## Usage

### Create

```js
const Dropdown = require('frappejs/frappe/client/ui/dropdown');

let dropdown = new Dropdown({label:'Actions', parent:this.toolbar});
```

### Add Item

Add a new link to the dropdown

```js
dropdown.add_item('Delete', async () => {
	this.show_alert('Deleted', 'success');
});
```

### Float Right

Move the element to the right

```js
dropdown.float_right();
```