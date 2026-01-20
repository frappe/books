# Import Path Fixes

## Issues Resolved

Fixed Vite import resolution errors for custom modules by:

1. **Added `custom` alias to vite.config.ts** (Line 38)
   ```typescript
   custom: path.resolve(__dirname, './custom'),
   ```

2. **Added `custom` alias to build.mjs** (Line 86)
   ```javascript
   custom: path.join(root, 'custom'),
   ```

3. **Added custom models to ModelNameEnum** in `models/types.ts` (Lines 84-87)
   ```typescript
   // Custom models
   User = 'User',
   SystemUser = 'SystemUser',
   Expense = 'Expense',
   License = 'License',
   ```

4. **Fixed import paths in custom files:**
   - `custom/src/pages/Login.vue` - Uses `custom/models/User`
   - `custom/src/utils/sidebarConfig.ts` - Uses `src/initFyo`
   - `custom/src/components/SyncNotification.vue` - Uses `custom/models/License`

## Files Modified

### Configuration Files
- `vite.config.ts` - Added custom alias
- `build/scripts/build.mjs` - Added custom alias
- `models/types.ts` - Added custom model names to enum

### Custom Files
- `custom/src/pages/Login.vue` - Fixed User import
- `custom/src/utils/sidebarConfig.ts` - Fixed fyo import
- `custom/src/components/SyncNotification.vue` - Fixed License import
- `custom/models/User.ts` - Removed duplicate ModelNameEnum declaration

## Verification

All imports now use the proper alias paths:
- `custom/*` - For custom models, schemas, and components
- `src/*` - For core application files
- `models/*` - For upstream models
- `fyo` - For Fyo framework

The TypeScript configuration in `tsconfig.json` already had the `custom/*` path configured (line 28), so no changes were needed there.

## Testing

After these fixes, run:
```bash
yarn dev
```

The application should now start without import resolution errors.
