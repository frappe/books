# Contributing to Frappe Books

If you are a Frappe Books user and want to contribute to improving it _without
writing code_, there are several things you can do:

- **Inform us of issues** you face while using Frappe Books by [raising issues](https://github.com/frappe/books/issues/new).
- **Add a language** you would like to use Frappe Books in by [contributing translation](https://github.com/frappe/books/wiki/Contributing-Translations).
- **Share your thoughts** on Frappe Books by joining our [Telegram group](https://t.me/frappebooks).
- **Use Frappe Books** for your accounting requirements and tell people about it.

---

If you want to contribute code to Frappe Books, please go through the following sections for tips and guidelines:

- [Code Quality](#code-quality)
- [Contributing Features](#contributing-features)
  - [Invisible until required](#invisible-until-required)
  - [Simple UI](#simple-ui)
  - [Documentation and Tests](#documentation-and-tests)
  - [PR Description](#pr-description)
- [Writing Tests](#writing-tests)

## Code Quality

A few rules of thumb to ensure that you're contributing maintainable code to Frappe Books:

- **Readability over succinctness**: If your succinct code takes longer to parse (as
  in read and understand) then it is bad code because we aren’t playing code
  golf.
  - **Write short functions** such that the name of the function accurately describes
    what the function does.
  - **Use early exits** ([reference](https://softwareengineering.stackexchange.com/questions/18454/should-i-return-from-a-function-early-or-use-an-if-statement)).
  - **Don’t nest conditionals and loops**. If you find the need for
    nested loops or conditionals, wrap the inner loop or conditional in a function
    and call it in the outer code block.
  - In general, understand why chunking and naming information is helpful when it
    comes to comprehension.
- **Succinctness over readability only if it is significantly more performant**:
  For example, if your code goes from `O(n)` to `O(log(n))` then it’s okay to
  sacrifice readability. In such a case, add comments that mention what is going
  on.
- **Don't Write comments**: Variable names, function names and easy to read code
  should do what a comment would.
- **Write comments only if the code can't be explained by its context** such as
  if the code is esoteric for the sake of performance.
- **Rebase don't merge**: Merge commits are ugly and should be used only to
  merge a large PR.
- **Format your code**: Frappe Books uses `prettier` and `eslint` rules for code
  styling and linting, please make sure you have run them and fixed your code
  accordingly before pushing.
- **Use TypeScript**: Even the `*.vue` files should use TypeScript ([reference](https://vuejs.org/guide/typescript/overview.html#usage-in-single-file-components)).

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

### PR Description

All pull requests should have a meaningful and detailed description. The following things should be in mentioned in the description:

- **What the change is** should be described in sufficient detail, _not_ a
  single line such as _"This PR adds `[some_feature]`"_.
- **Screenshots** should be added if the change affects the UI.

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
