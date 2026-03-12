# Phone Number Format - Tanzania Mobile Payment

## Accepted Formats

The system accepts the following Tanzania phone number formats for mobile payments:

### ✅ Valid Formats

1. **International Format with +**
   - Format: `+255XXXXXXXXX`
   - Example: `+255712345678`
   - Explanation: + prefix with country code 255, followed by 10 digits (starting with 6 or 7)

2. **Country Code without +**
   - Format: `255XXXXXXXXX`
   - Example: `255712345678`
   - Explanation: Country code 255 without + prefix, followed by 10 digits (starting with 6 or 7)

3. **Local Format (Tanzania)**
   - Format: `0XXXXXXXXX`
   - Example: `0712345678`
   - Explanation: Leading 0 with 10 digits total (starting digit 6 or 7 after the 0)

### ❌ Invalid Formats

The following will be rejected:

- `712345678` - Missing country/leading code
- `+2557123456` - Too few digits
- `+2557123456789` - Too many digits
- `+256712345678` - Wrong country code (Uganda instead of Tanzania)
- `+255812345678` - Invalid mobile operator (starts with 8 instead of 6 or 7)

## Mobile Operators

Valid Tanzania mobile operators:
- **Vodacom (M-Pesa)**: 074, 075, 076, 077, 078
- **Tigo Pesa (Mixx)**: 061, 062, 063, 065
- **Airtel Money**: 063, 064, 068, 069
- **HaloPesa (Halotel)**: 071, 072, 073

All of these start with **6 or 7** when considering the first digit after the country code (255) or leading 0.

## Examples

### ✅ Correct

```
+255712345678    (Vodacom M-Pesa)
255712345678     (Vodacom M-Pesa)
0712345678       (Vodacom M-Pesa)

+255621234567    (Tigo Pesa)
255621234567     (Tigo Pesa)
0621234567       (Tigo Pesa)
```

### ❌ Incorrect

```
+255812345678    (Starts with 8 - invalid operator)
712345678        (No country/local code prefix)
+256712345678    (Uganda code, not Tanzania)
0712345        (Too short)
+2557123456789   (Too long)
```

## Debugging

If you get an "Invalid phone number format" error:

1. **Check the phone number format** - Ensure it matches one of the three valid formats above
2. **Check the digit count** - After the country code (255) or local (0), there should be exactly 10 digits
3. **Check the operator code** - The first digit after 255 or 0 must be 6 or 7
4. **Remove special characters** - No dashes, spaces, or parentheses in the number
5. **Check the console logs** - The validation logs show what format was detected

## Phone Number Validation Console Output

When a phone number is validated, check the console (browser or electron dev tools):

```
✓ Valid format: +255XXXXXXXXX
✓ Valid format: 255XXXXXXXXX
✓ Valid format: 0XXXXXXXXX
✗ Invalid phone format: 712345678 (length: 9)
```

The length field helps diagnose if the number is too short or too long.

