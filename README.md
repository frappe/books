# Frappe Books

[![Build Status](https://travis-ci.com/frappe/books.svg?branch=master)](https://travis-ci.com/frappe/books)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/frappe/books)](https://github.com/frappe/books/releases)
![](https://img.shields.io/badge/platform-mac%2C%20windows%2C%20linux-yellowgreen)

Free Desktop book-keeping software for small-businesses and freelancers.

<kbd><img src=".github/frappe-books-preview.png" alt="Frappe Books Preview" /></kbd>

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

Frappe Books is built on [FrappeJS](https://github.com/frappe/frappejs), Vue.js
and Electron. It is offline by default, and uses a local SQLite file as the
database.

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

2. Install [Node.js](https://nodejs.org/en/). Make sure you have atleast version 12 installed.
    > Tip: The best way to install and manage Node is to install [nvm](https://github.com/nvm-sh/nvm#usage)
3. Install `yarn` package manager
    ```bash
    npm install -g yarn
    ```

### Clone and Run

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

### Developing with FrappeJS

FrappeBooks is based on [FrappeJS](https://github.com/frappe/frappejs) for managing models and objects. To develop alongside FrappeJS

```bash
# clone frappejs
git clone https://github.com/frappe/frappejs.git

# link frappejs
cd frappejs
yarn link
yarn link frappejs
```

## License

[GNU Affero General Public License v3.0](LICENSE)
