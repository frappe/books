const os = require('os');
const path = require('path');
const { readFile, writeFile } = require('frappejs/server/utils');


function getConfigPath() {
  const homedir = os.homedir();
  return path.join(homedir, '.config', 'frappe-accounting', 'settings.json');
}

function getSettings() {
  let settings;
  const configFilePath = getConfigPath();
  try {
    settings = JSON.parse(readFile(configFilePath));
  } catch (e) {
    console.error(e);
    settings = {};
  }

  return settings;
}

async function saveSettings(settings) {
  const configFilePath = getConfigPath();
  await writeFile(configFilePath, JSON.stringify(settings));
}

module.exports = {
  getSettings,
  saveSettings
};
