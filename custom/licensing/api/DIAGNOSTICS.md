# Diagnostic Commands for ClickPesa Integration

## Check Environment Variables

### PowerShell (Windows)
```powershell
# Check if variables are set
$env:CLICKPESA_API_KEY
$env:CLICKPESA_CHECKSUM_KEY
$env:CLICKPESA_API_URL

# Check with masking for security
$apiKey = $env:CLICKPESA_API_KEY
if ($apiKey) { 
    $masked = $apiKey.Substring(0, [Math]::Min(3, $apiKey.Length)) + "..." + $apiKey.Substring([Math]::Max(0, $apiKey.Length - 3))
    Write-Host "CLICKPESA_API_KEY: $masked" 
} else { 
    Write-Host "CLICKPESA_API_KEY: NOT SET" 
}
```

### Bash (Linux/macOS)
```bash
# Check if variables are set
echo $CLICKPESA_API_KEY
echo $CLICKPESA_CHECKSUM_KEY
echo $CLICKPESA_API_URL

# Check with masking
if [ -z "$CLICKPESA_API_KEY" ]; then
  echo "CLICKPESA_API_KEY: NOT SET"
else
  echo "CLICKPESA_API_KEY: $(echo $CLICKPESA_API_KEY | cut -c1-3)...$(echo $CLICKPESA_API_KEY | rev | cut -c1-3 | rev)"
fi
```

## Verify API Key Format

### Valid API Key Formats
- Sandbox: `sk_test_xxxxxxxxxxxxx`
- Production: `sk_live_xxxxxxxxxxxxx`
- Alternative: `sk_xxxxxxxxxxxxx`

### Valid Checksum Key Formats
- `cs_xxxxxxxxxxxxx`
- `checksum_xxxxxxxxxxxxx`

## Test Token Generation (Manual)

### Using cURL
```bash
curl -X POST https://api.clickpesa.com/auth/generate-token \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"checksum": "YOUR_CHECKSUM_HERE"}'
```

**Expected Success Response:**
```json
{
  "access_token": "token_xxxxxxxxxxxxx",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Error Response (Invalid Credentials):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid API credentials"
}
```

### Using Node.js
```javascript
const crypto = require('crypto');
const fetch = require('node-fetch');

const API_KEY = process.env.CLICKPESA_API_KEY;
const CHECKSUM_KEY = process.env.CLICKPESA_CHECKSUM_KEY;

function calculateChecksum(payload) {
  const sortedKeys = Object.keys(payload).sort();
  const payloadString = sortedKeys.map(k => String(payload[k])).join('');
  return crypto.createHmac('sha256', CHECKSUM_KEY).update(payloadString).digest('hex');
}

async function testToken() {
  try {
    const checksum = calculateChecksum({ key: API_KEY });
    
    const response = await fetch('https://api.clickpesa.com/auth/generate-token', {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ checksum })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testToken();
```

## Monitor Application Logs

### Electron Development Console

Press `Ctrl+Shift+I` to open DevTools, then check:

1. **Console Tab** - Look for:
   - `✓ ClickPesa client initialized with credentials`
   - `Generating new ClickPesa access token...`
   - `✓ Access token generated successfully`
   - API errors or 401 responses

2. **Network Tab** - Check API requests:
   - POST `/auth/generate-token` - Should return 200
   - POST `/third-parties/payments/preview-ussd-push-request` - Should return 200
   - POST `/third-parties/payments/initiate-ussd-push-request` - Should return 200

### Main Process Logs

Check the main electron process output:
```
yarn dev
# or
npm run dev
```

Expected output when initiating payment:
```
=== Generating new ClickPesa access token...
✓ Access token generated successfully (expires in 3600 seconds)
=== ClickPesa Preview Payment ===
Amount: 500000
Phone: +255756658023
[Attempt 1/3] POST https://api.clickpesa.com/third-parties/payments/preview-ussd-push-request
```

## Test Payment Flow Steps

1. **Open App**: Start the application
2. **Check Console**: Verify credentials are loaded
3. **Click Buy License**: Open payment dialog
4. **Enter Phone**: Use format +255XXXXXXXXX
5. **Monitor Logs**: Watch for:
   - Token generation
   - Preview request
   - Initiate request
   - Success or error response

## Common Issues & Diagnostics

### Issue: `ClickPesa credentials not configured`

**Diagnostic:**
```bash
# Check if env vars exist
printenv | grep CLICKPESA
```

**Solution:**
1. Set the environment variables
2. Restart the application
3. Verify with console.log in code

### Issue: `401 Unauthorized` on token generation

**Diagnostic:**
1. Verify API key format matches ClickPesa docs
2. Check for trailing spaces in credentials
3. Confirm credentials are from correct environment (sandbox vs production)
4. Test with cURL command above

**Solution:**
```bash
# Reset and re-export variables
$env:CLICKPESA_API_KEY = "sk_test_xxxxxxxxxxxxx"
$env:CLICKPESA_CHECKSUM_KEY = "cs_xxxxxxxxxxxxx"
```

### Issue: `401` after token is generated

**Diagnostic:**
1. Token generation succeeded but payment request failed
2. Check if token expired (unlikely, but possible after 1 hour)
3. Verify checksum calculation is correct

**Solution:**
1. Check payment request payload format
2. Verify phone number format (+255XXXXXXXXX)
3. Check if amount is in correct currency

## Network Debugging

### Using Fiddler or Charles Proxy

View all requests/responses:
1. Configure proxy: `localhost:8888`
2. Monitor requests to `api.clickpesa.com`
3. Check headers and body for errors

### Using Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Filter for `clickpesa`
4. Inspect each request:
   - Headers (Authorization, X-API-Key)
   - Request body (payload, checksum)
   - Response (tokens, errors)

## Database & Cache Diagnostics

### Check License Cache

```typescript
import { loadLicenseCache } from '@/custom/licensing/cache/license-cache';

const cache = loadLicenseCache();
console.log('License Cache:', {
  exists: !!cache,
  email: cache?.licenseeEmail,
  name: cache?.licenseeName,
  expiresAt: cache?.expiresAt
});
```

### Check Payment Orders

Track payment status:
```typescript
import { getSubscriptionManager } from '@/custom/licensing';

const manager = getSubscriptionManager();
const status = await manager.checkPaymentStatus('LICENSE-SUB-xxxxx');
console.log('Payment Status:', status);
```

## Performance Metrics

### Token Generation Time
Expected: < 2 seconds

### Payment Preview Time
Expected: < 5 seconds

### Payment Initiation Time
Expected: < 10 seconds

If times exceed these, check:
1. Network latency
2. ClickPesa API status: https://status.clickpesa.com/
3. System resources

## Next Steps

If all diagnostics pass but payment still fails:
1. Contact ClickPesa support with:
   - API request/response logs
   - Error messages
   - Phone number used (masked)
   - Timestamp of failed attempt

2. Check ClickPesa documentation:
   - https://docs.clickpesa.com/
   - https://docs.clickpesa.com/api-reference/authorization/generate-token

