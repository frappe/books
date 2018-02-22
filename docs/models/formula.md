# Formula

Formulas are dynamic document properties that can be set on the fields

Forumlas are defined as javascript functions and are called whenever any property of the document is updated using the `set` method, or just before inserting or updating the document.

### Example

```js
module.exports = {
    name: "FormulaExample"
    fields: [
        {
            fieldtype: "Float",
            fieldname: "a"
        },
        {
            fieldtype: "Float",
            fieldname: "b"
        }
        {
            fieldtype: "Float",
            fieldname: "c",
            formula: doc => doc.a + doc.b
        }
    ]
}
```

## Formula on child tables

In child tables, both the parent and the child records are passed

### Example

```js
{
    fieldname: "amount",
    fieldtype: "Float",
    formula: (doc, row) => row.qty * row.rate
}
```

## Sequence

All child tables are executed first and all fields are executed in the sequence as defined in the DocType

## Fetching Values

You can use the `getFrom` function to fetch values from another document

Example:

```
{
    "fieldname": "rate",
    "label": "Rate",
    "fieldtype": "Currency",
    formula: (row, doc) => row.rate || doc.getFrom('Item', row.item, 'rate')
}
```

## Async

Forumlas are evaluated as promises, so you can either directly pass a value or a `Promise`