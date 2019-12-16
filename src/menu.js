const { remote } = require('electron');
const { Menu } = remote;

function openMenu() {
  const menu = Menu.getApplicationMenu();
  menu.popup({ window: remote.getCurrentWindow() });
}

module.exports = {
  openMenu
};
