<template>
  <div>
    <div :class="labelClasses" v-if="showLabel">
      {{ df.label }}
    </div>
    <div :class="showMandatory ? 'show-mandatory' : ''">
      <textarea
        ref="input"
        rows="3"
        :class="['resize-none', inputClasses, containerClasses]"
        :value="value"
        :placeholder="inputPlaceholder"
        style="vertical-align: top"
        :readonly="isReadOnly"
        @blur="(e) => triggerChange(e.target.value)"
        @focus="(e) => $emit('focus', e)"
        @input="(e) => $emit('input', e)"
      ></textarea>
    </div>
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
