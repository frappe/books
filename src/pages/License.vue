<template>
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-890">
    <div class="p-6 overflow-auto custom-scroll custom-scroll-thumb1">
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {{ t`License Management` }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {{ t`Activate and manage your RareBooks license` }}
          </p>
        </div>

        <!-- License Status Card -->
        <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {{ t`Current Status` }}
          </h2>

          <div class="flex items-center gap-4 mb-6">
            <LicenseStatus :license-state="licenseState" @refresh="checkLicense" />

            <div class="flex gap-2">
              <Button
                v-if="!licenseState || (!licenseState.isValid && licenseState.state !== 'EXPIRED')"
                type="primary"
                @click="showActivationModal = true"
              >
                {{ licenseState ? t`Re-activate` : t`Activate License` }}
              </Button>

              <Button
                v-if="licenseState && licenseState.isValid"
                type="secondary"
                @click="clearLicense"
              >
                {{ t`Clear License` }}
              </Button>
            </div>
          </div>

          <!-- License Details -->
          <div
            v-if="licenseState && licenseState.isValid"
            class="mt-4 p-4 bg-gray-50 dark:bg-gray-850 rounded"
          >
            <div class="grid grid-cols-2 gap-4">
              <div v-if="licenseState.licenseeName">
                <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">{{ t`Licensed to:` }}</p>
                <p class="font-medium text-gray-900 dark:text-gray-100">{{ licenseState.licenseeName }}</p>
              </div>
              <div v-if="licenseState.licenseeEmail">
                <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">{{ t`Email:` }}</p>
                <p class="font-medium text-gray-900 dark:text-gray-100">{{ licenseState.licenseeEmail }}</p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">
                  {{ licenseState.expiresAt ? t`Expiration Date:` : t`License Type:` }}
                </p>
                <p class="font-medium text-gray-900 dark:text-gray-100">
                  {{ licenseState.expiresAt ? formatDate(licenseState.expiresAt) : t`LIFETIME LICENSE` }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400 text-xs mb-1">{{ t`Licence last validated:` }}</p>
                <p class="font-medium text-gray-900 dark:text-gray-100">
                  {{ formatDate(licenseState.lastValidatedAt) }}
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ licenseState.validatedOnline ? t`(online)` : t`(offline)` }}
                  </span>
                </p>
              </div>
            </div>

            <div
              v-if="licenseState.gracePeriodInfo"
              class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <p class="text-xs text-gray-600 dark:text-gray-400">
                {{ t`Offline grace period` }}: {{ licenseState.gracePeriodInfo.daysRemaining }} {{ t`days remaining` }}
              </p>
            </div>
          </div>

          <div
            v-if="licenseState && licenseState.state === 'GRACE_EXPIRING'"
            class="mt-4 p-4 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 rounded"
          >
            <p class="text-orange-600 dark:text-orange-400 font-medium">⚠️ {{ t`Grace period expiring soon` }}</p>
            <p class="text-orange-600 dark:text-orange-400 text-sm mt-1">
              {{ t`Please connect to the internet to validate your license.` }}
            </p>
          </div>

          <div
            v-if="licenseState && licenseState.state === 'GRACE_EXPIRED'"
            class="mt-4 p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded"
          >
            <p class="text-red-600 dark:text-red-400 font-medium">❌ {{ t`Grace period expired` }}</p>
            <p class="text-red-600 dark:text-red-400 text-sm mt-1">
              {{ t`Please connect to the internet to validate your license.` }}
            </p>
          </div>

          <div
            v-if="!licenseState || licenseState.state === 'UNLICENSED'"
            class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded"
          >
            <p class="text-blue-600 dark:text-blue-400 font-medium mb-2">ℹ️ {{ t`No active license found` }}</p>
            <p class="text-blue-600 dark:text-blue-400 text-sm">
              {{ t`Please activate a license to access RareBooks. Click the "Activate License" button above to get started.` }}
            </p>
          </div>
        </div>

        <!-- Purchase Subscription Section -->
        <div
          v-if="shouldShowPurchaseSection"
          class="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6"
        >
          <h3 class="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            {{ t`Purchase Yearly License` }}
          </h3>

          <div v-if="!showPaymentUI" class="space-y-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ licenseState.state === 'UNLICENSED' ? t`Purchase a yearly license to access all features of RareBooks.` : t`Your license has expired. Purchase a new license to continue using RareBooks.` }}
            </p>
            <Button type="primary" @click="startPurchaseFlow">
              {{ t`Buy License` }}
            </Button>
          </div>

          <div v-else>
            <!-- Step 1: select payment method -->
            <PaymentMethodSelector
              v-if="paymentStep === 'method'"
              @methodSelected="handleMethodSelected"
              @cancel="cancelPurchase"
            />

            <!-- Step 2: enter phone number & pay -->
            <MobilePaymentForm
              v-else-if="paymentStep === 'payment'"
              :payment-method="selectedPaymentMethod"
              :payment-method-name="selectedPaymentMethodName"
              :subscription-amount="selectedSubscriptionAmount"
              :fee="selectedFee"
              :charge-amount="selectedChargeAmount"
              :total="selectedTotal"
              @back="paymentStep = 'method'"
              @completed="handlePaymentCompleted"
            />
          </div>
        </div>

        <!-- Help Section -->
        <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">{{ t`Need Help?` }}</h3>
          <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>{{ t`For support with license activation or other issues, please contact our support team by call or Whatsapp on +255 689 255 545.` }}</p>
          </div>
        </div>
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
import PaymentMethodSelector from 'src/components/Custom/PaymentMethodSelector.vue';
import MobilePaymentForm from 'src/components/Custom/MobilePaymentForm.vue';
import { showToast } from 'src/utils/interactive';

interface MethodSelectedPayload {
  method: string;
  subscriptionAmount: number;
  fee: number;
  total: number;
}

export default defineComponent({
  name: 'License',
  components: {
    Button,
    LicenseStatus,
    LicenseActivation,
    PaymentMethodSelector,
    MobilePaymentForm,
  },
  data() {
    return {
      licenseState: null as any,
      showActivationModal: false,
      showPaymentUI: false,
      paymentStep: 'method' as 'method' | 'payment',
      // These are plain strings/numbers passed as props to MobilePaymentForm
      selectedPaymentMethod:     null as string | null,
      selectedPaymentMethodName: null as string | null,
      selectedSubscriptionAmount: 0,
      selectedFee:          0,
      selectedChargeAmount: 0,
      selectedTotal:        0,
    };
  },
  computed: {
    shouldShowPurchaseSection(): boolean {
      return !!(
        this.licenseState &&
        (this.licenseState.state === 'EXPIRED' ||
          this.licenseState.state === 'INVALID' ||
          this.licenseState.state === 'GRACE_EXPIRED' ||
          this.licenseState.state === 'UNLICENSED')
      );
    },
  },
  async mounted() {
    await this.checkLicense();
  },
  methods: {
    async checkLicense() {
      try {
        const result = await window.ipc.invoke('check-license');
        this.licenseState = result;
        showToast({ type: 'success', message: this.t`License status checked successfully` });
      } catch (error) {
        console.error('Failed to check license:', error);
        showToast({ type: 'error', message: this.t`Failed to check license status` });
      }
    },

    async clearLicense() {
      try {
        await window.ipc.invoke('clear-license');
        await this.checkLicense();
        showToast({ type: 'success', message: this.t`License cleared successfully` });
      } catch (error) {
        console.error('Failed to clear license:', error);
        showToast({ type: 'error', message: this.t`Failed to clear license` });
      }
    },

    async handleLicenseActivated(result: any) {
      this.showActivationModal = false;
      this.licenseState = result;
      showToast({ type: 'success', message: this.t`License activated successfully!` });
      this.$router.push('/');
    },

    formatDate(dateString: string): string {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    },

    startPurchaseFlow() {
      this.showPaymentUI = true;
      this.paymentStep   = 'method';
    },

    /**
     * Receives { method, subscriptionAmount, fee, total } from PaymentMethodSelector.
     * Destructure here — never pass the whole object as a String prop.
     */
    handleMethodSelected(payload: MethodSelectedPayload) {
      this.selectedPaymentMethod      = payload.method;
      this.selectedPaymentMethodName  = payload.method;   // display name = channel name from API
      this.selectedSubscriptionAmount = payload.subscriptionAmount;
      this.selectedFee                = payload.fee;
      this.selectedChargeAmount       = payload.chargeAmount;
      this.selectedTotal              = payload.total;
      this.paymentStep                = 'payment';
    },

    async handlePaymentCompleted(result: any) {
      this.licenseState  = result;
      this.showPaymentUI = false;
      this.paymentStep   = 'method';
      this.selectedPaymentMethod      = null;
      this.selectedPaymentMethodName  = null;
      this.selectedSubscriptionAmount = 0;
      this.selectedFee                = 0;
      this.selectedChargeAmount       = 0;
      this.selectedTotal              = 0;
      showToast({ type: 'success', message: this.t`Subscription activated successfully!` });
      this.$router.push('/');
    },

    cancelPurchase() {
      this.showPaymentUI = false;
      this.paymentStep   = 'method';
      this.selectedPaymentMethod      = null;
      this.selectedPaymentMethodName  = null;
      this.selectedSubscriptionAmount = 0;
      this.selectedFee                = 0;
      this.selectedChargeAmount       = 0;
      this.selectedTotal              = 0;
    },
  },
});
</script>