<template>
  <Modal :open-modal="open" @closemodal="$emit('close')">
    <div class="flex flex-col gap-4 p-6 w-form">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-25">
          {{ t`Activate License` }}
        </h2>
      </div>

      <!-- Description -->
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ t`Enter your license key to activate RareBooks.` }}
      </p>

      <!-- License Key Input -->
      <div class="flex flex-col gap-2">
        <label class="text-gray-600 dark:text-gray-500 text-sm">
          {{ t`License Key` }}
        </label>
        <input
          v-model="licenseKey"
          type="text"
          class="
            bg-transparent
            text-base
            focus:outline-none
            w-full
            placeholder-gray-500
            text-gray-900
            dark:text-gray-100
            rounded
            focus-within:bg-gray-100
            dark:focus-within:bg-gray-850
            border
            border-gray-200
            dark:border-gray-800
            bg-gray-25
            dark:bg-gray-875
            px-3
            py-2
          "
          :placeholder="t`XXXXX-XXXXX-XXXXX-XXXXX`"
          :disabled="isActivating"
          @keyup.enter="activateLicense"
        />
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="
          text-sm
          text-red-600
          dark:text-red-400
          bg-red-50
          dark:bg-red-900
          dark:bg-opacity-20
          p-3
          rounded
        "
      >
        {{ errorMessage }}
      </div>

      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="
          text-sm
          text-green-600
          dark:text-green-400
          bg-green-50
          dark:bg-green-900
          dark:bg-opacity-20
          p-3
          rounded
        "
      >
        {{ successMessage }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-4 mt-2">
        <Button
          type="secondary"
          :disabled="isActivating"
          @click="$emit('close')"
        >
          {{ t`Cancel` }}
        </Button>
        <Button
          type="primary"
          :disabled="!licenseKey.trim() || isActivating"
          @click="activateLicense"
        >
          {{ isActivating ? t`Activating...` : t`Activate` }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';

export default defineComponent({
  name: 'LicenseActivation',
  components: {
    Button,
    Modal,
  },
  props: {
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'activated'],
  data() {
    return {
      licenseKey: '',
      isActivating: false,
      errorMessage: '',
      successMessage: '',
    };
  },
  methods: {
    async activateLicense() {
      if (!this.licenseKey.trim()) {
        return;
      }

      this.isActivating = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        // Call IPC to activate license
        const result = await (window as any).ipc.invoke(
          'activate-license',
          this.licenseKey.trim()
        );

        if (result.isValid) {
          this.successMessage = this.t`License activated successfully!`;
          
          // Emit success and close after delay
          setTimeout(() => {
            this.$emit('activated', result);
            this.$emit('close');
          }, 1500);
        } else {
          this.errorMessage = result.error || this.t`License activation failed`;
        }
      } catch (error) {
        console.error('License activation error:', error);
        this.errorMessage =
          error instanceof Error
            ? error.message
            : this.t`Failed to activate license`;
      } finally {
        this.isActivating = false;
      }
    },
  },
});
</script>
