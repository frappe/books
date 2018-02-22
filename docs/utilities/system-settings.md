# System Settings

SystemSettings is a [Single document](../models/singles.md) that has system defaults like

- `dateFormat`: default date format

You can get system settings as

```js
frappe.getSingle("SystemSettings")
```