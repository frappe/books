import { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';

/**
 * Creates a default super admin user if no users exist
 * This allows immediate access to the application without manual user creation
 */
export async function createDefaultSuperAdmin(fyo: Fyo): Promise<void> {
  try {
    // Check if any users already exist
    const existingUsers = await fyo.db.getAllRaw(ModelNameEnum.User, {
      fields: ['name'],
      limit: 1,
    });

    if (existingUsers && existingUsers.length > 0) {
      console.log('Users already exist, skipping default super admin creation');
      return;
    }

    console.log('Creating default super admin user...');

    // Hash the default password
    let hashedPassword = 'super@5378'; // Fallback to plain text
    if (fyo.isElectron) {
      try {
        hashedPassword = await ipc.hashPassword('super@5378');
      } catch (error) {
        console.error('Failed to hash password, using fallback:', error);
      }
    }

    // Create the default super admin user
    const superAdminDoc = fyo.doc.getNewDoc(ModelNameEnum.User, {
      name: 'super@rarebooks.com',
      username: 'superadmin',
      password: hashedPassword,
      full_name: 'Super Administrator',
      role: 'Super Admin',
      enabled: true,
      organization: null, // Super admin is not tied to any organization
    });

    await superAdminDoc.sync();
    console.log('Default super admin created successfully');
    console.log('Email: super@rarebooks.com');
    console.log('Username: superadmin');
    console.log('Password: super@5378');
  } catch (error) {
    console.error('Failed to create default super admin:', error);
    // Don't throw - allow setup to continue even if this fails
  }
}

/**
 * Credentials for the default super admin
 * Email: super@rarebooks.com
 * Username: superadmin
 * Password: super@5378
 * 
 * SECURITY NOTE: Change this password immediately after first login in production!
 */
