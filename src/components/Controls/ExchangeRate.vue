<template>
  <div class="flex items-center bg-gray-50 rounded-md textsm px-1 border">
    <div
      class="rate-container"
      :class="disabled ? 'bg-gray-100' : 'bg-gray-25'"
    >
      <input type="number" v-model="fromValue" :disabled="disabled" min="0" />
      <p>{{ left }}</p>
    </div>

    <p class="mx-1 text-gray-600">=</p>

    <div
      class="rate-container"
      :class="disabled ? 'bg-gray-100' : 'bg-gray-25'"
    >
      <input
        type="number"
        ref="toValue"
        :value="isSwapped ? fromValue / exchangeRate : exchangeRate * fromValue"
        :disabled="disabled"
        min="0"
        @change="rightChange"
      />
      <p>{{ right }}</p>
    </div>

    <button
      class="bg-green100 px-2 ms-1 -me-0.5 h-full border-s"
      @click="swap"
      v-if="!disabled"
    >
      <feather-icon name="refresh-cw" class="w-3 h-3 text-gray-600" />
    </button>
  </div>
</template>
<script>
import { safeParseFloat } from 'utils/index';
import { defineComponent } from 'vue';

export default defineComponent({
  emits: ['change'],
  props: {
    disabled: { type: Boolean, default: false },
    fromCurrency: { type: String, default: 'USD' },
    toCurrency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 75 },
  },
  data() {
    return { fromValue: 1, isSwapped: false };
  },
  methods: {
    swap() {
      this.isSwapped = !this.isSwapped;
    },
    rightChange(e) {
      let value = this.$refs.toValue.value;
      if (e) {
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
  computed: {
    left() {
      if (this.isSwapped) {
        return this.toCurrency;
      }

      return this.fromCurrency;
    },
    right() {
      if (this.isSwapped) {
        return this.fromCurrency;
      }

      return this.toCurrency;
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
