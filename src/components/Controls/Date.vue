<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>

    <DatePicker
      ref="input"
      :input-class="['bg-transparent', inputClasses, containerClasses]"
      :value="value"
      :placeholder="inputPlaceholder"
      :readonly="isReadOnly"
      :format-value="formatValue"
      @change="(value) => triggerChange(value)"
    />
  </div>
</template>

<script>
import { fyo } from 'src/initFyo';
import DatePicker from '../DatePicker/DatePicker';
import Base from './Base';

export default {
  name: 'Date',
  extends: Base,
  components: {
    DatePicker,
  },
  computed: {
    inputType() {
      return 'date';
    },
  },
  methods: {
    formatValue(value) {
      return fyo.format(value, this.df);
    },
  },
};
</script>
