<template>
  <div class="flex items-center gap-2">
    <!-- Status Badge -->
    <Badge :color="statusColor">
      {{ statusText }}
    </Badge>

    <!-- Days Remaining (if applicable) -->
    <span
      v-if="showDaysRemaining"
      class="text-xs text-gray-600 dark:text-gray-400"
    >
      {{ daysRemainingText }}
    </span>

    <!-- Refresh Button -->
    <button
      v-if="showRefresh"
      class="
        text-xs
        text-gray-500
        hover:text-gray-700
        dark:text-gray-500
        dark:hover:text-gray-300
        underline
      "
      :disabled="isChecking"
      @click="checkLicense"
    >
      {{ isChecking ? t`Checking...` : t`Refresh` }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Badge from 'src/components/Badge.vue';

interface LicenseState {
  state: string;
  isValid: boolean;
  daysRemaining?: number;
  validatedOnline: boolean;
}

export default defineComponent({
  name: 'LicenseStatus',
  components: {
    Badge,
  },
  props: {
    licenseState: {
      type: Object as PropType<LicenseState | null>,
      default: null,
    },
    showRefresh: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['refresh'],
  data() {
    return {
      isChecking: false,
    };
  },
  computed: {
    statusColor(): string {
      if (!this.licenseState) {
        return 'gray';
      }

      switch (this.licenseState.state) {
        case 'ACTIVE_ONLINE':
          return 'green';
        case 'ACTIVE_OFFLINE':
          return 'blue';
        case 'GRACE_EXPIRING':
          return 'orange';
        case 'GRACE_EXPIRED':
        case 'EXPIRED':
        case 'INVALID':
          return 'red';
        case 'UNLICENSED':
        default:
          return 'gray';
      }
    },
    statusText(): string {
      if (!this.licenseState) {
        return this.t`No License`;
      }

      switch (this.licenseState.state) {
        case 'ACTIVE_ONLINE':
          return this.t`Active`;
        case 'ACTIVE_OFFLINE':
          return this.t`Active (Offline)`;
        case 'GRACE_EXPIRING':
          return this.t`Expiring Soon`;
        case 'GRACE_EXPIRED':
          return this.t`Grace Expired`;
        case 'EXPIRED':
          return this.t`Expired`;
        case 'INVALID':
          return this.t`Invalid`;
        case 'UNLICENSED':
        default:
          return this.t`Unlicensed`;
      }
    },
    showDaysRemaining(): boolean {
      return !!(
        this.licenseState &&
        (this.licenseState.state === 'ACTIVE_OFFLINE' ||
          this.licenseState.state === 'GRACE_EXPIRING') &&
        this.licenseState.daysRemaining !== undefined
      );
    },
    daysRemainingText(): string {
      if (!this.licenseState?.daysRemaining) {
        return '';
      }

      const days = this.licenseState.daysRemaining;
      if (days === 1) {
        return this.t`(1 day remaining)`;
      }
      return this.t`(${days} days remaining)`;
    },
  },
  methods: {
    async checkLicense() {
      this.isChecking = true;
      try {
        await this.$emit('refresh');
      } finally {
        this.isChecking = false;
      }
    },
  },
});
</script>
