import { ipcMain } from 'electron';
import * as crypto from 'crypto';

// Use Node.js crypto for password hashing
// Note: In production, consider using bcrypt package for better security
const SALT_ROUNDS = 10;

function hashPasswordSync(password: string): string {
  // Using PBKDF2 as a bcrypt alternative (built into Node.js)
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `$pbkdf2$${salt}$${hash}`;
}

function validatePasswordSync(password: string, hashedPassword: string): boolean {
  try {
    if (hashedPassword.startsWith('$pbkdf2$')) {
      const parts = hashedPassword.split('$');
      const salt = parts[2];
      const originalHash = parts[3];
      const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return hash === originalHash;
    }
    // Fallback for plain text comparison (should not be used)
    return password === hashedPassword;
  } catch (error) {
    console.error('Password validation error:', error);
    return false;
  }
}

export function registerAuthHandlers() {
  ipcMain.handle('hash-password', async (event, password: string) => {
    try {
      return hashPasswordSync(password);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw error;
    }
  });

  ipcMain.handle('validate-password', async (event, password: string, hash: string) => {
    try {
      return validatePasswordSync(password, hash);
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  });

  ipcMain.handle('validate-license', async (event, licenseKey: string) => {
    try {
      // TODO: Implement actual license validation with remote server
      // For now, return a mock response
      return {
        valid: true,
        status: 'Valid',
        lastValidated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('License validation error:', error);
      return {
        valid: false,
        status: 'Error',
        error: error.message,
      };
    }
  });
}
