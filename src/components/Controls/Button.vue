<template>
  <div
    :class="[containerClasses]"
    class="
      mt-6
      p-2
      w-full
      text-gray-900
      dark:text-gray-100
      text-base
      focus:outline-none
    "
  >
    <label class="flex items-center justify-between w-full">
      <div v-if="showLabel && !labelRight" :class="labelClasses">
        {{ df.label }}
      </div>
      <button
        :class="['flex items-center justify-center']"
        @click="onClick"
        :disabled="isReadOnly"
        type="button"
      ></button>
    </label>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Base from './Base.vue';

export default defineComponent({
  name: 'Button',
  extends: Base,
  props: {
    spaceBetween: {
      type: Boolean,
      default: true,
    },
    labelRight: {
      type: Boolean,
      default: false,
    },
    labelClass: {
      type: String,
      default: '',
    },
    showLabel: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    labelClasses() {
      return this.labelClass || 'text-gray-600 text-base';
    },
  },
  methods: {
    onClick(e: Event) {
      if (this.isReadOnly) return;
      this.triggerChange(true);
    },
  },
});
</script>
