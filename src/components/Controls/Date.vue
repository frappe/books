<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <DatePicker
      ref="input"
      :input-class="[inputClasses, 'cursor-text']"
      :value="value"
      :placeholder="inputPlaceholder"
      :readonly="isReadOnly"
      :format-value="formatValue"
      @change="value => triggerChange(value)"
    />
  </div>
</template>

<script>
import frappe from 'frappejs';
import Base from './Base';
import DatePicker from '../DatePicker/DatePicker';

export default {
  name: 'Date',
  extends: Base,
  components: {
    DatePicker
  },
  computed: {
    inputType() {
      return 'date';
    }
  },
  methods: {
    formatValue(value) {
      return frappe.format(value, this.df);
    }
  }
};
</script>
