# RareBooks Licensing System

**Hybrid Online/Offline Licensing using Keymint.dev**

This is a custom licensing implementation for RareBooks that provides software protection while maintaining a seamless user experience with offline support.

## Architecture

### Three-Tier Hybrid Approach

1. **Online Mode** - Primary verification via keymint.dev REST API
2. **Offline Mode** - Encrypted cached license with grace period
3. **Grace Period** - 7 days offline operation before requiring re-validation

### Key Features

- ✅ Device-bound licenses using hardware fingerprinting
- ✅ Encrypted license cache with AES-256-GCM
- ✅ 7-day offline grace period
- ✅ Background validation (hourly when online)
- ✅ Subscription and perpetual license support
- ✅ HMAC integrity verification
- ✅ Fork-safe implementation (all code in `custom/`)

## Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Keymint.dev Configuration
KEYMINT_API_URL=https://api.keymint.dev
KEYMINT_ACCESS_TOKEN=your_access_token_here
KEYMINT_PRODUCT_ID=your_product_id_here

# Optional: Disable licensing (for development/testing)
ENABLE_LICENSING=false
```

### Default Configuration

- **Grace Period**: 7 days
- **Validation Timeout**: 10 seconds
- **Background Check Interval**: 1 hour
- **API URL**: https://api.keymint.dev

## File Structure

```
custom/licensing/
├── README.md                          # This file
├── index.ts                           # Main export & singleton
├── LicenseManager.ts                  # Orchestration service
├── types.ts                           # TypeScript definitions
├── api/
│   └── keymint-client.ts             # API client wrapper
├── cache/
│   ├── encryption.ts                  # AES-256 encryption
│   └── license-cache.ts              # Cache management
├── validation/
│   ├── online-validator.ts           # Online validation
│   ├── offline-validator.ts          # Offline validation
│   └── grace-period.ts               # Grace period logic
├── fingerprint/
│   └── device-id.ts                  # Hardware fingerprinting
└── ipc/
    └── registerLicenseIpcListeners.ts # IPC handlers
```

## Integration Points

### 1. Main Process (main.ts)

**File**: `main.ts` (lines 85-93)

```typescript
// Custom: License management (fork-safe)
if (process.env.ENABLE_LICENSING !== 'false') {
  try {
    const registerLicenseIpcListeners = require('./custom/licensing/ipc/registerLicenseIpcListeners').default;
    registerLicenseIpcListeners(this);
  } catch (error) {
    console.warn('Licensing module not available:', error);
  }
}
```

**Why fork-safe**: Uses dynamic require with try-catch, making it optional and non-breaking.

### 2. Dependencies

**File**: `package.json`

Added dependencies:
- `node-machine-id`: Hardware fingerprinting

## Usage

### From Main Process

```typescript
import { getLicenseManager, initializeLicensing } from './custom/licensing';

// Initialize on app startup
const result = await initializeLicensing();

// Or get manager instance
const manager = getLicenseManager();
const state = await manager.checkLicense();
```

### From Renderer Process (IPC)

```typescript
// Activate license
const result = await ipcRenderer.invoke('activate-license', licenseKey);

// Check license status
const status = await ipcRenderer.invoke('check-license');

// Get current state (no API call)
const state = await ipcRenderer.invoke('get-license-state');

// Clear license
await ipcRenderer.invoke('clear-license');
```

## License States

| State | Description |
|-------|-------------|
| `ACTIVE_ONLINE` | Valid license, verified online |
| `ACTIVE_OFFLINE` | Valid cached license within grace period |
| `GRACE_EXPIRING` | < 2 days remaining in grace period |
| `GRACE_EXPIRED` | Must reconnect for validation |
| `INVALID` | License validation failed |
| `EXPIRED` | Subscription expired |
| `UNLICENSED` | No license found |

## Security

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Storage**: Electron safeStorage (system keychain)
- **Integrity**: HMAC-SHA256 verification
- **Cache**: Encrypted with additional electron-store layer

### Device Binding
- Combines machine ID + MAC address
- SHA-256 hash for consistent identifier
- Validates device on every check

## Upstream Merge Safety

This implementation is designed to be **fork-safe** and won't conflict with upstream changes:

### ✅ Safe Practices

1. **Isolated Code** - All licensing code in `custom/` directory
2. **Optional Integration** - Single conditional block in `main.ts`
3. **Feature Flag** - Can be disabled with `ENABLE_LICENSING=false`
4. **Error Handling** - Gracefully fails if not available
5. **No Core Modifications** - Doesn't modify existing business logic

### Merging Upstream Changes

When syncing from upstream (frappe/books):

```bash
# Fetch upstream
git fetch upstream

# Merge with your branch
git merge upstream/master

# If conflicts in main.ts, keep your licensing block:
# Lines 85-93 in registerListeners()
```

**Only one file modified**: `main.ts` (8 lines added)

## Testing

### Manual Test Scenarios

1. **First Activation** - Enter license key, verify online activation
2. **Offline Mode** - Disconnect internet, restart app
3. **Grace Period** - Wait until < 2 days remaining, check warning
4. **Grace Expiration** - Set clock forward 8 days, verify block
5. **Invalid Key** - Try invalid license key
6. **Network Failure** - Simulate API timeout

### Unit Tests

```bash
# TODO: Add test files
yarn test custom/licensing/**/*.spec.ts
```

## Troubleshooting

### License Not Activating

1. Check environment variables are set
2. Verify keymint.dev access token is valid
3. Check network connectivity
4. Look for errors in console (DevTools)

### Cache Issues

Clear license cache:
```typescript
import { clearLicenseCache } from './custom/licensing/cache/license-cache';
clearLicenseCache();
```

### Disable Licensing

```bash
ENABLE_LICENSING=false yarn dev
```

## API Reference

### LicenseManager

```typescript
class LicenseManager {
  async initialize(): Promise<LicenseValidationResult>
  async activateLicense(licenseKey: string): Promise<LicenseValidationResult>
  async checkLicense(): Promise<LicenseValidationResult>
  getCurrentState(): LicenseValidationResult | null
  async clearLicense(): Promise<void>
  shutdown(): void
}
```

### IPC Actions

```typescript
LICENSE_IPC_ACTIONS = {
  ACTIVATE_LICENSE: 'activate-license',
  CHECK_LICENSE: 'check-license',
  GET_LICENSE_STATE: 'get-license-state',
  CLEAR_LICENSE: 'clear-license',
}
```

## Future Enhancements

- [ ] License transfer between devices
- [ ] Floating licenses (concurrent users)
- [ ] License analytics dashboard
- [ ] Trial period implementation
- [ ] Multi-product support

## Support

For keymint.dev API issues, visit: https://keymint.dev
For RareBooks licensing issues, check the project repository.

---

**Fork-safe implementation** - Safe to merge upstream changes
