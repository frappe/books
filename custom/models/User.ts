import { Doc } from 'fyo/model/doc';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';

export class User extends Doc {
  username?: string;
  password?: string;
  full_name?: string;
  role?: string;
  organization?: string;
  enabled?: boolean;
  last_login?: Date;

  async beforeInsert() {
    // Auto-set organization from AccountingSettings
    if (!this.organization) {
      const companyName = await this.fyo.getValue('AccountingSettings', 'companyName');
      this.organization = companyName as string;
    }

    // Hash password before storing
    if (this.password && !this.password.startsWith('$pbkdf2$')) {
      // Only hash if not already hashed
      this.password = await this.hashPassword(this.password);
    }
  }

  async beforeUpdate() {
    // If password field is being updated, hash it
    const passwordChanged = this.dirtyMap.get('password');
    if (passwordChanged && this.password && !this.password.startsWith('$pbkdf2$')) {
      this.password = await this.hashPassword(this.password);
    }
  }

  async hashPassword(plainPassword: string): Promise<string> {
    if (this.fyo.isElectron) {
      // Use IPC to hash password in main process
      return await ipc.hashPassword(plainPassword);
    }
    // Fallback for non-electron (should not be used in production)
    return plainPassword;
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    if (!this.password) return false;
    
    if (this.fyo.isElectron) {
      return await ipc.validatePassword(plainPassword, this.password);
    }
    // Fallback for non-electron
    return plainPassword === this.password;
  }

  async updateLastLogin() {
    await this.set('last_login', new Date());
    await this.sync();
  }

  static async authenticate(
    fyo: any,
    email: string,
    password: string
  ): Promise<User | null> {
    try {
      // Find user by email
      const userExists = await fyo.db.exists(ModelNameEnum.User, email);
      if (!userExists) {
        return null;
      }

      const user = (await fyo.doc.getDoc(ModelNameEnum.User, email)) as User;

      // Check if user is enabled
      if (!user.enabled) {
        return null;
      }

      // Validate password
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return null;
      }

      // Update last login
      await user.updateLastLogin();

      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  static getListViewSettings() {
    return {
      columns: ['username', 'full_name', 'role', 'organization', 'enabled', 'last_login'],
    };
  }

  formattedValue(fieldname: string, doc?: Doc): string | null {
    // Show dots for existing passwords, but allow input for new users
    if (fieldname === 'password' && this.password && this.password.startsWith('$pbkdf2$')) {
      return '••••••••';
    }
    return super.formattedValue(fieldname, doc);
  }

  hidden(fieldname: string): boolean {
    // Don't hide password field - it's needed for creating users
    return super.hidden(fieldname);
  }
}
