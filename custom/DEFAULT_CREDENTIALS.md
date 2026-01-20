# Default Super Admin Credentials

## Automatic Super Admin Creation

When you create a new company database for the first time, a default super admin user is automatically created. This allows you to immediately access the application and start creating other users or organizations.

## Default Credentials

**Email:** `super@rarebooks.com`  
**Username:** `superadmin`  
**Password:** `super@5378`  
**Role:** Super Admin

## First Login

1. Run the application: `yarn dev`
2. Create a new company (the "New Company" button will be visible)
3. Complete the setup wizard
4. On the login page, use the credentials above
5. You'll be redirected to the database selector or desk

## After First Login

As the super admin, you can:
- ✅ Create new organizations/companies
- ✅ Create other users with Admin or User roles
- ✅ Manage all aspects of the application
- ✅ Access the Users menu under Setup

## Security Best Practices

### For Development
The default credentials are fine for development and testing purposes.

### For Production
**IMPORTANT:** Change the default super admin password immediately after first login!

To change the password:
1. Login as super admin
2. Go to Setup → Users
3. Find the super admin user
4. Update the password to a strong, secure password
5. Save changes

## How It Works

The default super admin is created by:
- `custom/setup/createDefaultSuperAdmin.ts` - Contains the creation logic
- `custom/setup/setupInstanceCustom.ts` - Wrapper that extends base setup
- Called automatically during company database initialization
- Only creates the user if no users exist in the database

## Technical Details

- Password is hashed using PBKDF2 (10,000 iterations) before storage
- The super admin is not tied to any specific organization (organization = null)
- The user is created during the `setupInstance` process after all other setup is complete
- If user creation fails, the setup continues (non-blocking)

## Troubleshooting

### Can't login with default credentials?

1. **Check if the user exists:**
   - Open the database file with a SQLite browser
   - Check the User table for `super@rarebooks.com`

2. **User doesn't exist:**
   - The super admin creation may have failed
   - Check console logs during setup for errors
   - Manually create the user through the database

3. **Password not working:**
   - Ensure password hashing is working correctly
   - Check that IPC handlers are registered
   - Verify the password hash in the database starts with `$pbkdf2$`

4. **Login page not appearing:**
   - The login flow is separate from initial setup
   - You may need to implement the login route integration

## Changing Default Credentials

To change the default credentials for your deployment, edit:
`custom/setup/createDefaultSuperAdmin.ts`

Update lines 35-41:
```typescript
const superAdminDoc = fyo.doc.getNewDoc(ModelNameEnum.User, {
  name: 'your-email@domain.com',        // Change email
  username: 'yourusername',              // Change username
  password: hashedPassword,              // Password set in line 27
  full_name: 'Your Name',                // Change display name
  role: 'Super Admin',                   // Keep as Super Admin
  enabled: true,
  organization: null,
});
```

And update the password in line 27:
```typescript
hashedPassword = await ipc.hashPassword('YourNewPassword123!');
```

## Integration with Authentication Flow

The default super admin works seamlessly with the authentication system:
- Can login through `custom/src/pages/Login.vue`
- Session is tracked in SystemUser singleton
- Role-based access control applies (Super Admin has full access)
- Can create organizations and other users through the UI

---

**Remember:** These credentials are for initial access only. Always change them in production environments!
