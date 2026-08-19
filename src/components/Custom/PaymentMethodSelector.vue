<template>
  <div class="payment-method-selector">
    <h3 class="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">
      {{ t`Select Payment Method` }}
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      {{ t`Choose your mobile money provider` }}
    </p>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
        <div
          class="
            animate-spin
            h-5
            w-5
            border-2 border-gray-400 border-t-transparent
            rounded-full
          "
        ></div>
        {{ t`Loading payment methods...` }}
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="
        p-4
        bg-red-50
        dark:bg-red-900 dark:bg-opacity-20
        rounded
        text-red-600
        dark:text-red-400
      "
    >
      {{ error }}
    </div>

    <!-- Icon-only Methods Grid -->
    <div v-else class="grid grid-cols-4 gap-2">
      <button
        v-for="method in paymentMethods"
        :key="`pm-${method.name}`"
        type="button"
        class="
          relative
          flex flex-col
          items-center
          justify-center
          p-2
          border-2
          rounded-xl
          transition-all
          hover:shadow-lg
          cursor-pointer
          focus:outline-none
        "
        :class="
          selectedMethod === method.name
            ? 'border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-900'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
        "
        @click.prevent="selectMethod(method.name)"
      >
        <!-- Provider Icon -->
          <img
            v-if="providerLogo(method.name)"
            :src="providerLogo(method.name)"
            :alt="method.name"
            class="w-auto h-full object-contain rounded-xl "
            @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
          />
          <span v-else>{{ providerInitials(method.name) }}</span>

        <!-- Selected check badge -->
        <div
          v-if="selectedMethod === method.name"
          class="
            absolute
            top-2
            right-2
            w-5
            h-5
            rounded-full
            bg-blue-500
            flex
            items-center
            justify-center
          "
        >
          <svg
            class="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </button>
    </div>

    <!-- Continue Button -->
    <div class="mt-6 flex justify-end">
      <Button
        type="primary"
        :disabled="!selectedMethod"
        @click="continueToPayment"
      >
        {{ t`Continue` }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts">
import mpesaLogo from "src/assets/img/m-pesa.png";
import tigoLogo from 'src/assets/img/tigo-pesa.jpg';
import airtelLogo from 'src/assets/img/airtel-money.png';
import halopesaLogo from 'src/assets/img/halopesa.png';

import { defineComponent } from 'vue';
import Button from 'src/components/Button.vue';

interface PaymentMethod {
  name: string;
  status: 'AVAILABLE' | string;
  fee?: number;
  message?: string | number;
}

// ─── Provider metadata ────────────────────────────────────────────────────────

const PROVIDER_META: Record<
    string,
    { label: string; color: string; initials: string; logo?: string }
> = {
  'M-PESA': {
    label:    'M-Pesa',
    color:    '#e11d2b',
    initials: 'MP',
    logo:      mpesaLogo, // Use the imported local asset
  },
  'TIGO-PESA': {
    label:    'Mix by Yass',
    color:    '#00aeef',
    initials: 'TP',
    logo:      tigoLogo,
  },
  'AIRTEL-MONEY': {
    label:    'Airtel Money',
    color:    '#e8001c',
    initials: 'AM',
    logo:      airtelLogo,
  },
  'HALOPESA': {
    label:    'HaloPesa',
    color:    '#00843d',
    initials: 'HP',
    logo:      halopesaLogo,
  },
  'HALO-PESA': {
    label:    'HaloPesa',
    color:    '#00843d',
    initials: 'HP',
    logo:      halopesaLogo,
  },
};

function getMeta(name: string) {
  // Try exact match first, then case-insensitive
  return (
    PROVIDER_META[name] ??
    PROVIDER_META[name.toUpperCase()] ??
    Object.entries(PROVIDER_META).find(
      ([k]) => k.replace(/[-\s]/g, '').toLowerCase() === name.replace(/[-\s]/g, '').toLowerCase()
    )?.[1] ??
    null
  );
}

export default defineComponent({
  name: 'PaymentMethodSelector',
  components: { Button },
  emits: ['methodSelected', 'cancel'],

  data() {
    return {
      paymentMethods:     [] as PaymentMethod[],
      selectedMethod:     null as string | null,
      subscriptionAmount: 0,
      loading:            true,
      error:              null as string | null,
    };
  },

  async mounted() {
    this.selectedMethod = null;
    await Promise.all([this.loadSubscriptionAmount(), this.loadPaymentMethods()]);
  },

  methods: {
    async loadSubscriptionAmount() {
      try {
        const amount = await window.ipc.invoke('get-subscription-amount');
        this.subscriptionAmount = Number(amount) || 0;
      } catch {
        this.subscriptionAmount = 0;
      }
    },

    async loadPaymentMethods() {
      try {
        this.loading = true;
        this.error   = null;
        const methods: PaymentMethod[] = await window.ipc.invoke('get-payment-methods');
        this.paymentMethods = (methods ?? []).filter((m) => m.status === 'AVAILABLE');
        this.selectedMethod = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : this.t`Failed to load payment methods`;
        this.paymentMethods = [];
      } finally {
        this.loading = false;
      }
    },

    selectMethod(methodName: string) {
      this.selectedMethod = this.selectedMethod === methodName ? null : methodName;
    },

    continueToPayment() {
      if (!this.selectedMethod) return;
      const method = this.paymentMethods.find((m) => m.name === this.selectedMethod);
      const fee    = method?.fee ?? 0;
      this.$emit('methodSelected', {
        method:             this.selectedMethod,
        subscriptionAmount: this.subscriptionAmount,
        fee,
        // ClickPesa adds fee ON TOP of what we send, so we subtract it
        // upfront: customer USSD shows (subscriptionAmount - fee) + fee = subscriptionAmount
        chargeAmount:       Math.max(0, this.subscriptionAmount - fee),
        total:              this.subscriptionAmount,
      });
    },

    // ── Icon helpers ──────────────────────────────────────────────────────────

    providerColor(name: string): string {
      return getMeta(name)?.color ?? '#6b7280';
    },

    providerInitials(name: string): string {
      return getMeta(name)?.initials ?? name.slice(0, 2).toUpperCase();
    },

    providerLabel(name: string): string {
      return getMeta(name)?.label ?? name;
    },

    providerLogo(name: string): string | undefined {
      return getMeta(name)?.logo;
    },
  },
});
</script>