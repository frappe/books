# Schema

Main purpose of this is to describe the shape of the models' table in the
database. But there is some irrelevant information in the schemas with
respect to this goal. This is information is allowed as long as it is not
dynamic, which is impossible anyways as the files are data (`.json`, not `.js`)

If any field has to have a dynamic value, it should be added to the controller
file by the same name, check the `books/models` subdirectory for this.

There are a few types of schemas:

- **Regional**: Schemas that are in the _'../regional'_ subdirectories
  these can be of any of the below types.
- **Abstract**: Schemas that are not used as they are but only after they are
  extended by Stub schemas. Indentified by the `isAbstract` field
- **Subclass**: Schemas that have an `"extends"` field on them, the value of which
  points to an Abstract schema.
- **Complete**: Schemas which are neither abstract nor stub.

For more detail on the meta structure of the schema check `books/schemas/types.ts`.

## Final Schema

This is the schema which is used by the database and app code and is built by
combining the above types of schemas.

The order in which a schema is built is:

1. Build _Regional_ schemas by overriding the fields and other properties of the
   non regional variants.
2. Combine _Subclass_ schemas with _Abstract_ schemas to get complete schemas.

_Note: if a Regional schema is not present as a non regional
variant it's used as it is._

## Additional Notes

In all the schemas, the `"name"` field/column is the primary key. If it isn't
explicitly added, the schema builder will add it in.

The following schema fields will be implicitly translated by the frontend:
`"label"`, `"description"`, and `"placeholder"`, irrespective of nesting.
