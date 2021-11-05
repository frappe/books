import frappe from 'frappejs';
const _ = frappe._.bind(frappe);

export default {
    [_("Application of Funds (Assets)")]: {
        [_("Current Assets")]: {
            [_("Accounts Receivable")]: {
                [_("Debtors")]: {
                    "accountType": "Receivable"
                }
            },
            [_("Bank Accounts")]: {
                "accountType": "Bank",
                "isGroup": 1
            },
            [_("Cash In Hand")]: {
                [_("Cash")]: {
                    "accountType": "Cash"
                },
                "accountType": "Cash"
            },
            [_("Loans and Advances (Assets)")]: {
                "isGroup": 1
            },
            [_("Securities and Deposits")]: {
                [_("Earnest Money")]: {}
            },
            [_("Stock Assets")]: {
                [_("Stock In Hand")]: {
                    "accountType": "Stock"
                },
                "accountType": "Stock",
            },
            [_("Tax Assets")]: {
                "isGroup": 1
            }
        },
        [_("Fixed Assets")]: {
            [_("Capital Equipments")]: {
                "accountType": "Fixed Asset"
            },
            [_("Electronic Equipments")]: {
                "accountType": "Fixed Asset"
            },
            [_("Furnitures and Fixtures")]: {
                "accountType": "Fixed Asset"
            },
            [_("Office Equipments")]: {
                "accountType": "Fixed Asset"
            },
            [_("Plants and Machineries")]: {
                "accountType": "Fixed Asset"
            },
            [_("Buildings")]: {
                "accountType": "Fixed Asset"
            },
            [_("Softwares")]: {
                "accountType": "Fixed Asset"
            },
            [_("Accumulated Depreciation")]: {
                "accountType": "Accumulated Depreciation"
            }
        },
        [_("Investments")]: {
            "isGroup": 1
        },
        [_("Temporary Accounts")]: {
            [_("Temporary Opening")]: {
                "accountType": "Temporary"
            }
        },
        "rootType": "Asset"
    },
    [_("Expenses")]: {
        [_("Direct Expenses")]: {
            [_("Stock Expenses")]: {
                [_("Cost of Goods Sold")]: {
                    "accountType": "Cost of Goods Sold"
                },
                [_("Expenses Included In Valuation")]: {
                    "accountType": "Expenses Included In Valuation"
                },
                [_("Stock Adjustment")]: {
                    "accountType": "Stock Adjustment"
                }
            },
        },
        [_("Indirect Expenses")]: {
            [_("Administrative Expenses")]: {},
            [_("Commission on Sales")]: {},
            [_("Depreciation")]: {
                "accountType": "Depreciation"
            },
            [_("Entertainment Expenses")]: {},
            [_("Freight and Forwarding Charges")]: {
                "accountType": "Chargeable"
            },
            [_("Legal Expenses")]: {},
            [_("Marketing Expenses")]: {
                "accountType": "Chargeable"
            },
            [_("Miscellaneous Expenses")]: {
                "accountType": "Chargeable"
            },
            [_("Office Maintenance Expenses")]: {},
            [_("Office Rent")]: {},
            [_("Postal Expenses")]: {},
            [_("Print and Stationery")]: {},
            [_("Round Off")]: {
                "accountType": "Round Off"
            },
            [_("Salary")]: {},
            [_("Sales Expenses")]: {},
            [_("Telephone Expenses")]: {},
            [_("Travel Expenses")]: {},
            [_("Utility Expenses")]: {},
            [_("Write Off")]: {},
            [_("Exchange Gain/Loss")]: {},
            [_("Gain/Loss on Asset Disposal")]: {}
        },
        "rootType": "Expense"
    },
    [_("Income")]: {
        [_("Direct Income")]: {
            [_("Sales")]: {},
            [_("Service")]: {}
        },
        [_("Indirect Income")]: {
            "isGroup": 1
        },
        "rootType": "Income"
    },
    [_("Source of Funds (Liabilities)")]: {
        [_("Current Liabilities")]: {
            [_("Accounts Payable")]: {
                [_("Creditors")]: {
                    "accountType": "Payable"
                },
                [_("Payroll Payable")]: {},
            },
            [_("Stock Liabilities")]: {
                [_("Stock Received But Not Billed")]: {
                    "accountType": "Stock Received But Not Billed"
                },
            },
            [_("Duties and Taxes")]: {
                "accountType": "Tax",
                "isGroup": 1
            },
            [_("Loans (Liabilities)")]: {
                [_("Secured Loans")]: {},
                [_("Unsecured Loans")]: {},
                [_("Bank Overdraft Account")]: {},
            },
        },
        "rootType": "Liability"
    },
    [_("Equity")]: {
        [_("Capital Stock")]: {
            "accountType": "Equity"
        },
        [_("Dividends Paid")]: {
            "accountType": "Equity"
        },
        [_("Opening Balance Equity")]: {
            "accountType": "Equity"
        },
        [_("Retained Earnings")]: {
            "accountType": "Equity"
        },
        "rootType": "Equity"
    }
};