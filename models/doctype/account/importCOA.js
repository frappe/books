const frappe = require('frappejs');
const accountFields = ['accountType', 'rootType', 'isGroup'];

async function importAccounts(children, parent, rootType, rootAccount) {
    for (let accountName in children) {
        const child = children[accountName];

        if (rootAccount) {
            rootType = child.rootType;
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
    if (child.isGroup) {
        return child.isGroup;
    }

    if (Object.keys(child).some(key => accountFields.includes(key))) {
        return 0;
    }

    return 1;
}

module.exports = async function importCharts(chart) {
    if (chart) {
        await importAccounts(chart, '', '', true)
    }
}

