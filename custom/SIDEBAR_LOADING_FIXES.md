# Sidebar Role Restrictions & Loading Spinner Fixes

## Issues Fixed

### 1. ✅ Hide Setup Tab for Non-Super Admin Users
**Requirement:** Setup tab should only be visible to Super Admin users

**Solution:**
- Added `hidden()` function to Setup root item in sidebar config
- Checks `localStorage.getItem('current_role')`
- Returns `true` (hidden) for all roles except 'Super Admin'

**File Modified:**
- `custom/src/utils/sidebarConfig.ts` (lines 317-321)

**Behavior:**
- Super Admin: Can see Setup tab with all options
- Admin/User: Setup tab is completely hidden

---

### 2. ✅ Hide Report Issue Button for Non-Super Admin Users
**Requirement:** Report Issue button should only be visible to Super Admin users

**Solution:**
- Added `isSuperAdmin` computed property to Sidebar component
- Added `v-if="isSuperAdmin"` directive to Report Issue button
- Checks `localStorage.getItem('current_role')`

**Files Modified:**
- `src/components/Sidebar.vue` (lines 168, 290-293)

**Behavior:**
- Super Admin: Can see and click Report Issue button
- Admin/User: Button is completely hidden

---

### 3. ✅ Hide Change DB Button for Non-Super Admin Users
**Requirement:** Change DB button should only be visible to Super Admin users

**Solution:**
- Added `v-if="isSuperAdmin"` directive to Change DB button
- Uses same `isSuperAdmin` computed property

**Files Modified:**
- `src/components/Sidebar.vue` (line 150)

**Behavior:**
- Super Admin: Can see and click Change DB button
- Admin/User: Button is completely hidden

---

### 4. ✅ Add Loading Spinner During App Initialization
**Issue:** White screen appears during login/app initialization while background operations run

**Root Cause:** 
- When `activeScreen` is `null`, no component is rendered
- This happens during:
  - Initial app load
  - Database connection
  - Authentication check
  - Data initialization

**Solution:**
- Added loading spinner that shows when `activeScreen === null`
- Spinner is centered with "Loading..." text
- Uses Tailwind CSS animations
- Respects dark mode

**File Modified:**
- `src/App.vue` (lines 39-67)

**Behavior:**
- Shows animated circular spinner
- Displays "Loading..." text below spinner
- Automatically disappears when app finishes loading
- Works in both light and dark modes

---

## Technical Details

### Role Check Implementation

**In Sidebar Config:**
```typescript
hidden: () => {
  const currentRole = localStorage.getItem('current_role') || '';
  return currentRole !== 'Super Admin';
}
```

**In Sidebar Component:**
```typescript
computed: {
  isSuperAdmin() {
    const currentRole = localStorage.getItem('current_role') || '';
    return currentRole === 'Super Admin';
  }
}
```

**In Template:**
```vue
<button v-if="isSuperAdmin" ...>
  <!-- Button content -->
</button>
```

### Loading Spinner Implementation

```vue
<div
  v-if="activeScreen === null"
  class="flex-1 flex items-center justify-center bg-gray-25 dark:bg-gray-900"
>
  <div class="flex flex-col items-center gap-4">
    <svg class="animate-spin h-12 w-12 text-gray-600 dark:text-gray-400" ...>
      <!-- SVG spinner paths -->
    </svg>
    <p class="text-gray-600 dark:text-gray-400">Loading...</p>
  </div>
</div>
```

---

## Files Modified

1. **`custom/src/utils/sidebarConfig.ts`**
   - Added `hidden()` function to Setup root item

2. **`src/components/Sidebar.vue`**
   - Added `isSuperAdmin` computed property
   - Added `v-if="isSuperAdmin"` to Report Issue button
   - Added `v-if="isSuperAdmin"` to Change DB button

3. **`src/App.vue`**
   - Added loading spinner component for `activeScreen === null` state

---

## Testing

### Test Role-Based Visibility

**As Super Admin:**
```bash
1. Login as super@rarebooks.com
2. Verify Setup tab is visible in sidebar
3. Scroll to bottom of sidebar
4. Verify "Change DB" button is visible
5. Verify "Report Issue" button is visible
```

**As Admin:**
```bash
1. Create admin user via Users page
2. Logout and login as admin
3. Verify Setup tab is NOT visible
4. Scroll to bottom of sidebar
5. Verify "Change DB" button is NOT visible
6. Verify "Report Issue" button is NOT visible
7. Verify "Logout" button IS visible
```

**As User:**
```bash
1. Create regular user via Users page
2. Logout and login as user
3. Verify Setup tab is NOT visible
4. Verify "Change DB" button is NOT visible
5. Verify "Report Issue" button is NOT visible
6. Verify can access other features based on permissions
```

### Test Loading Spinner

```bash
1. Close app completely
2. Restart app
3. Observe loading spinner during startup
4. Spinner should show while:
   - Connecting to database
   - Initializing fyo
   - Loading user session
5. Spinner disappears when app is ready
6. Test in both light and dark mode
```

---

## User Experience Improvements

### Before Fixes:
- ❌ All users could see Setup, Change DB, Report Issue
- ❌ White screen during loading (confusing, looks broken)
- ❌ No indication of what's happening during initialization

### After Fixes:
- ✅ Role-based access control for sensitive features
- ✅ Clear visual feedback during loading
- ✅ Professional loading experience
- ✅ Better security (non-admin users can't access admin features)
- ✅ Cleaner UI for regular users

---

## Security Notes

1. **UI-Level Protection:** These changes hide UI elements but don't enforce backend security
2. **Backend Validation:** Server-side role checks should also be implemented for API calls
3. **localStorage:** Role is stored in localStorage after login
4. **Session:** Role is validated during authentication

---

## Future Enhancements

1. Add loading progress indicator (e.g., "Connecting to database...")
2. Add loading states for specific operations
3. Implement backend role validation for all sensitive operations
4. Add permission-based feature access beyond just role checks

---

**Status:** All fixes applied and tested ✅

**Benefits:**
- Better UX during app initialization
- Proper role-based access control
- Cleaner interface for non-admin users
- Professional loading experience
