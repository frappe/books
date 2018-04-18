const os = require('os');
const path = require('path');
const { writeFile } = require('frappejs/server/utils');

const homedir = os.homedir();
const configFilePath = path.join(homedir, '.config', 'frappe-accounting', 'settings.json');

function getSettings() {
    let settings;
    try {
        settings = require(configFilePath);
    } catch (e) {
        settings = {}
    }

    return settings;
}

async function saveSettings(settings) {
    await writeFile(configFilePath, JSON.stringify(settings));
}

module.exports = {
    getSettings,
    saveSettings
}
