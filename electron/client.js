const frappe = require('frappejs');
const path = require('path');
const electron = require('frappejs/client/electron');
const appClient = require('../client');
const SetupWizard = require('../setup');
const { getPDFForElectron } = require('frappejs/server/pdf');
const { getSettings, saveSettings } = require('./settings');
const { postStart } = require('../server');
const { slug } = require('frappejs/utils');

const fs = require('fs');

require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

(async () => {
    let electronSettings = getSettings();
    let firstRun = false, setupWizardValues = null;

    if (!electronSettings.dbPath) {
        const values = await runSetupWizard();
        const dbPath = path.join(values.file[0].path, slug(values.companyName) + '.db');
        const config = {
            directory: path.dirname(dbPath),
            dbPath: dbPath
        };
        await saveSettings(config);

        firstRun = true;
        electronSettings = config;
        setupWizardValues = values;
    }

    await electron.start({
        dbPath: electronSettings.dbPath,
        models: require('../models')
    });

    await postStart();

    if (firstRun) {
        await saveSetupWizardValues(setupWizardValues);
        await bootstrapChartOfAccounts();
    }

    frappe.getPDF = getPDFForElectron;
    frappe.electronSettings = electronSettings;

    appClient.start();
})();

async function runSetupWizard() {
    const setup = new SetupWizard();
    const values = await setup.start();
    return values;
}

async function saveSetupWizardValues(values) {
    const {
        companyName,
        country,
        name,
        email,
        abbreviation,
        bankName
    } = values;

    const doc = await frappe.getDoc('AccountingSettings');

    await doc.set('companyName', companyName);
    await doc.set('country', country);
    await doc.set('fullname', name);
    await doc.set('email', email);
    await doc.set('bankName', bankName);

    await doc.update();
}

async function bootstrapChartOfAccounts() {
    const importCOA = require('../models/doctype/account/importCOA');
    const chart = require('../fixtures/standardCOA');
    await importCOA(chart);
}
