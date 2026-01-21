# UI Components Integration Guide

This guide shows how to integrate the licensing UI components into RareBooks.

## Available Components

### 1. LicenseActivation.vue

Modal dialog for activating a license key.

**Location:** `src/pages/Custom/LicenseActivation.vue`

**Props:**
- `open: boolean` - Controls modal visibility

**Events:**
- `close` - Emitted when modal should close
- `activated` - Emitted when license is successfully activated (passes validation result)

**Usage Example:**

```vue
<template>
  <div>
    <Button @click="showActivation = true">
      Activate License
    </Button>

    <LicenseActivation
      :open="showActivation"
      @close="showActivation = false"
      @activated="handleActivated"
    />
  </div>
</template>

<script>
import LicenseActivation from 'src/pages/Custom/LicenseActivation.vue';

export default {
  components: { LicenseActivation },
  data() {
    return {
      showActivation: false,
    };
  },
  methods: {
    handleActivated(result) {
      console.log('License activated:', result);
      // Refresh app state, show success message, etc.
    },
  },
};
</script>
```

### 2. LicenseStatus.vue

Badge component displaying current license status.

**Location:** `src/components/Custom/LicenseStatus.vue`

**Props:**
- `licenseState: object | null` - License validation result from IPC
- `showRefresh: boolean` (default: true) - Show refresh button

**Events:**
- `refresh` - Emitted when refresh button is clicked

**Usage Example:**

```vue
<template>
  <div>
    <LicenseStatus
      :license-state="currentLicense"
      @refresh="refreshLicense"
    />
  </div>
</template>

<script>
import LicenseStatus from 'src/components/Custom/LicenseStatus.vue';

export default {
  components: { LicenseStatus },
  data() {
    return {
      currentLicense: null,
    };
  },
  async mounted() {
    await this.checkLicense();
  },
  methods: {
    async checkLicense() {
      try {
        this.currentLicense = await window.ipc.invoke('check-license');
      } catch (error) {
        console.error('License check failed:', error);
      }
    },
    async refreshLicense() {
      await this.checkLicense();
    },
  },
};
</script>
```

## Complete Integration Example

Here's a complete example showing both components together:

```vue
<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">Settings</h1>
    </div>

    <!-- License Section -->
    <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2">License</h2>
      
      <div class="flex items-center gap-4">
        <!-- Current Status -->
        <LicenseStatus
          :license-state="licenseState"
          @refresh="checkLicense"
        />

        <!-- Actions -->
        <Button
          v-if="!licenseState || !licenseState.isValid"
          type="primary"
          @click="showActivationModal = true"
        >
          {{ licenseState ? 'Re-activate' : 'Activate License' }}
        </Button>

        <Button
          v-if="licenseState && licenseState.isValid"
          type="secondary"
          @click="clearLicense"
        >
          Clear License
        </Button>
      </div>

      <!-- License Details -->
      <div
        v-if="licenseState && licenseState.isValid"
        class="mt-4 text-sm text-gray-600 dark:text-gray-400"
      >
        <p v-if="licenseState.licenseeName">
          Licensed to: {{ licenseState.licenseeName }}
        </p>
        <p v-if="licenseState.licenseeEmail">
          Email: {{ licenseState.licenseeEmail }}
        </p>
        <p v-if="licenseState.expiresAt">
          Expires: {{ formatDate(licenseState.expiresAt) }}
        </p>
        <p class="text-xs mt-2">
          Last validated: {{ formatDate(licenseState.lastValidatedAt) }}
          {{ licenseState.validatedOnline ? '(online)' : '(offline)' }}
        </p>
      </div>

      <!-- Warning for expiring grace period -->
      <div
        v-if="licenseState && licenseState.state === 'GRACE_EXPIRING'"
        class="mt-4 p-3 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 rounded text-sm"
      >
        <p class="text-orange-600 dark:text-orange-400">
          ⚠️ Your offline grace period is expiring soon. 
          Please connect to the internet to validate your license.
        </p>
      </div>

      <!-- Error for expired grace period -->
      <div
        v-if="licenseState && licenseState.state === 'GRACE_EXPIRED'"
        class="mt-4 p-3 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded text-sm"
      >
        <p class="text-red-600 dark:text-red-400">
          ❌ Your offline grace period has expired. 
          Please connect to the internet to validate your license.
        </p>
      </div>
    </div>

    <!-- Activation Modal -->
    <LicenseActivation
      :open="showActivationModal"
      @close="showActivationModal = false"
      @activated="handleLicenseActivated"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Button from 'src/components/Button.vue';
import LicenseActivation from 'src/pages/Custom/LicenseActivation.vue';
import LicenseStatus from 'src/components/Custom/LicenseStatus.vue';

export default defineComponent({
  name: 'SettingsPage',
  components: {
    Button,
    LicenseActivation,
    LicenseStatus,
  },
  data() {
    return {
      licenseState: null as any,
      showActivationModal: false,
    };
  },
  async mounted() {
    await this.checkLicense();
  },
  methods: {
    async checkLicense() {
      try {
        this.licenseState = await (window as any).ipc.invoke('check-license');
      } catch (error) {
        console.error('Failed to check license:', error);
      }
    },
    async clearLicense() {
      if (!confirm('Are you sure you want to clear your license?')) {
        return;
      }

      try {
        await (window as any).ipc.invoke('clear-license');
        await this.checkLicense();
      } catch (error) {
        console.error('Failed to clear license:', error);
      }
    },
    async handleLicenseActivated(result: any) {
      this.licenseState = result;
      // Show success notification, etc.
    },
    formatDate(date: Date | string) {
      return new Date(date).toLocaleDateString();
    },
  },
});
</script>
```

## IPC API Reference

### Available IPC Actions

```typescript
// Activate a license key
const result = await window.ipc.invoke('activate-license', licenseKey);

// Check license status (online + offline)
const status = await window.ipc.invoke('check-license');

// Get current license state (from memory, no API call)
const state = await window.ipc.invoke('get-license-state');

// Clear/deactivate license
await window.ipc.invoke('clear-license');
```

### Response Format

All IPC calls return a `LicenseValidationResult`:

```typescript
interface LicenseValidationResult {
  state: 'ACTIVE_ONLINE' | 'ACTIVE_OFFLINE' | 'GRACE_EXPIRING' | 'GRACE_EXPIRED' | 'INVALID' | 'EXPIRED' | 'UNLICENSED';
  isValid: boolean;
  licenseKey?: string;
  licenseeEmail?: string;
  licenseeName?: string;
  expiresAt?: Date;
  gracePeriodEndsAt?: Date;
  daysRemaining?: number;
  error?: string;
  lastValidatedAt: Date;
  validatedOnline: boolean;
}
```

## Where to Add License UI

### Recommended Locations:

1. **Settings Page** - Primary location for license management
   - Show current status
   - Activation button
   - Clear license option

2. **App Header/Sidebar** - Quick status indicator
   - Small badge showing license status
   - Click to open settings

3. **Startup Check** - On app load
   - Check license automatically
   - Show activation modal if unlicensed or expired

4. **About Dialog** - License information
   - Show licensee details
   - Expiration date (if applicable)

## Styling Notes

All components use the existing RareBooks design system:
- ✅ Tailwind CSS classes
- ✅ Dark mode support
- ✅ Matches existing Button, Modal, Badge components
- ✅ Responsive design
- ✅ Translation-ready with `t` template literals

## Next Steps

1. Add LicenseStatus to your settings page
2. Add LicenseActivation modal trigger
3. Implement startup license check (see main/registerAppLifecycleListeners.ts)
4. Add license info to About dialog
5. Test with actual keymint.dev credentials

---

**Components are production-ready and follow existing design patterns!**
