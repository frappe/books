<template>
  <div
    v-if="showNotification"
    class="fixed bottom-4 right-4 max-w-md bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 shadow-lg rounded"
    style="z-index: 9999"
  >
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <feather-icon
          name="alert-circle"
          class="h-5 w-5 text-yellow-400"
        />
      </div>
      <div class="ml-3 flex-1">
        <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          {{ t`License Sync Required` }}
        </p>
        <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
          {{ message }}
        </p>
        <div class="mt-3 flex gap-2">
          <Button
            type="primary"
            class="text-sm"
            :loading="isSyncing"
            @click="syncNow"
          >
            {{ t`Sync Now` }}
          </Button>
          <Button
            class="text-sm"
            @click="dismiss"
          >
            {{ t`Dismiss` }}
          </Button>
        </div>
      </div>
      <button
        class="ml-4 flex-shrink-0"
        @click="dismiss"
      >
        <feather-icon
          name="x"
          class="h-4 w-4 text-yellow-600 dark:text-yellow-400"
        />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { defineComponent, ref, onMounted } from 'vue';
import Button from 'src/components/Button.vue';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';
import { License } from 'custom/models/License';

export default defineComponent({
  name: 'SyncNotification',
  components: {
    Button,
    FeatherIcon,
  },
  setup() {
    const showNotification = ref(false);
    const message = ref('');
    const isSyncing = ref(false);

    const checkSyncStatus = async () => {
      try {
        const license = (await fyo.doc.getSingle('License')) as License;
        
        if (!license) {
          return;
        }

        const daysSinceSync = await license.checkSyncStatus();
        const needsSync = await license.needsSync();

        if (needsSync) {
          if (daysSinceSync > 30) {
            message.value = t`Your license hasn't been validated in over 30 days. Please connect to the internet to sync.`;
          } else if (daysSinceSync >= 7) {
            message.value = t`It's been ${daysSinceSync} days since your last license sync. Please connect to the internet to validate your license.`;
          }
          showNotification.value = true;
        }
      } catch (error) {
        console.error('Error checking sync status:', error);
      }
    };

    const syncNow = async () => {
      isSyncing.value = true;
      try {
        const license = (await fyo.doc.getSingle('License')) as License;
        const result = await license.validateWithServer();

        if (result.valid) {
          showToast({
            message: t`License validated successfully!`,
            type: 'success',
          });
          showNotification.value = false;
        } else {
          showToast({
            message: t`License validation failed: ${result.error || 'Unknown error'}`,
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Sync error:', error);
        showToast({
          message: t`Failed to connect to the server. Please check your internet connection.`,
          type: 'error',
        });
      } finally {
        isSyncing.value = false;
      }
    };

    const dismiss = () => {
      showNotification.value = false;
      // Set a flag to not show again for 24 hours
      localStorage.setItem('license_sync_dismissed', new Date().toISOString());
    };

    onMounted(async () => {
      // Check if dismissed in the last 24 hours
      const dismissed = localStorage.getItem('license_sync_dismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const hoursSinceDismissal = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceDismissal < 24) {
          return;
        }
      }

      await checkSyncStatus();
    });

    return {
      showNotification,
      message,
      isSyncing,
      syncNow,
      dismiss,
    };
  },
});
</script>
