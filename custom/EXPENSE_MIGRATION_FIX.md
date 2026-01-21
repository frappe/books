# Expense Schema Migration Fix

## Issue
The Expense schema was updated to add new fields (`description`, `name`, `numberSeries`), but existing databases have Expense records without these fields. When the app tries to migrate the table structure, it fails with:

```
SqliteError: table __Expense has no column named description
```

## Root Cause
SQLite's ALTER TABLE has limitations. When the schema changes significantly, the framework uses a "prestige" operation that:
1. Creates a temporary table `__Expense` with the new schema
2. Copies data from `Expense` to `__Expense`
3. Drops old `Expense` table
4. Renames `__Expense` to `Expense`

The error occurs during step 2 because it tries to copy columns that don't exist in the source table.

## Solution Options

### Option 1: Clear Expense Data (Recommended for Development)
If you have test data only, the quickest solution is to delete existing expenses:

```sql
-- Open the database with a SQLite browser/tool
DELETE FROM Expense;
```

Then restart the app. The new schema will create the table correctly.

### Option 2: Manual Column Addition (For Production Data)
If you have important expense data, manually add the columns first:

```sql
-- Add missing columns with defaults
ALTER TABLE Expense ADD COLUMN description TEXT;
ALTER TABLE Expense ADD COLUMN numberSeries TEXT DEFAULT 'EXP-';

-- Note: 'name' column will be added by the schema system
```

Then restart the app.

### Option 3: Backup and Restore
1. **Backup existing data:**
   ```sql
   -- Export expenses to keep the data
   SELECT * FROM Expense;
   ```
   Save this data.

2. **Drop and recreate:**
   ```sql
   DROP TABLE IF EXISTS Expense;
   ```

3. **Restart app** - new table will be created with correct schema

4. **Manually recreate records** through the UI with proper IDs

## What Was Changed

### Schema Changes (custom/schemas/Expense.json)
- Added `"naming": "numberSeries"` - Uses number series for IDs
- Added `name` field - Displays as "Expense No" (e.g., EXP-1000)
- Added `numberSeries` field - Links to NumberSeries table, default "EXP-"
- Added `description` field - Already existed, now in new schema format

### Model Changes (custom/models/Expense.ts)
- Added `static defaults` for numberSeries and date
- Updated list view columns to show 'name' first

## Verification Steps

After applying the fix, verify:

1. **App Starts Successfully**
   - No database errors in console
   - Expense menu item loads

2. **Create New Expense**
   - Form shows "Expense No" field (read-only)
   - Number series dropdown shows "EXP-"
   - Description field available
   - Save works correctly

3. **Check Expense ID Format**
   - First expense: EXP-1000
   - Second expense: EXP-1001
   - IDs increment sequentially

4. **List View Shows Correctly**
   - Columns: Expense No, Date, Vendor, Account, Amount, Description
   - No duplicate IDs

## Prevention for Future Schema Changes

When adding required fields to existing schemas:

1. **Make fields optional initially** (no `"required": true`)
2. **Provide defaults** in schema
3. **Run migrations** to populate existing data
4. **Then make required** if needed

Or:

1. **Add fields as optional**
2. **Use model `beforeInsert()` hook** to set defaults
3. **Never make existing optional fields required**

## Migration Code

The automatic migration code is in:
- `custom/setup/migrateExpenseTable.ts` - Frontend migration
- `backend/database/bespoke.ts` - Backend migration (migrateExpenseDescription)

These run on app startup to add missing columns.

## Current Status

- ✅ `numberSeries` field is now optional (has default)
- ✅ `description` field is optional
- ✅ `name` field is required but auto-generated
- ✅ Migration code adds columns if missing
- ⚠️ **Action Required**: Choose and apply one of the solution options above

---

**Recommended Action for Development:**
```bash
# 1. Close the app
# 2. Open your database file with DB Browser for SQLite
# 3. Run: DELETE FROM Expense;
# 4. Restart the app
```

**Recommended Action for Production:**
```bash
# 1. Close the app
# 2. Backup the database file
# 3. Open database with SQLite tool
# 4. Run:
#    ALTER TABLE Expense ADD COLUMN description TEXT;
#    ALTER TABLE Expense ADD COLUMN numberSeries TEXT DEFAULT 'EXP-';
# 5. Restart the app
```
