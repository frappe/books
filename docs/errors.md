# Errors

Frappe.js comes with standard error classes that have an HTTP status code attached.

For example you can raise a "not found" (HTTP Status Code 404) via:

```js
throw new frappe.errors.NotFound('Document Not Found');
```

### Standard Errors

- 403: Forbidden
- 404: NotFound
- 417: ValidationError
- 417: ValueError