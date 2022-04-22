# src

This is where all the frontend code lives

## Initialization
New Instance
1. Run _Setup Wizard_ for initialization values (eg: `countryCode`).
2. 

Existing Instance
1. Connect to db
2. Check if _Setup Wizard_ has been completed, if not, jump to **New Instance**
3. Call `initFyo/initializeInstance` with `dbPath` and `countryCode`