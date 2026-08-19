# Payment Initiation Error Fix - Invalid Argument Type

## Error Message
```
Error invoking remote method 'initiate-payment': TypeError [ERR_INVALID_ARG_TYPE]: 
The "key" argument must be of type string or an instance of ArrayBuffer, Buffer, 
TypedArray, DataView, KeyObject, or CryptoKey. Received type number (30000)
```

## Root Cause
The `ClickPesaClient` constructor was being called with parameters in the wrong order in `SubscriptionManager`. 

**Expected parameter order:**
```typescript
constructor(
  apiUrl: string,
  clientId: string,
  apiKey: string,
  checksumKey: string,
  timeout = 30_000
)
```

**Actual parameter order being passed:**
```typescript
new ClickPesaClient(
  subscriptionConfig.clickpesaApiUrl,          // ✓ apiUrl
  subscriptionConfig.clickpesaApiKey,          // ✗ passed as clientId (should be clientId!)
  subscriptionConfig.clickpesaChecksumKey,     // ✗ passed as apiKey (should be apiKey!)
  subscriptionConfig.paymentTimeout            // ✗ passed as checksumKey (30000 - NUMBER!)
)
```

This caused the checksum calculation to receive `30000` (a number) as the checksum key, which was then passed to Node.js's `createHmac()` function:

```typescript
createHmac('sha256', this.checksumKey)  // checksumKey = 30000 (NUMBER!)
  .update(value)
  .digest('hex');
```

`createHmac()` requires the key to be a string or Buffer, not a number, hence the error.

## Solution

### 1. Updated SubscriptionConfig Type (`custom/licensing/subscription/types.ts`)
Added `clickpesaClientId` as a separate field:

```typescript
export interface SubscriptionConfig {
  clickpesaApiUrl: string;
  clickpesaClientId: string;      // ← NEW: separate client ID
  clickpesaApiKey: string;
  clickpesaChecksumKey: string;
  yearlyLicensePrice: number;
  paymentTimeout: number;
}
```

### 2. Updated Configuration (`custom/licensing/index.ts`)
Added environment variable for Client ID:

```typescript
const subscriptionConfig: SubscriptionConfig = {
  clickpesaApiUrl: process.env.CLICKPESA_API_URL || 'https://api.clickpesa.com',
  clickpesaClientId: process.env.CLICKPESA_CLIENT_ID || '',    // ← NEW
  clickpesaApiKey: process.env.CLICKPESA_API_KEY || '',
  clickpesaChecksumKey: process.env.CLICKPESA_CHECKSUM_KEY || '',
  yearlyLicensePrice: parseFloat(process.env.YEARLY_LICENSE_PRICE || '500000'),
  paymentTimeout: 30000,
};
```

### 3. Fixed ClickPesaClient Constructor Call (`custom/licensing/subscription/subscription-manager.ts`)
Corrected parameter order and added all required parameters:

```typescript
this.clickpesa = new ClickPesaClient(
  subscriptionConfig.clickpesaApiUrl,        // ✓ apiUrl
  subscriptionConfig.clickpesaClientId,      // ✓ clientId (NEW, was missing!)
  subscriptionConfig.clickpesaApiKey,        // ✓ apiKey
  subscriptionConfig.clickpesaChecksumKey,   // ✓ checksumKey (was incorrectly in position 3!)
  subscriptionConfig.paymentTimeout          // ✓ timeout (optional, properly passed now)
);
```

## Files Modified
1. `custom/licensing/subscription/types.ts` - Added `clickpesaClientId` property
2. `custom/licensing/index.ts` - Added `CLICKPESA_CLIENT_ID` environment variable
3. `custom/licensing/subscription/subscription-manager.ts` - Fixed constructor call parameter order

## Environment Variables Required
Make sure your `.env` file includes:
```
CLICKPESA_API_URL=https://api.clickpesa.com
CLICKPESA_CLIENT_ID=<your-client-id>
CLICKPESA_API_KEY=<your-api-key>
CLICKPESA_CHECKSUM_KEY=<your-checksum-key>
```

## Testing
After making these changes:
1. Ensure all environment variables are properly set
2. Try the payment flow again
3. The error "Received type number (30000)" should be resolved
4. Payment initiation should proceed to the ClickPesa API without this error

## Related Documentation
- ClickPesa API Docs: https://docs.clickpesa.com/api-reference/authorization/generate-token
- Node.js crypto.createHmac(): https://nodejs.org/api/crypto.html#crypto_crypto_createhmac_algorithm_key_options

