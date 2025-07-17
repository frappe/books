<div align="center" markdown="1">
<br/>

<img src="https://frappe.io/files/books.png" alt="Frappe Books logo" width="80"/>

<br/>

<h1>Frappe Books</h1>

**Modern Accounting Made Simple**

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/frappe/books)](https://github.com/frappe/books/releases)
![Platforms](https://img.shields.io/badge/platform-mac%2C%20windows%2C%20linux-yellowgreen)
[![Publish](https://github.com/frappe/books/actions/workflows/publish.yml/badge.svg)](https://github.com/frappe/books/actions/workflows/publish.yml)

</div>

<div align="center">
<img src="https://user-images.githubusercontent.com/29507195/207267857-4ae48890-3fb2-4046-80cf-3256b46c72a0.png" alt="Frappe Books Preview"/>
</div>
<br />
<div align="center">
	<a href="https://frappe.io/books">Website</a>
	-
	<a href="https://docs.frappe.io/books">Documentation</a>
</div>

## Frappe Books

Frappe Books is an open-source accounting software aimed at simplifying financial management for businesses. With its clean and user-friendly interface, it streamlines accounting tasks for small and medium-sized enterprises, offering a seamless solution for modern businesses to manage their finances with ease.

<details>
<summary>Screenshots</summary>
<br/>
<img  alt="Pos" src="https://github.com/user-attachments/assets/f75116b4-cf5f-45ee-9927-ba380fa56a46" />
    <br/><br/>
    <img  alt="General Ledger" src="https://github.com/user-attachments/assets/58d8bcdf-1576-4008-b010-7054fb64a12d" />
    <br/><br/>
    <img  alt="Profit and Loss" src="https://github.com/user-attachments/assets/11bd67d1-d808-496b-ac4d-ef68c18b9419" />

</details>

### Motivation

Frappe Books addresses a market gap where small businesses face expensive, complex accounting tools. It offers an intuitive, open-source solution that combines simplicity with essential features, empowering businesses to manage finances effectively—even offline.

### Key Features

- **Dashboard**: Provides an overview of key financial data and performance metrics.
- **Point of Sale**: Simplifies retail transactions with an integrated POS system for easy sales processing.
- **Works Offline**: Enables users to continue working without an internet connection and sync later.
- **Double-entry accounting**: Ensures accurate financial tracking by recording each transaction in two accounts.
- **Entries**
  - **Invoicing**: Allows businesses to create and manage professional invoices effortlessly.
  - **Billing**: Billing processes by generating bills and tracking payments.
  - **Payments**: Records and tracks payments received and made.
  - **Journal Entries**: Records financial transactions in the general ledger with detailed notes and adjustments.
- **Financial Reports**
  - **General Ledger**: Centralized record of all financial transactions, providing a comprehensive view of accounts.
  - **Profit and Loss Statement**: Summarizes revenues, costs, and expenses to show business profitability.
  - **Balance Sheet**: Displays a company’s assets, liabilities, and equity at a specific point in time.
  - **Trial Balance**: Verifies the accuracy of accounting records by ensuring that debits and credits are balanced.
    <br/>

### Under the Hood

- **Vue.js**: In Frappe Books, Vue.js powers the front-end, enabling a reactive and component-based UI. It ensures seamless interactions and dynamic updates, giving users a modern, responsive experience.

- **Electron**: Electron is used to package Frappe Books as a standalone desktop application, allowing it to run offline and provide a native-like experience across Windows, macOS, and Linux.

- **SQLite**: Frappe Books uses SQLite as its local database. All financial data, transactions, and configurations are stored securely in an SQLite file on the user's machine.

## Production Setup

### Manual

Download and install the latest release for your platform from the [releases
page](https://github.com/frappe/books/releases) .

### Using Homebrew (for MacOS and Linux)

```zsh
brew install --cask frappe-books
```

### Via Flatpak (Linux)

<a href='https://flathub.org/apps/io.frappe.books'>
    <img width='120' alt='Get it on Flathub' src='https://flathub.org/api/badge?locale=en'/>
</a>

## Development Setup

### Pre-requisites

To get the dev environment up and running you need to first set up Node.js `v20.18.1` and npm. For this, we suggest using
[nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

Next, you will need to install [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable).

### Clone and Run

Once you are through the Pre-requisites, you can run the following commands to
setup Frappe Books for development and building:

```bash
# clone the repository
git clone https://github.com/frappe/books.git

# change directory
cd books

# install dependencies
yarn
```

To run Frappe Books in development mode (with hot reload, etc):

```bash
# start the electron app
yarn dev
```

**Note: First Boot**

When you run `yarn dev` electron will run immediately but the UI will take a
couple of seconds to render this because of how dev mode works. Each file is
individually served by the dev server. And there are many files that have to be
sent.

**Note: Debug Electron Main Process**

When in dev mode electron runs with the `--inspect` flag which allows an
external debugger to connect to port 5858. You can use chrome for this by
visiting `chrome://inspect` while Frappe Books is running in dev mode.

See more [here](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process#external-debuggers).

#### Build

To build Frappe Books and create an installer:

```bash
# start the electron app
yarn build
```

**Note: Build Target**
By default the above command will build for your computer's operating system and
architecture. To build for other environments (example: for linux from a windows
computer) check the _Building_ section at
[electron.build/cli](https://www.electron.build/cli).

So to build for linux you could use the `--linux` flag like so: `yarn build --linux`.

## Want to Just Try Out or Contribute?

If you want to contribute to Frappe Books, please check our [Contribution Guidelines](https://github.com/frappe/books/blob/master/.github/CONTRIBUTING.md). There are many ways you can contribute even if you don't code:

1. If you find any issues, no matter how small (even typos), you can [raise an issue](https://github.com/frappe/books/issues/new) to inform us.
2. You can help us with language support by [contributing translations](https://github.com/frappe/books/wiki/Contributing-Translations).
3. If you're an ardent user you can tell us what you would like to see.
4. If you have accounting requirements, you can become an ardent user. 🙂

If you want to contribute code then you can fork this repo, make changes and raise a PR. ([see how to](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork))

## Translation Contributors

| Language              | Contributors                                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arabic                | [taha2002](https://github.com/taha2002), [Faridget](https://github.com/faridget)                                                                                                                                                                  |
| Catalan               | Dídac E. Jiménez                                                                                                                                                                                                                                  |
| Chinese - Simplified  | [wcxu21](https://github.com/wcxu21), [wolone](https://github.com/wolone), [Ji Qu](https://github.com/winkidney)                                                                                                                                   |
| Chinese - Traditional | [Ethan Deng](https://github.com/ethandengs)                                                                                                                                                                                                       |
| Danish                | [Tummas Joensen](https://github.com/slang123)                                                                                                                                                                                                     |
| Dutch                 | [RijckAlex](https://github.com/RijckAlex), [Stan M](https://github.com/stxm)                                                                                                                                                                      |
| French                | [DeepL](https://www.deepl.com/), [mael-chouteau](https://github.com/mael-chouteau), [joandreux](https://github.com/joandreux)                                                                                                                     |
| German                | [DeepL](https://www.deepl.com/), [barredterra](https://github.com/barredterra), [promexio](https://github.com/promexio), [C2H6-383](https://github.com/C2H6-383), [0xflotus](https://github.com/0xflotus), [Tim](https://github.com/Rocket-Quack) |
| Gujarati              | [dhruvilxcode](https://github.com/dhruvilxcode), [4silvertooth](https://github.com/4silvertooth)                                                                                                                                                  |
| Hindi                 | [bnsinghgit](https://github.com/bnsinghgit)                                                                                                                                                                                                       |
| Indonesian            | [Aji Prakoso](https://github.com/jipraks)                                                                                                                                                                                                         |
| Korean                | [Isaac-Kwon](https://github.com/Isaac-Kwon)                                                                                                                                                                                                       |
| Portuguese            | [DeepL](https://www.deepl.com/), [Valdir Amaral](https://github.com/valdir-amaral)                                                                                                                                                                |
| Spanish               | [talmax1124](https://github.com/talmax1124), [delbertf](https://github.com/delbertf)                                                                                                                                                              |
| Swedish               | [papplo](https://github.com/papplo), [Crims-on](https://github.com/Crims-on)                                                                                                                                                                      |
| Turkish               | Eyuq, [XTechnology-TR](https://github.com/XTechnology-TR)                                                                                                                                                                                         |

## Learn and connect

- [Telegram Group](https://t.me/frappebooks): Used for discussions and decisions regarding everything Frappe Books.
- [GitHub Discussions](https://github.com/frappe/books/discussions): Used for discussions around a specific topic.
- [Documentation](https://docs.frappe.io/books): Offaicial documentation for more details.
