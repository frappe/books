<template>
  <div class="p-4">
    <!-- License Section -->
    <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">License Management</h2>
      
      <div class="flex items-center gap-4 mb-4">
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
        class="mt-4 p-3 bg-gray-50 dark:bg-gray-850 rounded text-sm"
      >
        <div class="grid grid-cols-2 gap-3">
          <div v-if="licenseState.licenseeName">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Licensed to</p>
            <p class="font-medium">{{ licenseState.licenseeName }}</p>
          </div>
          <div v-if="licenseState.licenseeEmail">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Email</p>
            <p class="font-medium">{{ licenseState.licenseeEmail }}</p>
          </div>
          <div v-if="licenseState.expiresAt">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Expires</p>
            <p class="font-medium">{{ formatDate(licenseState.expiresAt) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400 text-xs">Last validated</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ formatDate(licenseState.lastValidatedAt) }}
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ licenseState.validatedOnline ? '(online)' : '(offline)' }}
              </span>
            </p>
          </div>
        </div>

        <!-- Grace Period Info -->
        <div
          v-if="licenseState.gracePeriodInfo"
          class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
        >
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Offline grace period: {{ licenseState.gracePeriodInfo.daysRemaining }} days remaining
          </p>
        </div>
      </div>

      <!-- Warning for expiring grace period -->
      <div
        v-if="licenseState && licenseState.licenseState === 'GRACE_EXPIRING'"
        class="mt-4 p-3 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 rounded text-sm"
      >
        <p class="text-orange-600 dark:text-orange-400 font-medium">
          ⚠️ Grace period expiring soon
        </p>
        <p class="text-orange-600 dark:text-orange-400 text-xs mt-1">
          Please connect to the internet to validate your license.
        </p>
      </div>

      <!-- Error for expired grace period -->
      <div
        v-if="licenseState && licenseState.licenseState === 'GRACE_EXPIRED'"
        class="mt-4 p-3 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded text-sm"
      >
        <p class="text-red-600 dark:text-red-400 font-medium">
          ❌ Grace period expired
        </p>
        <p class="text-red-600 dark:text-red-400 text-xs mt-1">
          Please connect to the internet to validate your license.
        </p>
      </div>

      <!-- Unlicensed state -->
      <div
        v-if="!licenseState || licenseState.licenseState === 'UNLICENSED'"
        class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded text-sm"
      >
        <p class="text-blue-600 dark:text-blue-400">
          ℹ️ No active license found. Activate a license to unlock all features.
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
import LicenseStatus from 'src/components/Custom/LicenseStatus.vue';
import LicenseActivation from 'src/pages/Custom/LicenseActivation.vue';
import { showToast } from 'src/utils/interactive';

export default defineComponent({
  name: 'LicenseSettings',
  components: {
    Button,
    LicenseStatus,
    LicenseActivation,
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
        const result = await window.ipc.invoke('get-license-state');
        this.licenseState = result;
      } catch (error) {
        console.error('Failed to check license:', error);
        showToast({
          type: 'error',
          message: 'Failed to check license status',
        });
      }
    },
    async clearLicense() {
      try {
        await window.ipc.invoke('clear-license');
        await this.checkLicense();
        showToast({
          type: 'success',
          message: 'License cleared successfully',
        });
      } catch (error) {
        console.error('Failed to clear license:', error);
        showToast({
          type: 'error',
          message: 'Failed to clear license',
        });
      }
    },
    async handleLicenseActivated(result: any) {
      this.showActivationModal = false;
      this.licenseState = result;
      showToast({
        type: 'success',
        message: 'License activated successfully!',
      });
    },
    formatDate(dateString: string): string {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
});
</script>
