# Default Super Admin Implementation

## Summary

Added automatic creation of a default super admin user during first company setup. This eliminates the need for manual user creation or database modifications.

## Files Created

1. **`custom/setup/createDefaultSuperAdmin.ts`**
   - Contains logic to create the default super admin
   - Only creates user if no users exist in database
   - Hashes password using PBKDF2
   - Non-blocking (setup continues even if creation fails)

2. **`custom/setup/setupInstanceCustom.ts`**
   - Wrapper around base `setupInstance`
   - Calls `createDefaultSuperAdmin` after base setup completes
   - Maintains all original setup functionality

3. **`custom/DEFAULT_CREDENTIALS.md`**
   - Complete documentation of default credentials
   - Security best practices
   - Troubleshooting guide
   - Instructions for changing defaults

## Files Modified

1. **`src/App.vue`** (Line 58)
   - Changed import from `./setup/setupInstance` to `../custom/setup/setupInstanceCustom`
   - Uses custom setup wrapper instead of base setup

2. **`tsconfig.json`** (Line 56)
   - Added `"custom/**/*.vue"` to includes
   - Ensures custom Vue files are type-checked

3. **`custom/IMPLEMENTATION_COMPLETE.md`**
   - Updated with default credentials information
   - Added security warnings for production

## Default Credentials

```
Email:    super@rarebooks.com
Username: superadmin
Password: super@5378
Role:     Super Admin
```

## Usage Flow

### First Time Setup

1. **Run the application:**
   ```bash
   yarn dev
   ```

2. **Create new company:**
   - Click "New Company" button
   - Complete setup wizard
   - Default super admin is created automatically

3. **Login:**
   - Login page will appear (or navigate to it)
   - Use credentials above
   - Access granted immediately!

4. **Post-Login:**
   - Create organizations
   - Add other users (Admin/User roles)
   - Change super admin password in production

### Subsequent Setups

- Default super admin is only created **once** (when User table is empty)
- Creating additional companies does NOT create duplicate super admins
- Existing super admin can login to any company database

## Security Considerations

### Development Environment
✅ Default credentials are acceptable
✅ Easy access for testing
✅ Quick setup for development

### Production Environment
⚠️ **MUST change default password immediately**
⚠️ Consider changing default email/username
⚠️ Implement password complexity requirements
⚠️ Enable audit logging for super admin actions

### How to Change Defaults

Edit `custom/setup/createDefaultSuperAdmin.ts`:

```typescript
// Line 35-41: Change user details
const superAdminDoc = fyo.doc.getNewDoc(ModelNameEnum.User, {
  name: 'your-email@company.com',     // Change email
  username: 'yourusername',            // Change username
  password: hashedPassword,
  full_name: 'Your Name',              // Change display name
  role: 'Super Admin',
  enabled: true,
  organization: null,
});

// Line 27: Change password
hashedPassword = await ipc.hashPassword('YourSecurePassword123!');
```

## Integration Points

### Authentication System
- Works with `custom/src/pages/Login.vue`
- Password validation uses same hashing
- Session management via SystemUser singleton

### User Management
- Appears in Users list (Setup → Users)
- Can be edited like any other user
- Password can be changed through UI
- Cannot delete last super admin

### Role-Based Access
- Full access to all features
- Can create organizations (New Company button visible)
- Can assign any role to other users
- Not tied to specific organization

## Technical Implementation

### Password Hashing
```typescript
// Uses PBKDF2 via IPC
hashedPassword = await ipc.hashPassword('super@5378');
// Result: $pbkdf2$[salt]$[hash]
```

### User Creation
```typescript
// Happens in setupInstanceCustom after all base setup
await setupInstance(...);  // Original setup
await createDefaultSuperAdmin(fyo);  // Custom addition
```

### Database Check
```typescript
// Only creates if no users exist
const existingUsers = await fyo.db.getAllRaw(ModelNameEnum.User, {
  fields: ['name'],
  limit: 1,
});

if (existingUsers && existingUsers.length > 0) {
  return; // Skip creation
}
```

## Benefits

✅ **No manual intervention needed** - User is created automatically
✅ **Immediate access** - Can login right after setup
✅ **UI-based management** - Create other users through interface
✅ **Consistent experience** - Same flow for all installations
✅ **Secure by default** - Password is properly hashed
✅ **Non-invasive** - Only created when needed
✅ **Production-ready** - With password change reminder

## Testing Checklist

- [ ] Super admin created on first company setup
- [ ] Can login with default credentials
- [ ] Can create new organizations
- [ ] Can create other users (Admin/User)
- [ ] Can edit own password through UI
- [ ] Second company setup does NOT create duplicate
- [ ] Password is properly hashed in database
- [ ] Session management works correctly
- [ ] Role-based features work as expected
- [ ] Console shows creation success message

## Troubleshooting

### User Not Created
**Check console logs during setup for errors**
- Password hashing might have failed
- Database permissions issue
- Schema not loaded correctly

### Can't Login
**Verify user exists in database**
```sql
SELECT * FROM User WHERE name = 'super@rarebooks.com';
```
**Check password hash format**
- Should start with `$pbkdf2$`
- If plain text, hashing failed

### Multiple Super Admins
**Should not happen, but if it does:**
- Check the existingUsers query logic
- Verify database connection during check
- May be running setup multiple times

## Maintenance

### Updating Default Password
1. Edit `custom/setup/createDefaultSuperAdmin.ts` line 27
2. Update `custom/DEFAULT_CREDENTIALS.md`
3. Inform all developers of new credentials
4. Rebuild application

### Removing Default User
**Not recommended, but if needed:**
1. Comment out line 19 in `custom/setup/setupInstanceCustom.ts`
2. Revert to manual user creation flow
3. Update documentation accordingly

---

**Implementation complete and ready for use!** 🎉

Default super admin will be created automatically on first company setup.
