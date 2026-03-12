# ClickPesa Payment Integration - Authentication Fix

## Problem

The payment initialization was failing with `401 Unauthorized` errors because the ClickPesa client was using an incorrect authentication method.

### Original Issue

```
Non-JSON response: Unauthorized
Error: ClickPesa API error: Unexpected content type: null. Status: 401
```

This occurred because the code was sending:
```typescript
'Authorization': `Bearer ${this.apiKey}`  // ❌ WRONG - apiKey directly as bearer token
```

## Solution

ClickPesa API requires a **two-step token-based authentication** process:

1. **Generate an Access Token** - Call `/auth/generate-token` with API credentials
2. **Use the Token** - Include the generated token in subsequent API calls

### Updated Authentication Flow

```
1. POST /auth/generate-token
   Headers: X-API-Key: ${CLICKPESA_API_KEY}
   Body: { checksum: calculateChecksum({ key: CLICKPESA_API_KEY }) }
   
   Response: { access_token: "...", expires_in: 3600 }

2. Use Bearer token for all payment endpoints:
   Headers: Authorization: Bearer ${access_token}
```

## Configuration

### Environment Variables Required

Set these in your `.env` file or system environment:

```bash
# ClickPesa Configuration
CLICKPESA_API_URL=https://api.clickpesa.com
CLICKPESA_API_KEY=your_actual_api_key_here
CLICKPESA_CHECKSUM_KEY=your_actual_checksum_key_here

# Optional
YEARLY_LICENSE_PRICE=500000  # Default: 500,000 TZS
```

### How to Get Credentials

1. Go to: https://docs.clickpesa.com/api-reference/authorization/generate-token
2. Create a merchant account at ClickPesa
3. Generate API credentials from your dashboard
4. Copy the **API Key** and **Checksum Key** from the credentials page

## Implementation Details

### Key Changes

**File:** `custom/licensing/api/clickpesa-client.ts`

1. **Token Caching** - Generated tokens are cached and reused within 1 hour (with 5-minute safety buffer)
2. **Automatic Token Refresh** - Tokens are automatically regenerated when expired
3. **Token Validation** - Checksum is calculated for token generation request
4. **Error Handling** - Tokens are invalidated on 401 responses to force regeneration
5. **Retry Logic** - Failed requests retry with exponential backoff

### Token Management

```typescript
// Automatically handles:
- Token generation on first use
- Token caching for performance
- Token expiration handling
- Automatic refresh before expiration
- Cache invalidation on auth failures
```

## Testing

### Manual Testing Steps

1. **Verify Credentials Are Set**
   ```bash
   echo $env:CLICKPESA_API_KEY
   echo $env:CLICKPESA_CHECKSUM_KEY
   ```

2. **Test Token Generation**
   - Start the app
   - Check console for: `✓ Access token generated successfully`

3. **Test Payment Flow**
   - Click "Buy License" button
   - Enter phone number (+255XXXXXXXXX format)
   - Observe console logs:
     ```
     === Generating new ClickPesa access token...
     ✓ Access token generated successfully (expires in 3600 seconds)
     === ClickPesa Preview Payment ===
     === ClickPesa Initiate Payment ===
     ```

### Console Output Examples

**Success:**
```
Generating new ClickPesa access token...
✓ Access token generated successfully (expires in 3600 seconds)
=== ClickPesa Preview Payment ===
Amount: 500000
Phone: +255756658023
=== ClickPesa Initiate Payment ===
[Attempt 1/3] POST https://api.clickpesa.com/third-parties/payments/preview-ussd-push-request
[Attempt 1/3] POST https://api.clickpesa.com/third-parties/payments/initiate-ussd-push-request
```

**Troubleshooting:**
```
❌ ClickPesa credentials not configured:
   - CLICKPESA_API_KEY is missing
   - CLICKPESA_CHECKSUM_KEY is missing

❌ ClickPesa token generation failed: HTTP 401: Failed to generate token
   → Check API_KEY and CHECKSUM_KEY values

❌ ClickPesa API error: Unexpected content type: null. Status: 401
   → Token was valid but API request failed
   → Check phone number format or payment amount
```

## API Endpoints Used

### Authorization
- `POST /auth/generate-token` - Generate access token

### Payments
- `POST /third-parties/payments/preview-ussd-push-request` - Validate payment
- `POST /third-parties/payments/initiate-ussd-push-request` - Initiate payment
- `GET /third-parties/payments/query?orderReference=X` - Check payment status

## Related Files

- `custom/licensing/api/clickpesa-client.ts` - Payment gateway client
- `custom/licensing/subscription/subscription-manager.ts` - Subscription orchestration
- `custom/licensing/ipc/registerLicenseIpcListeners.ts` - IPC handlers
- `custom/licensing/index.ts` - Configuration and initialization

## References

- Official API Docs: https://docs.clickpesa.com/
- Authorization Reference: https://docs.clickpesa.com/api-reference/authorization/generate-token
- ClickPesa Dashboard: https://dashboard.clickpesa.com/

