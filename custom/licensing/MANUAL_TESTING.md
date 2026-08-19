# Manual Testing Guide: Licensing System

## Prerequisites

Before testing, ensure you have:

1. **Keymint.dev Account**: Sign up at https://keymint.dev
2. **API Credentials**: Obtain from your keymint.dev dashboard
3. **Environment Variables**: Create a `.env` file in the project root:

```env
KEYMINT_API_URL=https://api.keymint.dev
KEYMINT_ACCESS_TOKEN=your_access_token_here
KEYMINT_PRODUCT_ID=your_product_id_here
ENABLE_LICENSING=true
```

4. **Development Environment**: 
   - Node.js v20.18.1+
   - npm installed
   - Dependencies installed (`npm install --legacy-peer-deps`)

## Test Scenarios

### 1. First-Time Activation (Online)

**Objective**: Verify that a new user can activate their license for the first time.

**Steps**:
1. Start the app in dev mode: `npm run dev`
2. Clear any existing license cache:
   - Windows: Delete `%APPDATA%\frappe-books\license-cache`
   - macOS: Delete `~/Library/Application Support/frappe-books/license-cache`
   - Linux: Delete `~/.config/frappe-books/license-cache`
3. Open the License Activation dialog (see UI Integration Guide)
4. Enter a valid license key from keymint.dev
5. Click "Activate"

**Expected Results**:
- ✅ Success message displayed
- ✅ License state changes to `ACTIVE_ONLINE`
- ✅ License cached locally with encryption
- ✅ Device ID bound to license in keymint.dev

**How to Verify**:
- Open Developer Tools (F12)
- Check console for: `License activated successfully`
- Verify license cache file was created
- Check keymint.dev dashboard for activation record

---

### 2. Online Validation (Connected)

**Objective**: Verify that the system validates licenses online when connected.

**Steps**:
1. Ensure you have an activated license (complete Test 1)
2. Restart the app
3. Ensure internet connection is active
4. Wait for automatic background validation (occurs on startup)

**Expected Results**:
- ✅ License validated against keymint.dev API
- ✅ `lastSyncDate` updated in cache
- ✅ License state remains `ACTIVE_ONLINE`
- ✅ No grace period warnings

**How to Verify**:
- Check console for: `License validation: ACTIVE_ONLINE`
- Inspect license cache file (should show recent `lastSyncDate`)
- Use IPC to call `check-license` action via DevTools:
  ```js
  await window.ipc.invoke('check-license')
  ```

---

### 3. Offline Mode (Grace Period Active)

**Objective**: Verify the system works offline within the grace period.

**Steps**:
1. Activate license online (complete Test 1)
2. Disconnect from internet (disable WiFi/Ethernet)
3. Restart the app
4. Check license status

**Expected Results**:
- ✅ App continues to function
- ✅ License state changes to `ACTIVE_OFFLINE`
- ✅ Grace period info shows days remaining
- ✅ No warnings if within first 5 days

**How to Verify**:
- Open LicenseStatus component
- Verify badge shows "Offline Mode"
- Console should show: `Offline validation: X days remaining`
- Call `get-license-state` via IPC:
  ```js
  const state = await window.ipc.invoke('get-license-state')
  console.log(state) // Should include gracePeriodInfo
  ```

---

### 4. Grace Period Expiring Warning

**Objective**: Verify warnings appear when grace period is almost expired.

**Steps**:
1. Manually modify the license cache to simulate old sync date:
   - Locate cache file (see Test 1 for paths)
   - Decrypt if needed or modify JSON
   - Set `lastSyncDate` to 6 days ago
2. Restart the app
3. Check for warning notifications

**Expected Results**:
- ⚠️ Warning notification displayed
- ⚠️ License state changes to `GRACE_EXPIRING`
- ⚠️ Shows "1 day remaining" or similar
- ⚠️ Prompts user to reconnect

**How to Verify**:
- Check for warning toast/notification in UI
- Console: `Grace period expiring: X days remaining`
- LicenseStatus badge should show warning state

---

### 5. Grace Period Expired

**Objective**: Verify app behavior when grace period expires.

**Steps**:
1. Manually modify license cache:
   - Set `lastSyncDate` to 8+ days ago
2. Restart the app
3. Attempt to use the application

**Expected Results**:
- ❌ Error notification displayed
- ❌ License state: `GRACE_EXPIRED`
- ❌ App may restrict functionality (based on implementation)
- ❌ Prompt to reconnect or re-activate

**How to Verify**:
- Check for error message
- Console: `License grace period expired`
- Verify user is prompted to take action

---

### 6. Invalid License Key

**Objective**: Verify error handling for invalid license keys.

**Steps**:
1. Clear license cache
2. Open License Activation dialog
3. Enter an invalid/fake license key (e.g., "INVALID-KEY-12345")
4. Click "Activate"

**Expected Results**:
- ❌ Error message: "Invalid license key" or similar
- ❌ License state remains `UNLICENSED`
- ❌ No cache file created
- ❌ User can retry with different key

**How to Verify**:
- Check error toast/notification
- Console: `License activation failed: Invalid key`
- Verify no cache file was written

---

### 7. Network Error Handling

**Objective**: Verify graceful handling of network errors during activation.

**Steps**:
1. Disconnect from internet
2. Clear license cache
3. Attempt to activate license (online activation)

**Expected Results**:
- ❌ Error message: "Network error" or "Unable to connect"
- ❌ License state: `UNLICENSED`
- ❌ User prompted to check connection and retry

**How to Verify**:
- Check error message
- Console: `Network error during activation`
- Verify app doesn't crash

---

### 8. License Deactivation

**Objective**: Verify license can be deactivated properly.

**Steps**:
1. Ensure license is activated
2. Call deactivation via IPC:
   ```js
   await window.ipc.invoke('clear-license')
   ```
3. Or use UI button if implemented
4. Restart the app

**Expected Results**:
- ✅ License removed from cache
- ✅ License state: `UNLICENSED`
- ✅ Device unbound from keymint.dev
- ✅ User can activate with new key

**How to Verify**:
- Check cache file is deleted
- Console: `License deactivated successfully`
- Verify keymint.dev dashboard shows deactivation

---

### 9. Cache Integrity Check

**Objective**: Verify tampering detection in license cache.

**Steps**:
1. Activate license
2. Manually tamper with cache file:
   - Open cache file
   - Modify encrypted data or HMAC
   - Save changes
3. Restart the app

**Expected Results**:
- ❌ Cache integrity check fails
- ❌ Tampered cache discarded
- ❌ License state: `UNLICENSED` or requires re-validation
- ❌ User prompted to re-activate

**How to Verify**:
- Console: `Cache integrity check failed`
- App treats as if no license exists
- No crashes or security issues

---

### 10. Reconnect After Offline Period

**Objective**: Verify successful online validation after being offline.

**Steps**:
1. Be offline for 3-5 days (simulate by modifying cache)
2. Reconnect to internet
3. Wait for automatic validation or manually trigger via IPC:
   ```js
   await window.ipc.invoke('check-license')
   ```

**Expected Results**:
- ✅ License re-validated online
- ✅ State changes from `ACTIVE_OFFLINE` to `ACTIVE_ONLINE`
- ✅ `lastSyncDate` updated
- ✅ Grace period reset

**How to Verify**:
- Console: `License re-validated online`
- Check updated `lastSyncDate` in cache
- No more offline warnings

---

### 11. Multiple Devices (Device Binding)

**Objective**: Verify device binding prevents license sharing.

**Steps**:
1. Activate license on Device A
2. Note the device ID (check console logs)
3. Try to activate same license key on Device B

**Expected Results**:
- ❌ Device B activation fails
- ❌ Error: "License already activated on another device"
- ❌ Only one device can use the license at a time

**How to Verify**:
- Check keymint.dev dashboard for device binding
- Console on Device B: `Device mismatch error`
- Device A continues to work normally

---

### 12. Expired License (From Keymint.dev)

**Objective**: Verify handling of licenses that expired on keymint.dev.

**Steps**:
1. Use a license key that has expired in keymint.dev
2. Attempt activation or validation

**Expected Results**:
- ❌ Validation fails
- ❌ License state: `EXPIRED`
- ❌ Error: "License has expired"
- ❌ User prompted to renew

**How to Verify**:
- Console: `License expired on server`
- Check keymint.dev dashboard for expiration date
- App handles gracefully without crashes

---

## Testing Checklist

Use this checklist to track your manual testing progress:

- [ ] Test 1: First-Time Activation (Online)
- [ ] Test 2: Online Validation (Connected)
- [ ] Test 3: Offline Mode (Grace Period Active)
- [ ] Test 4: Grace Period Expiring Warning
- [ ] Test 5: Grace Period Expired
- [ ] Test 6: Invalid License Key
- [ ] Test 7: Network Error Handling
- [ ] Test 8: License Deactivation
- [ ] Test 9: Cache Integrity Check
- [ ] Test 10: Reconnect After Offline Period
- [ ] Test 11: Multiple Devices (Device Binding)
- [ ] Test 12: Expired License (From Keymint.dev)

## Debugging Tips

### View Console Logs
```js
// Enable verbose logging
localStorage.setItem('DEBUG_LICENSING', 'true')
```

### Inspect License Cache
```js
// Get current license state
const state = await window.ipc.invoke('get-license-state')
console.log(JSON.stringify(state, null, 2))
```

### Manual IPC Calls
```js
// Activate license
await window.ipc.invoke('activate-license', 'YOUR-LICENSE-KEY')

// Check license
await window.ipc.invoke('check-license')

// Clear license
await window.ipc.invoke('clear-license')

// Get state
await window.ipc.invoke('get-license-state')
```

### Cache File Locations
- **Windows**: `%APPDATA%\frappe-books\license-cache.json`
- **macOS**: `~/Library/Application Support/frappe-books/license-cache.json`
- **Linux**: `~/.config/frappe-books/license-cache.json`

### Reset Everything
```bash
# Clear cache
rm -rf ~/.config/frappe-books/license-cache.json  # Linux/macOS
del %APPDATA%\frappe-books\license-cache.json     # Windows

# Clear env vars
unset KEYMINT_API_URL KEYMINT_ACCESS_TOKEN KEYMINT_PRODUCT_ID
```

## Known Issues / Limitations

1. **Electron 22 Compatibility**: Some console warnings about sandbox may appear (harmless)
2. **Time Manipulation**: Changing system clock can affect grace period calculations
3. **Cache Encryption**: Encryption key regenerates per session (by design for security)

## Reporting Issues

When reporting licensing issues, include:
1. License state (from `get-license-state`)
2. Console logs (with sensitive data redacted)
3. Cache file existence (don't share contents)
4. Keymint.dev dashboard screenshot (if relevant)
5. Network connectivity status
6. Steps to reproduce

---

## Success Criteria

All tests should pass with expected results. The licensing system should:
- ✅ Activate successfully with valid keys
- ✅ Work offline within grace period
- ✅ Warn before grace period expires
- ✅ Block usage after grace period expires
- ✅ Handle errors gracefully without crashes
- ✅ Sync properly when reconnecting
- ✅ Enforce device binding
- ✅ Detect and reject tampered caches
