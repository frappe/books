# Frappe Books

Free Desktop book-keeping software for small-businesses and freelancers.

<kbd><img src=".github/frappe-books-preview.png" alt="Frappe Books Preview" /></kbd>

# Download

Download the latest release for your platform from the [releases
page](https://github.com/frappe/books/releases).

# Development

Frappe Books is built on [FrappeJS](https://github.com/frappe/frappejs), Vue.js
and Electron. It is offline by default, and uses a local SQLite file as the
database.

## Installation

### Pre-requisites

Install build essentials

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

### Step 1

Install [Node.js](https://nodejs.org/en/) (version 12.6.0)

> Tip: The best way to install and manage Node is to install [nvm](https://github.com/nvm-sh/nvm#usage)

### Step 2

Install `yarn` package manager.

```bash
npm install -g yarn
```

### Step 3

Clone this repo

```bash
git clone https://github.com/frappe/books.git
```

### Step 4

```bash
cd books

# Install dependencies
yarn

# Start the electron app
yarn electron:serve
```
