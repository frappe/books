# ClickPesa Setup Checklist

## ✅ Step 1: Get ClickPesa Credentials

1. Visit ClickPesa Dashboard: https://dashboard.clickpesa.com/
2. Log in to your merchant account
3. Navigate to "API Settings" or "Integrations"
4. Find your:
   - **API Key** (example format: `sk_xxxxxxxxxxxxx`)
   - **Checksum Key** (example format: `cs_xxxxxxxxxxxxx`)

## ✅ Step 2: Set Environment Variables

### Option A: Using .env File (Development)

Create `.env` file in project root (if not already present):

```bash
CLICKPESA_API_URL=https://api.clickpesa.com
CLICKPESA_API_KEY=your_api_key_here
CLICKPESA_CHECKSUM_KEY=your_checksum_key_here
YEARLY_LICENSE_PRICE=500000
```

### Option B: System Environment Variables (Production)

**Windows PowerShell:**
```powershell
$env:CLICKPESA_API_KEY = "your_api_key_here"
$env:CLICKPESA_CHECKSUM_KEY = "your_checksum_key_here"
```

**Linux/macOS:**
```bash
export CLICKPESA_API_KEY="your_api_key_here"
export CLICKPESA_CHECKSUM_KEY="your_checksum_key_here"
```

## ✅ Step 3: Verify Configuration

**In Development:**
1. Run your application
2. Check the browser console or electron console for:
   ```
   ✓ ClickPesa client initialized with credentials
   ```

**To Debug:**
1. In the console, you should see:
   ```
   Generating new ClickPesa access token...
   ✓ Access token generated successfully (expires in 3600 seconds)
   ```

## ✅ Step 4: Test Payment Flow

1. Click "Buy License" button in the app
2. Enter a valid Tanzania phone number (format: `+255XXXXXXXXX`)
3. Verify console shows:
   ```
   === ClickPesa Preview Payment ===
   === ClickPesa Initiate Payment ===
   [Attempt 1/3] POST ...preview-ussd-push-request
   [Attempt 1/3] POST ...initiate-ussd-push-request
   ```

## ❌ Troubleshooting

### Error: `ClickPesa credentials not configured`
**Cause:** Environment variables not set
**Fix:** Set `CLICKPESA_API_KEY` and `CLICKPESA_CHECKSUM_KEY`

### Error: `401 Unauthorized`
**Cause:** Invalid API key or checksum key
**Fix:** 
1. Verify credentials from ClickPesa dashboard
2. Check for typos or trailing spaces
3. Ensure you're using the correct environment (sandbox vs. production)

### Error: `Unexpected content type: null. Status: 401`
**Cause:** Token generation failed, but app proceeded to payment request
**Fix:** Same as 401 error above

### Error: `Retry attempt X/3 in ...ms`
**Cause:** Temporary network issue or API overload
**Action:** App automatically retries. Check network connection.

## 🔐 Security Notes

- ⚠️ Never commit `.env` file with real credentials to version control
- ⚠️ Use different API keys for development vs. production
- ⚠️ Rotate credentials periodically
- ⚠️ Keep API keys confidential and never share them

## 📞 Support

- ClickPesa Documentation: https://docs.clickpesa.com/
- ClickPesa Support: https://support.clickpesa.com/
- Authorization Docs: https://docs.clickpesa.com/api-reference/authorization/generate-token

