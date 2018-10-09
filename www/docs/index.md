# Frappe Accounting - Accounting Made Simple
Simple desktop accounting software for every business needs!!!

---

## What is Frappe Accounting
Frappe Accounting is a simple JavaScript based software designed for business owners to manage their accounting and finances. Frappe Accounting is based on FrappeJS which is inspired by the Frappe Framework. FrappeJS is MIT licensed and Frappe Accounting is Open Source under the GNU General Public Licence v3. Frappe Accounting works offline, and stores the data in a local file which is portable. It works on all the major operating systems like MacOS, Linux and Windows.

---

## Installing Frappe Accounting
Download the following files based on your Operating Systems and click on it to install.

### Frappe Accounting Beta 0.0.2
- Linux - [frappe-accounting-0.0.2-x86_64.AppImage](https://github.com/frappe/accounting/releases/download/0.0.2/frappe-accounting-0.0.2-x86_64.AppImage)
- MacOS - [Frappe.Accounting-0.0.2.dmg](https://github.com/frappe/accounting/releases/download/0.0.2/Frappe.Accounting-0.0.2.dmg)
- Windows - [Frappe.Accounting.Setup.0.0.2.-.fixed.exe](https://github.com/frappe/accounting/releases/download/0.0.2/Frappe.Accounting.Setup.0.0.2.-.fixed.exe)

To Download Source code
- Zip file - [Source code (zip)](https://github.com/frappe/accounting/archive/0.0.2.zip)
- Tar.gz file - [Source code (tar.gz)](https://github.com/frappe/accounting/archive/0.0.2.tar.gz)

---

## Setting Up

After Installation when you first launch Frappe Accounting, you are presented with the Setup Wizard. The first slide sets up the folder where you want to store the database file.
![image](https://user-images.githubusercontent.com/9355208/46083685-935c1580-c1bf-11e8-8b45-7ab2ecdf7c79.png)

After you are done with the First slide, Second slide sets up the country you are based in. Select the country which you want to choose from the list displayed. The Chart Of Accounts (COA) will be bootstrapped for you depending upon the country that is chosen.
![image](https://user-images.githubusercontent.com/9355208/46083725-aa026c80-c1bf-11e8-98e3-0aa0ebc87166.png)

Third slide sets up the Company information. Fill in the Company name, Bank name, the start and end of the Fiscal year. The Company Name will become the name of your database file. For e.g, if you select `TennisMart` as your Company Name then the application will make `tennisMart.db` as your database file which will be stored in the folder you selected in the first slide.
![image](https://user-images.githubusercontent.com/9355208/46083809-cdc5b280-c1bf-11e8-8f3d-0dd62079c402.png)

Congratulations !!! You are completed with your setup wizard.

---

## Chart of Accounts

After completing the setup, you are presented with Chart of Accounts which is bootstrapped for you based on the country you selected in the Setup Wizard. The Chart of Accounts is nothing but a listing of the names of the accounts that a company has identified and made available for recording transactions in its general ledger. The Chart Of Accounts is displayed in a Tree format according to the Parent-Child relationship among the accounts. We have provided you the flexibility to tailor the chart of accounts to best suit your needs, including adding accounts as needed.
![image](https://user-images.githubusercontent.com/9355208/46086723-5b0c0580-c1c6-11e8-8638-fe6223f57b14.png)

---

## Masters

Master data is the data used to portray the units in General Ledger Accounting that remain unchanged over long periods. It is consistent and uniform set of identifiers and extended attributes that describes the core entities of the enterprise. You can manage your Master Data like Item, Party and Taxes from the sidebar. Click on the sidebar link to go to the list view.

### Party

A Party is someone with whom you'll be doing transactions with. A Party can be a Customer or a Supplier. The Default Account is where the transactions will be booked. Although an option for default account is provided, you can use different accounts for different transactions.  
![image](https://user-images.githubusercontent.com/9355208/46093738-bd203700-c1d5-11e8-932a-5d1e137d7db7.png)

### Item

An Item is your company's Product or Service. You can create an Item for each physical good or service that you offer to your Customers.

Item Properties:
- **Item Name**: Name of your product or service. Must be unique.
- **Unit**: The Unit of Measure of your Item. Kg, Litre, or No
- **Rate**: Selling Price of your Item
- **Description**: More details about your Item, which will be printed in the Invoice

You also need to set the Income Account, where your income will be booked for this Item.
You can also set the Tax which should be applied while making an Invoice.
Expenses are nothing but the cost incurred to generate revenues. Expense Account is a type of temporary account in which all expenses incurred by an entity during an accounting period are stored. You can select the Expense Account in the field provided.
![image](https://user-images.githubusercontent.com/9355208/46093837-125c4880-c1d6-11e8-9c8b-a3b8a3754314.png)

### Taxation

In Frappe Accounting, Taxes is managed via templates. A Tax contains a list of Tax Detail which contain Tax Account and Rate. You can create different Taxes for your Items and set them in the Item Master. You can also apply these taxes while creating an invoice and bill it to the customer.
![image](https://user-images.githubusercontent.com/9355208/46093951-551e2080-c1d6-11e8-921a-7798726a3c0b.png)

---

## Transactions

### Invoicing

An Invoice is a commercial document issued by a seller to a buyer, relating to a sale transaction and indicating the products, quantities, taxes and agreed prices for products or services the seller had provided the buyer. When you submit an Invoice, income is booked against the Customer Account.

Frappe Accounting applies Tax to each Item separately and then clubs them together in the Invoice.
![image](https://user-images.githubusercontent.com/9355208/46093040-f22b8a00-c1d3-11e8-9e4f-6dee58c36804.png)

After you submit the Invoice, you can view the Print format. You can export this to PDF and send it to your Customer.
![image](https://user-images.githubusercontent.com/9355208/46093618-6adf1600-c1d5-11e8-9a1d-2dd5b67f9f6e.png)

You can also view all the Ledger Entries for a particular submitted invoice by clicking on `Ledger Entries` in Actions drop-down.

### Payments

A payment is the transfer of one form of good, service or financial asset in exchange for another form of good, service or financial asset in proportions that have been previously agreed upon by all parties involved. Here, the method of payment is money. To capture a Payment from a Customer, you create a Payment entry. You can find the Make Payment button in the Actions drop-down of a submitted Invoice. Most of the information is fetched from the Invoice. You only need to set the Payment Account. In this case, it is set to Cash.
![image](https://user-images.githubusercontent.com/9355208/46093574-50a53800-c1d5-11e8-9c2a-6fefd4dee814.png)

---

## Reports

### General Ledger Report

A general ledger represents the formal ledger for a company's financial statements with debit and credit account records validated by a trial balance. The ledger provides a complete record of financial transactions over the life of the company. The ledger holds account information that is needed to prepare financial statements and includes accounts for assets, liabilities, owners' equity, revenues and expenses. In simple terms, General Ledger is a detailed report for all transactions posted to each account and for every transaction there is a Credit and Debit account so it lists them all up.

The report is based on Ledger Entries that are made whenever transactions are submitted. This report can be filtered by Party, Account, Type of Transaction and a Date Range.
![image](https://user-images.githubusercontent.com/9355208/46094178-eb524680-c1d6-11e8-91b4-cd68674b7689.png)

### Sales Register

A sales register is a specialized accounting register and it is also a prime entry book used in an accounting system to keep track of the sales of items that customers(debtors) have purchased on account by charging a receivable on the debit side of an accounts receivable account and crediting revenue on the credit side. In simple terms, Sales Register report shows all the Sales transactions for a given period with invoiced amount and tax details. In this report, each taxes has a separate column, so you can easily get total taxes collected for a period for each individual tax type.
![image](https://user-images.githubusercontent.com/9355208/46094405-77646e00-c1d7-11e8-9c7b-0335b14a7515.png)
