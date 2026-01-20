# Final Integration Steps

## Add SyncNotification to Desk Component

To display the license sync notification, add the SyncNotification component to the Desk view.

### Option 1: Modify src/pages/Desk.vue directly

Add the import and component at the top of the template:

```vue
<script>
import SyncNotification from '../../custom/src/components/SyncNotification.vue';

export default {
  components: {
    // ... existing components
    SyncNotification,
  },
  // ... rest of component
}
</script>

<template>
  <div>
    <!-- Add SyncNotification at the top -->
    <SyncNotification />
    
    <!-- Existing Desk content -->
    <!-- ... -->
  </div>
</template>
```

### Option 2: Create custom/src/pages/DeskCustom.vue (Recommended)

Copy Desk.vue to custom/src/pages/DeskCustom.vue and make changes there, then update App.vue to use it.

## Testing the Application

### 1. Build and Run
```bash
# Install dependencies
yarn

# Run in development mode
yarn dev
```

### 2. Create First Super Admin User

Since the database will be empty on first run, you'll need to create an initial super admin user. There are two approaches:

#### Approach A: Direct Database Insert (After creating first company)
After creating your first company database, add a super admin:

```sql
-- Connect to the .books.db file and run:
INSERT INTO User (
  name, 
  username, 
  password, 
  full_name, 
  role, 
  enabled,
  organization,
  createdAt,
  modifiedAt
) VALUES (
  'admin@rarebooks.com',
  'admin',
  '$pbkdf2$[SALT]$[HASH]',  -- Use IPC to generate this
  'System Administrator',
  'Super Admin',
  1,
  NULL,
  datetime('now'),
  datetime('now')
);
```

#### Approach B: Temporarily Allow User Creation (Easier)

1. Temporarily modify `custom/src/pages/DatabaseSelectorCustom.vue` line 345:
   ```typescript
   // Change from:
   if (!sessionToken || !currentUser) {
     return true;
   }
   
   // To always return true during first setup:
   return true;  // TODO: Remove after creating super admin
   ```

2. Create a new company
3. Create your super admin user through the Users interface
4. Revert the change above

### 3. Test Authentication Flow

1. **Test Login Page:**
   - Try logging in with wrong credentials → Should show error toast, inputs stay enabled
   - Login with correct credentials → Should redirect to DatabaseSelector or Desk

2. **Test DatabaseSelector:**
   - Verify "Welcome to Rare Books" appears
   - As Super Admin: "New Company" button should be visible
   - As Admin/User: "New Company" button should be hidden

3. **Test User Management:**
   - Navigate to Setup → Users
   - Create new users with Admin and User roles
   - Verify Super Admin role is not assignable by Admin users
   - Verify password field is hidden

4. **Test Expense List:**
   - Navigate to Expenses
   - Create a new expense
   - Verify list shows: date, vendor, expense account, amount, description columns
   - Verify description is saved correctly

5. **Test License Sync:**
   - Wait 7 days or modify database to simulate 7 days
   - Verify notification appears at bottom-right
   - Click "Sync Now" and verify it works
   - Dismiss and verify it doesn't appear for 24 hours

## Upstream Sync Test

To test upstream-sync safety:

```bash
# 1. Commit your custom directory
git add custom/
git commit -m "Add Rare Books customizations"

# 2. Create a patch for upstream changes
git diff main/registerIpcMainActionListeners.ts > custom/patches/ipc-handlers.patch
git diff main/preload.ts > custom/patches/preload.patch
git diff src/App.vue > custom/patches/app-vue.patch
git diff src/components/Sidebar.vue > custom/patches/sidebar.patch

# 3. Try syncing with upstream
git fetch upstream
git merge upstream/master

# 4. If conflicts occur in upstream files, resolve them
# Then reapply the custom changes:
patch -p1 < custom/patches/ipc-handlers.patch
patch -p1 < custom/patches/preload.patch
patch -p1 < custom/patches/app-vue.patch
patch -p1 < custom/patches/sidebar.patch

# 5. Test the application
yarn dev
```

## Common Issues & Solutions

### Issue: "Cannot find module 'custom/...'"
**Solution:** Ensure tsconfig.json includes custom paths. The existing config should work, but verify paths are correct.

### Issue: IPC handlers not working
**Solution:** Verify `registerAuthHandlers()` is called in `main/registerIpcMainActionListeners.ts`

### Issue: Users sidebar not showing
**Solution:** Check localStorage for 'current_role' - it should be set after login

### Issue: Expense columns not showing
**Solution:** Clear browser cache and reload. The schema may need to be reloaded.

### Issue: Login page keeps failing
**Solution:** 
1. Check that User table exists in database
2. Verify password hashing IPC handlers are registered
3. Check console for errors

## Production Deployment

Before deploying to production:

1. **Security:**
   - [ ] Replace mock license validation with real server endpoint
   - [ ] Configure HTTPS for license server
   - [ ] Review password hashing settings (consider increasing iterations)
   - [ ] Set up proper session token encryption
   - [ ] Configure CORS if using remote license server

2. **Database:**
   - [ ] Create backup mechanism
   - [ ] Set up database migrations for schema changes
   - [ ] Create initial super admin user
   - [ ] Configure database file permissions

3. **Licensing:**
   - [ ] Implement actual license server API
   - [ ] Set up license key generation system
   - [ ] Configure offline grace period (currently 7 days)
   - [ ] Set up license renewal notifications

4. **Testing:**
   - [ ] Complete all items in testing checklist
   - [ ] Test on all target platforms (Windows, macOS, Linux)
   - [ ] Test database sync with actual license server
   - [ ] Test multi-user scenarios
   - [ ] Test role-based access restrictions

5. **Documentation:**
   - [ ] Update user manual with new features
   - [ ] Document license key distribution process
   - [ ] Create admin guide for user management
   - [ ] Document backup and restore procedures

## Support

For issues or questions:
1. Check `custom/IMPLEMENTATION_COMPLETE.md` for feature details
2. Review the original plan in Warp Drive
3. Check console logs for errors
4. Verify all upstream integration files are correctly modified
