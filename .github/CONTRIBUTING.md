# Contributing to Frappe Books

If you are a Frappe Books user and want to contribute to improving it _without
writing code_, there are several things you can do:

- **Inform us of issues** that you face while using Frappe Books by [raising issues](https://github.com/frappe/books/issues/new)
- **Add a language** you would like to use Frappe Books in by [contributing translation](https://github.com/frappe/books/wiki/Contributing-Translations).
- **Share your thoughts** on Frappe Books by joining our [Telegram group](https://t.me/frappebooks).
- **Use Frappe Books** for your accounting requirements and tell people about it.

---

If you want to contribute code to Frappe Books, please go through the following sections for tips and guidelines:

- [Code Quality](#code-quality)
- [Contributing Features](#contributing-features)
- [Writing Tests](#writing-tests)

## Code Quality

<!-- TODO: Complete This Section with examples -->

## Contributing Features

When contributing features, these points should be ensured:

### Invisible until Required

We strive to make Frappe Books as easy and simple to use as possible, and
Progressive Disclosure is one of the design patterns that enables us to do this.

- **Big Features**: ensure that the feature should be hidden using feature
  flags unless needed by majority users. Example: inventory features are
  hidden until _Enable Inventory_ is checked in the Settings.

- **Small Features**: ensure that they stay hidden until needed until the
  context is relevant. Example: extra fields in the Invoice Items table aren't
  shown unless the User clicks on the Edit Row button.

Added feature should not silently alter existing functionality until the user is
aware of it.

### Simple UI

A few rules of thumb to follow if your contributions alters the UI.

- Do not crowd the UI.
- Ensure even spacing, most spacing and sizes are an even multiple of `1rem`.
- Ensure vertical and horizontal alignment. For text ensure vertical baseline
  alignment.
- Simple Labels, ideally just a single word. Avoid overflow and word-breaks.
- Child tables should have at most 5 columns. Extra columns should should be
  jadded to the row edit form.

This website:
[anthonyhobday.com/sideprojects/saferules](https://anthonyhobday.com/sideprojects/saferules/)
contains several safe rules to follow. If you're unsure of your design go
through the list. Do not break them without judgement.

### Documentation and Tests

We know documentation and tests are boring, but they're important and we need
you to add them for large changes.

- **Documentation**: If the feature being added requires an explanation then
  [documentation](https://docs.frappebooks.com/) should be updated in the
  [frappe/books_docs](https://github.com/frappe/books_docs) repository.
  _Add a link to the documentation PR in your feature PR._
- **Tests**: If your features alters business logic then tests should be added.

## Writing Tests

You should write tests. If your features alter business logic and there are no
tests then it is imperative to write tests.

Here are a few rules of thumb to ensure that the tests you're writing are meaningful:

- **Test values that should have changed against expected change.** If values
  after an operation are not as expected, the tests should fail.
- **Test values that shouldn’t have changed.** If values which shouldn’t have
  changed also change, the test should fail.
- **Don’t alter previously written tests,** unless they’re failing due to changes
  in implementation.
- **Don’t write tests for code that has already been tested,** unless you have
  reason to believe that they could have changed.
- **Manually test your changes using the UI atleast once**.
- Don’t write tests for the sake of writing tests.
- Don’t write tests just cause you aren’t sure how something executes.
- Write tests cause you want to ensure that something continues to execute in
  the way you intend for it to be executed.
- Write tests cause manually clicking through the UI to check your changes is
  time-consuming and not feasibly repeatable.
- Write tests to catch unaccounted-for edge cases, then write code to account
  for those edge cases.
