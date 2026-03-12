# Payment Error: Invalid Phone Number Format

## Error Message

```
❌ Payment failed
Error: Invalid phone number format. Use one of: +255712345678, 255712345678, or 0712345678
```

## What This Means

The phone number you entered doesn't match any of the accepted Tanzania mobile payment formats.

## Solution

Use **ONE** of these three formats:

| Format | Example | Notes |
|--------|---------|-------|
| **+255XXXXXXXXX** | +255712345678 | International format with + |
| **255XXXXXXXXX** | 255712345678 | Country code without + |
| **0XXXXXXXXX** | 0712345678 | Local Tanzania format |

### Key Requirements:
✅ Must start with: `+255`, `255`, or `0`  
✅ Must have exactly **10 digits after** the country/local code  
✅ First digit after code must be **6 or 7** (mobile operator code)  
✅ No spaces, dashes, or special characters  
✅ No leading zeros after the initial 0 (if using local format)  

## Examples

### ✅ These Will Work

```
+255712345678      ← International format
255712345678       ← Country code format
0712345678         ← Local format
+255621234567      ← Different operator
0621234567         ← Local format, different operator
```

### ❌ These Will NOT Work

```
712345678          ← Missing country/local code prefix
+256712345678      ← Wrong country (Uganda)
+255812345678      ← Invalid operator (starts with 8)
0712345            ← Too short (only 9 digits)
+2557123456789     ← Too long (11 digits)
+255-7-1234-5678   ← Contains dashes
+255 712 345 678   ← Contains spaces
```

## Debugging Steps

1. **Copy your phone number exactly** - Make sure you have no extra spaces or characters

2. **Verify the format** - Check that it matches one of:
   - Starts with `+255` and has 10-13 characters total
   - Starts with `255` and has 12 characters total
   - Starts with `0` and has 10 characters total

3. **Check the operator** - The character right after +255/255/0 must be **6 or 7**
   - ✅ `+255712345678` (second character is 7)
   - ✅ `+255621234567` (second character is 6)
   - ❌ `+255812345678` (second character is 8 - invalid)
   - ❌ `+255512345678` (second character is 5 - invalid)

4. **Check console for detailed logs** - Open browser DevTools (F12) and look for:
   ```
   Validating phone: +255712345678
   ✓ Valid format: +255XXXXXXXXX
   ```
   OR
   ```
   Validating phone: 712345678
   ✗ Invalid phone format: 712345678 (length: 9)
   ```

## Mobile Operators in Tanzania

These are the valid operator codes (the digit after +255/255/0):

- **Vodacom (M-Pesa)**: 074, 075, 076, 077, 078
- **Tigo Pesa**: 061, 062, 063, 065
- **Airtel Money**: 063, 064, 068, 069
- **Halotel (HaloPesa)**: 071, 072, 073

All start with **6 or 7** when you remove the country code/local prefix.

## Still Having Issues?

1. Check the `PHONE_FORMAT.md` file for detailed format specifications
2. Open browser console (F12) and look for validation logs
3. Verify the number with your mobile provider
4. Try a different format - sometimes different apps accept different formats

## Still Not Working?

If you've verified the phone number format and it still fails, the issue might be:
- Network connectivity to ClickPesa API
- ClickPesa API down for maintenance
- Account not set up properly

Check the main error logs for more details.

