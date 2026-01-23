# Test Login Flow

## Quick Test Steps

### 1. Start Fresh
```bash
yarn dev
```

### 2. Create New Organization
1. Click "New Company"
2. Complete setup wizard
3. **Expected:** Toast message showing "Organization created! Please login..."
4. **Expected:** Redirected to login page automatically (router guard)

### 3. Check Browser Console
Open DevTools Console and run:
```javascript
// Check if super admin was created
await fyo.db.exists('User', 'super@rarebooks.com')
// Should return: true

// Check User table structure
const user = await fyo.doc.getDoc('User', 'super@rarebooks.com');
console.log('User:', {
  name: user.name,
  username: user.username,
  full_name: user.full_name,
  role: user.role,
  enabled: user.enabled,
  // Don't log password!
});
```

### 4. Test Login
1. Enter credentials:
   - Email: `super@rarebooks.com`
   - Password: `super@5378`
2. Click "Sign in"
3. Watch console for any errors
4. **Expected:** Redirect to home page (/)

### 5. Check Session
After successful login, run in console:
```javascript
console.log({
  session_token: localStorage.getItem('session_token'),
  current_user: localStorage.getItem('current_user'),
  current_role: localStorage.getItem('current_role'),
});
```

## Common Errors and Solutions

### Error: "User.authenticate is not a function"
**Cause:** User model not loaded properly
**Fix:** Check `models/index.ts` includes User export

### Error: "Cannot read property 'name' of null"
**Cause:** User not found in database
**Solution:**
```javascript
// Manually create super admin
const user = fyo.doc.getNewDoc('User');
await user.setAndInsert({
  name: 'super@rarebooks.com',
  username: 'superadmin',
  full_name: 'Super Administrator',
  role: 'Super Admin',
  enabled: 1,
  password: 'super@5378',  // Will be hashed automatically
});
```

### Error: "Invalid email or password"
**Possible causes:**
1. Password not hashed correctly
2. Hash verification failing
3. User disabled

**Debug:**
```javascript
// Check password hash
const user = await fyo.doc.getDoc('User', 'super@rarebooks.com');
const passwordField = user.get('password');
console.log('Password starts with $pbkdf2$:', passwordField.startsWith('$pbkdf2$'));

// Test password hashing
const testHash = await ipc.hashPassword('super@5378');
console.log('Test hash:', testHash);

const isValid = await ipc.validatePassword('super@5378', testHash);
console.log('Test validation:', isValid);
```

### Error: "fyo.db is not a function" on Login page
**Cause:** Database not connected when login page loads
**This is a critical error!**

**Check:** 
1. Is fyo.db.isConnected true?
2. Did setupInstanceCustom complete successfully?
3. Did connectToDatabase() finish?

**Fix if needed:**
```javascript
// Check connection status
console.log('DB connected:', fyo.db.isConnected);

// Check db path
console.log('DB path:', fyo.config.get('lastSelectedFilePath'));
```

## What Should Happen (Step by Step)

1. **Setup Complete**
   - setupInstanceCustom() called
   - Base setup runs
   - createDefaultSuperAdmin() creates user
   - Database connected
   - Toast shown
   - activeScreen = Screen.Desk

2. **Desk Mounts**
   - Router initializes
   - Router tries to navigate to '/' or '/get-started'
   - Router guard checks for session_token
   - No session_token found
   - Router redirects to '/login'

3. **Login Page Loads**
   - Login component mounts
   - fyo is connected to database
   - User enters credentials
   - Clicks "Sign in"

4. **Authentication**
   - User.authenticate(fyo, email, password) called
   - Checks if user exists: `await fyo.db.get('User', email)`
   - Validates password: `await ipc.validatePassword(password, user.password)`
   - Returns user object if valid

5. **Session Creation**
   - Generate session token
   - Store in localStorage
   - Try to update SystemUser singleton (may fail gracefully)
   - Show success toast

6. **Redirect**
   - window.location.href = '/'
   - Page reloads
   - Router guard sees session_token
   - Allows navigation to '/'
   - User sees dashboard

## If Something Goes Wrong

### Capture the exact error:
```javascript
// Enable detailed error logging in Login.vue
localStorage.setItem('debug', 'true');

// Then try logging in again and check console
```

### Manual authentication test:
```javascript
// Test the whole flow manually
const email = 'super@rarebooks.com';
const password = 'super@5378';

try {
  console.log('1. Checking if user exists...');
  const exists = await fyo.db.exists('User', email);
  console.log('User exists:', exists);
  
  if (!exists) {
    console.error('User not found!');
  } else {
    console.log('2. Getting user record...');
    const userDoc = await fyo.doc.getDoc('User', email);
    console.log('User role:', userDoc.role);
    console.log('User enabled:', userDoc.enabled);
    console.log('Password hash starts with $pbkdf2$:', userDoc.password?.startsWith('$pbkdf2$'));
    
    console.log('3. Validating password...');
    const isValid = await ipc.validatePassword(password, userDoc.password);
    console.log('Password valid:', isValid);
    
    if (isValid) {
      console.log('✅ Authentication should work!');
    } else {
      console.log('❌ Password validation failed');
    }
  }
} catch (error) {
  console.error('Error during manual test:', error);
}
```

## Next Steps After Testing

1. If login works: ✅ Implementation complete!
2. If specific error occurs: Check error message and debug accordingly
3. If user not created: Check createDefaultSuperAdmin() execution
4. If password invalid: Check password hashing implementation

---

**Run these tests and report back with:**
1. Any error messages (exact text)
2. Console log output
3. What step fails
4. Any toast messages shown
