const frappe = require('frappejs');
const path = require('path');
const fs = require('fs');
const countries = require('../../../fixtures/countryInfo.json');
const standardCOA = require('../../../fixtures/verified/standardCOA.json');
const accountFields = ['accountType', 'rootType', 'isGroup', 'account_type', 'root_type', 'is_group'];

async function importAccounts(children, parent, rootType, rootAccount) {
    for (let accountName in children) {
        const child = children[accountName];

        if (rootAccount) {
            rootType = child.rootType || child.root_type;
        }

        if (!accountFields.includes(accountName)) {
            let isGroup = identifyIsGroup(child);
            const doc = frappe.newDoc({
                doctype: 'Account',
                name: accountName,
                parentAccount: parent,
                isGroup,
                rootType,
                accountType: child.accountType
            })

            await doc.insert()

            await importAccounts(child, accountName, rootType)
        }
    }
}

function identifyIsGroup(child) {
    if (child.isGroup || child.is_group) {
        return child.isGroup || child.is_group;
    }

    const keys = Object.keys(child);
    const children = keys.filter(key => !accountFields.includes(key))

    if (children.length) {
        return 1;
    }

    return 0;
}

async function getCountryCOA(){
    const doc = await frappe.getDoc('AccountingSettings');
    const conCode = countries[doc.country].code;

    const countryCOA = path.resolve(path.join('./fixtures/verified/', conCode + '.json'));
    
    if(fs.existsSync(countryCOA)){
        const jsonText = fs.readFileSync(countryCOA, 'utf-8');
        const json = JSON.parse(jsonText);
        return json.tree;
    } else {
        return standardCOA;
    }
}

module.exports = async function importCharts() {
    const chart = await getCountryCOA();
    await importAccounts(chart, '', '', true)
}

