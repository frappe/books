<template>
  <div class="mobile-payment-form">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
      {{ t`Enter Mobile Number` }}
    </h3>

    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      {{ t`Payment Method:` }} <span class="font-semibold">{{ paymentMethodName }}</span>
    </p>

    <!-- Amount Summary -->
    <div v-if="paymentStatus !== 'pending'" class="mb-4 p-3 bg-gray-50 dark:bg-gray-850 rounded border border-gray-200 dark:border-gray-700 text-xs space-y-1">
      <div class="flex justify-between">
        <span class="text-gray-500 dark:text-gray-400">{{ t`Subscription` }}</span>
        <span class="text-gray-800 dark:text-gray-200 font-medium">{{ formatAmount(subscriptionAmount) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500 dark:text-gray-400">{{ t`Processing fee` }}</span>
        <span class="text-gray-800 dark:text-gray-200 font-medium">{{ formatAmount(0) }}</span>
      </div>
      <div class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
        <span class="font-semibold text-gray-700 dark:text-gray-300">{{ t`You pay` }}</span>
        <span class="font-bold text-gray-900 dark:text-gray-100">{{ formatAmount(subscriptionAmount) }}</span>
      </div>
    </div>

    <!-- Phone Number Input -->
    <div v-if="paymentStatus !== 'pending'" class="mb-4">
      <label class="text-gray-600 dark:text-gray-500 text-sm mb-2 block">
        {{ t`Mobile Phone Number` }}
      </label>
      <div class="flex gap-2">
        <input
          v-model="phoneNumber"
          type="tel"
          class="
            flex-1 bg-transparent text-base focus:outline-none
            placeholder-gray-500 text-gray-900 dark:text-gray-100
            rounded focus-within:bg-gray-100 dark:focus-within:bg-gray-850
            border border-gray-200 dark:border-gray-800
            bg-gray-25 dark:bg-gray-875 px-3 py-2
          "
          :placeholder="t`255721909901`"
          :disabled="isProcessing || paymentConfirmed"
          @keyup.enter="submitPayment"
        />
        <Button
          type="primary"
          :disabled="!isPhoneValid || isProcessing || paymentConfirmed"
          @click="submitPayment"
        >
          {{ isProcessing ? t`Processing...` : t`Submit` }}
        </Button>
      </div>
      <p v-if="phoneError" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ phoneError }}</p>
    </div>

    <!-- Payment Status Messages -->
    <div v-if="paymentStatus" class="mb-4">

      <!-- Pending — with countdown -->
      <div
        v-if="paymentStatus === 'pending'"
        class="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded"
      >
        <p class="text-blue-700 dark:text-blue-300 font-semibold mb-1">
          📱 {{ t`Check your phone and enter your PIN` }}
        </p>
        <p class="text-blue-600 dark:text-blue-400 text-sm mb-3">
          {{ t`A payment request of` }} <strong>{{ formatAmount(subscriptionAmount) }}</strong>
          {{ t`has been sent to` }} <strong>{{ phoneNumber }}</strong>.
        </p>

        <!-- Countdown ring -->
        <div class="flex items-center gap-4">
          <div class="relative w-16 h-16 flex-shrink-0">
            <svg class="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <!-- Track -->
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                class="text-blue-200 dark:text-blue-800"
              />
              <!-- Progress -->
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                class="text-blue-500 transition-all duration-1000"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
              />
            </svg>
            <!-- Time label -->
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-xs font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                {{ countdownLabel }}
              </span>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-blue-700 dark:text-blue-300">
              {{ t`Waiting for confirmation` }}
            </p>
            <p class="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
              {{ t`Request expires in` }} {{ countdownLabel }}
            </p>
          </div>
        </div>
      </div>

      <!-- Success -->
      <div
        v-else-if="paymentStatus === 'completed'"
        class="p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded"
      >
        <p class="text-green-600 dark:text-green-400 font-medium mb-2">✅ {{ t`Payment confirmed!` }}</p>
        <p class="text-green-600 dark:text-green-400 text-sm">{{ statusMessage }}</p>
        <div class="mt-3 flex items-center gap-2">
          <div class="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
          <span class="text-xs text-green-600 dark:text-green-400">{{ t`Creating your license...` }}</span>
        </div>
      </div>

      <!-- Failed -->
      <div
        v-else-if="paymentStatus === 'failed'"
        class="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded"
      >
        <p class="text-red-600 dark:text-red-400 font-medium mb-2">❌ {{ t`Payment failed` }}</p>
        <p class="text-red-600 dark:text-red-400 text-sm">{{ statusMessage }}</p>
      </div>

      <!-- Expired -->
      <div
        v-else-if="paymentStatus === 'expired'"
        class="p-4 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 rounded"
      >
        <p class="text-orange-600 dark:text-orange-400 font-medium mb-2">⏱️ {{ t`Payment request expired` }}</p>
        <p class="text-orange-600 dark:text-orange-400 text-sm">{{ statusMessage }}</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-between gap-4 mt-6">
      <Button type="secondary" :disabled="isProcessing" @click="$emit('back')">
        {{ t`Back` }}
      </Button>
      <Button
        v-if="paymentStatus === 'failed' || paymentStatus === 'expired'"
        type="primary"
        @click="resetForm"
      >
        {{ t`Try Again` }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Button from 'src/components/Button.vue';
import { showToast } from 'src/utils/interactive';

const TIMEOUT_SECONDS = 300; // 5 minutes
const CIRCLE_RADIUS   = 26;
const CIRCUMFERENCE   = 2 * Math.PI * CIRCLE_RADIUS; // ≈ 163.4

export default defineComponent({
  name: 'MobilePaymentForm',
  components: { Button },

  props: {
    /** Channel name from the API e.g. "AIRTEL-MONEY" */
    paymentMethod: { type: String, required: true },
    /** Display label */
    paymentMethodName: { type: String, required: true },
    /** Yearly subscription price (what the user sees they pay) */
    subscriptionAmount: { type: Number, default: 0 },
    /** Processing fee for this channel */
    fee: { type: Number, default: 0 },
    /** subscriptionAmount - fee: what we actually send to ClickPesa so customer sees exactly subscriptionAmount */
    chargeAmount: { type: Number, required: true },
    total: { type: Number, default: 0 },
  },

  emits: ['back', 'completed'],

  data() {
    return {
      phoneNumber:       '',
      phoneError:        null as string | null,
      isProcessing:      false,
      orderReference:    null as string | null,
      paymentStatus:     null as 'pending' | 'completed' | 'failed' | 'expired' | null,
      statusMessage:     null as string | null,
      paymentConfirmed:  false,

      // Countdown
      secondsRemaining:  TIMEOUT_SECONDS,
      circumference:     CIRCUMFERENCE,
      countdownInterval: null as ReturnType<typeof setInterval> | null,

      // Polling
      pollInterval:  null as ReturnType<typeof setInterval> | null,
      pollTimeout:   null as ReturnType<typeof setTimeout>  | null,
    };
  },

  computed: {
    isPhoneValid(): boolean {
      const c = this.phoneNumber.replace(/\s+/g, '');
      return /^\+255[67]\d{8}$/.test(c) || /^255[67]\d{8}$/.test(c) || /^0[67]\d{8}$/.test(c);
    },

    /** SVG dash offset — full circle when full time remains, 0 when expired */
    dashOffset(): number {
      const progress = this.secondsRemaining / TIMEOUT_SECONDS;
      return CIRCUMFERENCE * (1 - progress);
    },

    /** MM:SS label */
    countdownLabel(): string {
      const m = Math.floor(this.secondsRemaining / 60);
      const s = this.secondsRemaining % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },
  },

  beforeUnmount() {
    this.stopPolling();
    this.stopCountdown();
  },

  methods: {
    formatAmount(value: number): string {
      return `TZS ${value.toLocaleString('en-TZ')}`;
    },

    normalizePhone(raw: string): string {
      const c = raw.replace(/\s+/g, '');
      if (c.startsWith('0'))  return '255' + c.substring(1);
      if (c.startsWith('+'))  return c.substring(1);
      return c;
    },

    async submitPayment() {
      if (!this.isPhoneValid) {
        this.phoneError = this.t`Please enter a valid Tanzanian phone number`;
        return;
      }
      this.phoneError    = null;
      this.isProcessing  = true;
      this.paymentStatus = null;
      this.statusMessage = null;

      try {
        const phoneNumber = this.normalizePhone(this.phoneNumber);

        // ClickPesa adds fee on top of what we send, so we send chargeAmount
        // (= subscriptionAmount - fee) — customer USSD shows exactly subscriptionAmount.
        const result = await window.ipc.invoke('initiate-payment', {
          phoneNumber,
          paymentMethod: this.paymentMethod,
          amount:        this.chargeAmount,
        });

        this.orderReference = result.orderReference;
        this.paymentStatus  = 'pending';

        this.startCountdown();
        this.startPolling();
      } catch (error) {
        console.error('Payment initiation error:', error);
        this.paymentStatus = 'failed';
        this.statusMessage = error instanceof Error ? error.message : this.t`Failed to initiate payment`;
        this.isProcessing  = false;
      }
    },

    // ── Countdown ─────────────────────────────────────────────────────────────

    startCountdown() {
      this.secondsRemaining = TIMEOUT_SECONDS;
      this.countdownInterval = setInterval(() => {
        if (this.secondsRemaining > 0) {
          this.secondsRemaining -= 1;
        } else {
          this.stopCountdown();
        }
      }, 1_000);
    },

    stopCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },

    // ── Polling ───────────────────────────────────────────────────────────────

    startPolling() {
      this.pollInterval = setInterval(() => this.checkPaymentStatus(), 5_000);

      this.pollTimeout = setTimeout(() => {
        if (this.paymentStatus === 'pending') {
          this.stopPolling();
          this.stopCountdown();
          this.paymentStatus = 'expired';
          this.statusMessage = this.t`Payment request timed out. Please try again.`;
          this.isProcessing  = false;
        }
      }, TIMEOUT_SECONDS * 1_000);
    },

    stopPolling() {
      if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
      if (this.pollTimeout)  { clearTimeout(this.pollTimeout);   this.pollTimeout  = null; }
    },

    async checkPaymentStatus() {
      if (!this.orderReference) return;
      try {
        const result = await window.ipc.invoke('check-payment-status', this.orderReference);

        if (result.status === 'completed') {
          this.paymentConfirmed = true;
          this.paymentStatus    = 'completed';
          this.statusMessage    = this.t`Payment received successfully!`;
          this.stopPolling();
          this.stopCountdown();
          await this.completeSubscription();

        } else if (result.status === 'failed') {
          this.stopPolling();
          this.stopCountdown();
          this.paymentStatus = 'failed';
          this.statusMessage = result.message || this.t`Payment was not successful`;
          this.isProcessing  = false;
        }
        // PROCESSING / PENDING → keep polling
      } catch (error) {
        console.error('Payment status check error:', error);
      }
    },

    async completeSubscription() {
      try {
        const result = await window.ipc.invoke('complete-subscription', this.orderReference);
        if (result.success) {
          showToast({ type: 'success', message: this.t`License activated successfully!` });
          this.$emit('completed', result.activationResult);
        } else {
          throw new Error(result.error || 'Subscription completion failed');
        }
      } catch (error) {
        console.error('Subscription completion error:', error);
        this.paymentStatus = 'failed';
        this.statusMessage = error instanceof Error ? error.message : this.t`Failed to complete subscription`;
        showToast({ type: 'error', message: this.t`Failed to activate license. Please contact support.` });
      } finally {
        this.isProcessing = false;
      }
    },

    resetForm() {
      this.phoneNumber       = '';
      this.phoneError        = null;
      this.isProcessing      = false;
      this.orderReference    = null;
      this.paymentStatus     = null;
      this.statusMessage     = null;
      this.paymentConfirmed  = false;
      this.secondsRemaining  = TIMEOUT_SECONDS;
      this.stopPolling();
      this.stopCountdown();
    },
  },
});
</script>