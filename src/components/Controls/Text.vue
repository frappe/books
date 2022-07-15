<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <textarea
      ref="input"
      rows="3"
      :class="['resize-none', inputClasses]"
      :value="value"
      :placeholder="inputPlaceholder"
      style="vertical-align: top"
      :readonly="isReadOnly"
      @blur="(e) => triggerChange(e.target.value)"
      @focus="(e) => $emit('focus', e)"
      @input="(e) => $emit('input', e)"
    ></textarea>
  </div>
</template>

<script>
import Base from './Base.vue';

export default {
  name: 'Text',
  extends: Base,
  emits: ['focus', 'input'],
};
</script>
