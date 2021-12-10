const { notarize } = require('electron-notarize');

exports.default = async (context) => {
  const { electronPlatformName, appOutDir } = context;
  if (
    electronPlatformName !== 'darwin' ||
    !parseInt(process.env.APPLE_NOTARIZE)
  ) {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'io.frappe.books',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
