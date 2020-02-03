<template>
  <div>
    <label class="flex items-center">
      <input
        ref="input"
        type="checkbox"
        :class="inputClasses"
        :checked="value"
        :readonly="isReadOnly"
        @change="e => triggerChange(+e.target.checked)"
        @focus="e => $emit('focus', e)"
      />
      <div class="ml-3 text-gray-900 text-sm" v-if="showLabel">
        {{ df.label }}
      </div>
    </label>
  </div>
</template>
<script>
import Base from './Base';

export default {
  name: 'Check',
  extends: Base,
  computed: {
    inputClasses() {
      return this.getInputClassesFromProp([]);
    }
  }
};
</script>
