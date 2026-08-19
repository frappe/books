// This file extends the IPC interface with custom auth methods
// These will be merged with the main preload.ts

export const authIpcExtensions = {
  async hashPassword(password: string): Promise<string> {
    return (await ipcRenderer.invoke('hash-password', password)) as string;
  },

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return (await ipcRenderer.invoke('validate-password', password, hash)) as boolean;
  },

  async validateLicense(licenseKey: string): Promise<{
    valid: boolean;
    status: string;
    lastValidated?: string;
    error?: string;
  }> {
    return await ipcRenderer.invoke('validate-license', licenseKey);
  },
};

// TypeScript declaration for extending global ipc
declare global {
  interface Window {
    ipc: {
      hashPassword(password: string): Promise<string>;
      validatePassword(password: string, hash: string): Promise<boolean>;
      validateLicense(licenseKey: string): Promise<{
        valid: boolean;
        status: string;
        lastValidated?: string;
        error?: string;
      }>;
    };
  }
}
