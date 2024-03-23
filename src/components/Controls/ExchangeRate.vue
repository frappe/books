<template>
  <div class="flex items-center bg-gray-50 rounded-md text-sm p-1 border">
    <div
      class="rate-container"
      :class="disabled ? 'bg-gray-100' : 'bg-gray-25'"
    >
      <input v-model="fromValue" type="number" :disabled="disabled" min="0" />
      <p>{{ left }}</p>
    </div>

    <p class="mx-1 text-gray-600">=</p>

    <div
      class="rate-container"
      :class="disabled ? 'bg-gray-100' : 'bg-gray-25'"
    >
      <input
        type="number"
        :value="isSwapped ? fromValue / exchangeRate : exchangeRate * fromValue"
        :disabled="disabled"
        min="0"
        @change="rightChange"
      />
      <p>{{ right }}</p>
    </div>

    <button
      v-if="!disabled"
      class="bg-green-100 px-2 ms-1 -me-0.5 h-full border-s"
      @click="swap"
    >
      <feather-icon name="refresh-cw" class="w-3 h-3 text-gray-600" />
    </button>
  </div>
</template>
<script lang="ts">
import { safeParseFloat } from 'utils/index';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    disabled: { type: Boolean, default: false },
    fromCurrency: { type: String, default: 'USD' },
    toCurrency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 75 },
  },
  emits: ['change'],
  data() {
    return { fromValue: 1, isSwapped: false };
  },
  computed: {
    left(): string {
      if (this.isSwapped) {
        return this.toCurrency;
      }

      return this.fromCurrency;
    },
    right(): string {
      if (this.isSwapped) {
        return this.fromCurrency;
      }

      return this.toCurrency;
    },
  },
  methods: {
    swap() {
      this.isSwapped = !this.isSwapped;
    },
    rightChange(e: Event) {
      let value: string | number = 1;
      if (e.target instanceof HTMLInputElement) {
        value = e.target.value;
      }

      value = safeParseFloat(value);

      let exchangeRate = value / this.fromValue;
      if (this.isSwapped) {
        exchangeRate = this.fromValue / value;
      }

      this.$emit('change', exchangeRate);
    },
  },
});
</script>
<style scoped>
input[type='number'] {
  @apply w-12 bg-transparent p-0.5;
}

.rate-container {
  @apply flex items-center rounded-md  border-gray-100 text-gray-900 text-sm  px-1  focus-within:border-gray-200 bg-transparent;
}

.rate-container > p {
  @apply text-xs text-gray-600;
}
</style>
