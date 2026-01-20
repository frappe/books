# Rare Books - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
yarn
```

### 2. Run the Application
```bash
yarn dev
```

### 3. Create Your First Company
- Click "**New Company**" button
- Complete the setup wizard
- Default super admin is created automatically

### 4. Login with Default Credentials

```
📧 Email:    super@rarebooks.com
👤 Username: superadmin
🔑 Password: super@5378
```

### 5. You're In!
- Create organizations
- Add users
- Manage expenses
- Track licenses

---

## 📚 Key Features

✅ **Authentication System** - Real database authentication with hashed passwords  
✅ **Role-Based Access** - Super Admin, Admin, and User roles  
✅ **"Rare Books" Branding** - Custom welcome message  
✅ **User Management** - Complete user CRUD through UI  
✅ **License Validation** - 7-day sync tracking with notifications  
✅ **Enhanced Expenses** - Multi-column list view with description  

---

## 🔐 Security Note

**⚠️ IMPORTANT:** Change the default super admin password immediately in production!

Go to: **Setup → Users** → Edit super admin → Change password

---

## 📖 Full Documentation

- **Implementation Details:** `custom/IMPLEMENTATION_COMPLETE.md`
- **Default Credentials:** `custom/DEFAULT_CREDENTIALS.md`
- **Super Admin Setup:** `custom/SUPER_ADMIN_IMPLEMENTATION.md`
- **Import Fixes:** `custom/IMPORT_FIXES.md`
- **Integration Steps:** `custom/FINAL_INTEGRATION_STEPS.md`

---

## 🛠️ Commands

```bash
# Development
yarn dev

# Build for production
yarn build

# Run tests
yarn test

# Lint code
yarn lint

# Format code
yarn format
```

---

## 🆘 Need Help?

Check the troubleshooting sections in:
- `custom/FINAL_INTEGRATION_STEPS.md`
- `custom/DEFAULT_CREDENTIALS.md`
- `custom/SUPER_ADMIN_IMPLEMENTATION.md`

---

**All customizations are in the `custom/` directory and are upstream-sync safe!** 🎉
