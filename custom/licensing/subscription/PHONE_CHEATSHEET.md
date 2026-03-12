# Phone Number Format - Quick Reference

## TL;DR - Just Use One Of These ✅

```
+255712345678    ← Best option (international format)
255712345678     ← Also works (country code)
0712345678       ← Also works (local format)
```

## The Rule 📋

**Country Code (255) or Local (0) → Operator Code (6 or 7) → 8 more digits**

```
+255  7  12345678    (4 + 2 + 8 = 14 characters with +)
 ├─┬─┘  └─┬─┘└───┬───┘
 │ │     │ │     └─ 8 more digits
 │ │     │ └─ Must be 6 or 7
 │ │     └─ Operator code
 │ └─ Country code
 └─ Plus sign (optional)
```

## Copy-Paste Examples 📋

### Vodacom (M-Pesa)
```
+255712345678
255712345678
0712345678
```

### Tigo Pesa
```
+255621234567
255621234567
0621234567
```

### Airtel Money
```
+255631234567
255631234567
0631234567
```

### Halotel (HaloPesa)
```
+255711234567
255711234567
0711234567
```

## ❌ DON'T DO THIS

| ❌ Wrong | ✅ Correct | Why |
|---------|-----------|-----|
| `712345678` | `+255712345678` | Missing country code |
| `+255812345678` | `+255712345678` | 8 is invalid (not 6 or 7) |
| `0712345` | `0712345678` | Only 9 digits (need 10) |
| `+256712345678` | `+255712345678` | Uganda (256) not Tanzania (255) |
| `+255 712 345 678` | `+255712345678` | No spaces |
| `+255-712-345-678` | `+255712345678` | No dashes |

## Validator Output

When you enter a phone number, the system checks it and shows:

✅ Validation Success:
```
Validating phone: +255712345678
✓ Valid format: +255XXXXXXXXX
→ Proceed to payment
```

❌ Validation Failed:
```
Validating phone: 712345678
✗ Invalid phone format: 712345678 (length: 9)
→ Enter a valid phone number
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid phone format" | Check it matches one of the 3 formats above |
| "Too many/few digits" | Ensure 10 digits after country/local code |
| "Invalid operator" | First digit must be 6 or 7, not 0-5 or 8-9 |
| "Still not working" | Copy-paste one of the examples above |

## Tanzania Mobile Operators

These are valid (first digit 6 or 7):

✅ **Vodacom**: 074, 075, 076, 077, 078
✅ **Tigo**: 061, 062, 063, 065
✅ **Airtel**: 063, 064, 068, 069
✅ **Halotel**: 071, 072, 073

❌ **Invalid**: 051, 052, 053, 054, 055, 081, 082, 083, 084, 085...

## Which Format Should I Use?

Pick whichever is easiest for you:

- **`+255...`** ← Recommended if your device keyboard has +
- **`255...`** ← Use if you can't easily type +
- **`0...`** ← Use if you have the local format memorized

All three work the same way!

---

**Still confused?** Check the detailed guides:
- `PHONE_FORMAT.md` - Full specifications
- `INVALID_PHONE_ERROR.md` - Error help guide
- `PHONE_FIX_SUMMARY.md` - Technical summary

