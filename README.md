<div align="center" markdown="1">

<img src=".github/logo.png" alt="Frappe Books logo" width="384"/>

---

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/frappe/books)](https://github.com/frappe/books/releases)
![Platforms](https://img.shields.io/badge/platform-mac%2C%20windows%2C%20linux-yellowgreen)
[![Publish](https://github.com/frappe/books/actions/workflows/publish.yml/badge.svg)](https://github.com/frappe/books/actions/workflows/publish.yml)


Free Desktop book-keeping software for small-businesses and freelancers.

<img src=".github/frappe-books-preview.png" alt="Frappe Books Preview" />

</div>


## Features

1. Double-entry accounting
1. Invoicing
1. Billing
1. Payments
1. Journal Entries
1. Dashboard
1. Works Offline
1. Financial Reports
    - General Ledger
    - Profit and Loss Statement
    - Balance Sheet
    - Trial Balance
1. Multi-currency Invoicing

## Download

Download the latest release for your platform from the [releases
page](https://github.com/frappe/books/releases).

## Development

Frappe Books is built on Vue.js and Electron. It is offline by default, and uses
a local SQLite file as the database.

### Pre-requisites

1. Install build essentials

    Ubuntu

    ```bash
    apt-get install build-essential python git
    apt-get install libgconf-2-4
    ```

    MacOS

    ```bash
    xcode-select --install
    ```

    You will also need [Xcode App](https://apps.apple.com/in/app/xcode/id497799835?mt=12) from App Store

2. Install [Node.js](https://nodejs.org/en/). Check the `package.json` file for the node version.
    > Tip: The best way to install and manage Node is to install [nvm](https://github.com/nvm-sh/nvm#usage)
3. Install `yarn` package manager
    ```bash
    npm install -g yarn
    ```

### Clone and Run

Due to some `yarn.lock` issue this won't run, to run it check [Issue #315](https://github.com/frappe/books/issues/315)

```bash
# clone the repository
git clone https://github.com/frappe/books.git

# change directory
cd books

# install dependencies
yarn

# start the electron app
yarn electron:serve
```


### FAQ

1. Launching electron and nothing displays
https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/24#issuecomment-770165389
```bash
sudo chown root node_modules/electron/dist/chrome-sandbox && sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

## License

[GNU Affero General Public License v3.0](LICENSE)
