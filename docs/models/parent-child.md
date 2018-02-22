# Parent Child Relationship

All documents can have child documents, identified by the `Table` field.

Though child documents have their own DocType and database table, but are not to handled or viewed on their own. FrappeJS will automatically load child documents along with the parent when you use the `frappe.getDoc` method.

### Example

A sample parent-child records looks like this:

```
{
    doctype: "Invoice",
    customer: "Harry Potter",
    items: [
        {
            item: "Wand",
            qty: 1,
            rate: 300,
            amount: 300
        },{
            item: "Invisibility Cloak",
            qty: 1,
            rate: 3000,
            amount: 3000
        }
    ]
}
```

## Child Properties

Child documents have special properties that define their relationship to their parent

- `parent`: name of the parent
- `parenttype`: DocType of the parent
- `parentfield`: Field in the parent that links this child to it
- `idx`: Sequence (row)

These properties are maintained in the table automatically by FrappeJS