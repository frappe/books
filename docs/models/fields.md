# Fields

Fields are properties a the document instance that are defined in its DocType.

## Field Types

### Data

Small, single line text (140 chars)

### Text

Long multi-line text

### Int

Integer

### Float

Number

### Currency

Number with currency

### Code

Code string (like Text but monospaced)

### Date

Date (formatted by [SystemSettings.dateFormat](../utilities/system-settings.md))

### Select

Dropdown with fixed options. Options must be set in the `options` property

```
{
    fieldtype: "Select",
    fieldname: "status",
    label: "Status",
    options: [
        "Open",
        "Closed",
        "Pending"
    ]

}
```

### Link

Reference to another document set by `target`

```
{
    fieldtype: "Link",
    fieldname: "customer",
    label: "Customer",
    target: "Customer"
}
```

### Table

Property with child documents, the type of children is defined by `childtype` property

```
{
    fieldtype: "Table",
    fieldname: "items",
    label: "Items",
    target: "InvoiceItem"
}
```
