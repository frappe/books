# src

This is where all the frontend code lives

## Fyo Initialization

The initialization flows are different when the instance is new or is existing.
All of them are triggered from `src/App.vue`.

**New Instance**

1. Run _Setup Wizard_ for init values (eg: `country`).
2. Call `setupInstance.ts/setupInstance` using init values.

**Existing Instance**

1. Connect to db.
2. Check if _Setup Wizard_ has been completed, if not, jump to **New Instance**
3. Call `initFyo/initializeInstance` with `dbPath` and `countryCode`
