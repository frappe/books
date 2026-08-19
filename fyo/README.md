# Fyo

This is the underlying framework that runs **Books**, at some point it may be
removed into a separate repo, but as of now it's in gestation.

The reason for maintaining a framework is to allow for varied backends.
Currently Books runs on the electron renderer process and all db stuff happens
on the electron main process which has access to nodelibs. As the development
of `Fyo` progresses it will allow for a browser frontend and a node server
backend.

This platform variablity will be handled by code in the `fyo/demux` subdirectory.

## Pre Req

**Singleton**: The `Fyo` class is used as a singleton throughout Books, this
allows for a single source of truth and a common interface to access different
modules such as `db`, `doc` an `auth`.

**Localization**: Since Books' functionality changes depending on region,
regional information (`countryCode`) is required in the initialization process.

**`Doc`**: This is `fyo`'s abstraction for an ORM, the associated files are
located in `model/doc.ts`, all classes exported from `books/models` extend this.

### Terminology

- **Schema**: object that defines shape of the data in the database.
- **Model**: the controller class that extends the `Doc` class, or the `Doc`
  class itself (if a specific controller doesn't exist).
- **doc** (not `Doc`): instance of a Model, i.e. what has the data.

If you are confused, I understand.

## Initialization

There are a set of core models which are maintained in the `fyo/models`
subdirectory, from this the _SystemSettings_ field `countryCode` is used to
config regional information.

A few things have to be done on initialization:

#### 1. Connect To DB

If creating a new instance then `fyo.db.createNewDatabase` or if loading an
instance `fyo.db.connectToDatabase`.

Both of them take `countryCode` as an argument, `fyo.db.createNewDatabase`
should be passed the `countryCode` as the schemas are built on the basis of
this.

#### 2. Initialize and Register

Done using `fyo.initializeAndRegister` after a database is connected, this should be
passed the models and regional models.

This sets the schemas and associated models on the `fyo` object along with a few
other things.

### Sequence

**First Load**: i.e. registering or creating a new instance.

- Get `countryCode` from the setup wizard.
- Create a new DB using `fyo.db.createNewDatabase` with the `countryCode`.
- Get models and `regionalModels` using `countryCode` from `models/index.ts/getRegionalModels`.
- Call `fyo.initializeAndRegister` with the all models.

**Next Load**: i.e. logging in or opening an existing instance.

- Connect to DB using `fyo.db.connectToDatabase` and get `countryCode` from the return.
- Get models and `regionalModels` using `countryCode` from `models/index.ts/getRegionalModels`.
- Call `fyo.initializeAndRegister` with the all models.

_Note: since **SystemSettings** are initialized on `fyo.initializeAndRegister`
db needs to be set first else an error will be thrown_

## Testing

For testing the `fyo` class, `mocha` is used (`node` side). So for this the
demux classes are directly replaced by `node` side managers such as
`DatabaseManager`.

For this to work the class signatures of the demux class and the manager have to
be the same which is maintained by abstract demux classes.

`DatabaseManager` is used as the `DatabaseDemux` for testing without API or IPC
calls. For `AuthDemux` the `DummyAuthDemux` class is used.

## Translations

All translations take place during runtime, for translations to work, a
`LanguageMap` (for def check `utils/types.ts`) has to be set.

This can be done using `fyo/utils/translation.ts/setLanguageMapOnTranslationString`.

Since translations are runtime, if the code is evaluated before the language map
is loaded, translations won't work. To prevent this, don't maintain translation
strings globally since this will be evaluated before the map is loaded.

## Observers

The doc and db handlers have observers (instances of `Observable`) as
properties, these can be accessed using

- `fyo.db.observer`
- `fyo.doc.observer`

The purpose of the observer is to trigger registered callbacks when some `doc`
operation or `db` operation takes place.

These are schema level observers i.e. they are registered like so:
`method:schemaName`. The callbacks receive args passed to the functions.
