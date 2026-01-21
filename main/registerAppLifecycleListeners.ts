import { app } from 'electron';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import { Main } from '../main';
import { rendererLog } from './helpers';
import { emitMainProcessError } from 'backend/helpers';
import { licenseManager } from 'custom/licensing';

export default function registerAppLifecycleListeners(main: Main) {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (main.mainWindow === null) {
      main.createWindow().catch((err) => emitMainProcessError(err));
    }
  });

  app.on('ready', () => {
    if (main.isDevelopment && !main.isTest) {
      installDevTools(main).catch((err) => emitMainProcessError(err));
    }

    // Perform startup license check if enabled
    if (process.env.ENABLE_LICENSING !== 'false') {
      performStartupLicenseCheck(main);
    }

    main.createWindow().catch((err) => emitMainProcessError(err));
  });
}

async function installDevTools(main: Main) {
  try {
    await installExtension(VUEJS3_DEVTOOLS);
  } catch (e) {
    rendererLog(main, 'Vue Devtools failed to install', e);
  }
}

async function performStartupLicenseCheck(main: Main) {
  try {
    // Perform background license validation on startup
    const result = await licenseManager.checkLicense();
    
    if (!result.isValid) {
      rendererLog(
        main,
        'License validation failed on startup',
        {
          state: result.licenseState,
          message: result.message,
        }
      );
    } else if (result.gracePeriodInfo) {
      // Log grace period warnings
      const { daysRemaining, isExpiring } = result.gracePeriodInfo;
      if (isExpiring) {
        rendererLog(
          main,
          `License grace period expiring soon: ${daysRemaining} days remaining`
        );
      }
    }
  } catch (error) {
    // Don't block app startup on license check errors
    rendererLog(main, 'Error during startup license check', error);
  }
}
