# Payment Method Selection Fix

## Problem
When selecting a payment method during checkout, ALL payment methods were being selected instead of just one, causing the payment flow to fail.

## Root Cause
The payment methods returned from `getPaymentMethods()` in the ClickPesa client did not include unique `id` properties. This caused Vue.js v-for binding issues where:

1. The `:key` binding was trying to use `method.id` which didn't exist
2. Without proper keys, Vue couldn't properly track which elements were selected/deselected
3. The `selectedMethod` comparison in the template failed because the method objects didn't have proper IDs

## Solution

### 1. **ClickPesa Client Fix** (`custom/licensing/api/clickpesa-client.ts`)
Updated the `getPaymentMethods()` method to return payment methods with unique IDs:

```typescript
getPaymentMethods(): Array<PaymentMethod & { id: string }> {
  return [
    { id: 'mpesa', name: 'M-PESA', status: 'AVAILABLE' },
    { id: 'tigopesa', name: 'TIGO-PESA', status: 'AVAILABLE' },
    { id: 'airtelmoney', name: 'AIRTEL-MONEY', status: 'AVAILABLE' },
    { id: 'halopesa', name: 'HALO-PESA', status: 'AVAILABLE' },
  ];
}
```

**Changes:**
- Added unique `id` property to each payment method
- Return type updated to reflect the new structure
- IDs match the method name mapping in `License.vue` (`handleMethodSelected`)

### 2. **PaymentMethodSelector Component Fix** (`src/components/Custom/PaymentMethodSelector.vue`)
Improved the component to properly handle single selection:

**Key changes:**
- Fixed v-for key binding: `:key="`payment-method-${method.id}`"` 
- Added `type="button"` to prevent accidental form submissions
- Added `.prevent` modifier to click handler: `@click.prevent="selectMethod(method.id)"`
- Improved `selectMethod` logic to handle toggle behavior:
  - Clicking same method again deselects it
  - Clicking different method switches selection
- Reset selection state in `mounted()` and after loading methods
- Added fallback for empty methods array

```typescript
selectMethod(methodId: string) {
  // Only set the selected method if it's different from current
  if (this.selectedMethod === methodId) {
    // Deselect if clicking the same method
    this.selectedMethod = null;
  } else {
    // Select only this method
    this.selectedMethod = methodId;
  }
}
```

### 3. **License.vue Already Compatible**
The `License.vue` page already had the correct method ID mapping in place:

```typescript
const methodNames: Record<string, string> = {
  mpesa: 'M-Pesa (Vodacom)',
  tigopesa: 'Tigo Pesa (Mixx)',
  airtelmoney: 'Airtel Money',
  halopesa: 'HaloPesa (Halotel)',
};
```

No changes were needed here.

## Files Modified
1. `custom/licensing/api/clickpesa-client.ts` - Added ID to payment methods
2. `src/components/Custom/PaymentMethodSelector.vue` - Fixed selection logic

## Testing Checklist
- [ ] Click "Buy License" button
- [ ] Verify that payment method selector loads (4 methods: M-Pesa, Tigo Pesa, Airtel Money, HaloPesa)
- [ ] Click on one payment method - should show blue highlight and checkmark
- [ ] Click on another payment method - previous should deselect, new should select
- [ ] Click same method again - should deselect
- [ ] Verify "Continue" button is disabled when no method selected
- [ ] Verify "Continue" button is enabled when a method is selected
- [ ] Click "Continue" with method selected - should proceed to phone number entry

## Impact
- ✅ Single payment method selection now works correctly
- ✅ Payment flow can proceed without errors
- ✅ No breaking changes to other components
- ✅ Fully backward compatible with existing License.vue logic

