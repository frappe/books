<template>
  <div
    :class="[containerClasses]"
    class="
      mt-6
      w-full
      text-gray-900
      dark:text-gray-100
      text-base
      focus:outline-none
    "
  >
    <label class="flex w-full">
      <button
        type="button"
        @click="onClick"
        :disabled="isReadOnly"
        class="
          w-full
          flex
          items-center
          justify-center
          p-2
          rounded-md
          bg-blue-300
          hover:bg-blue-400 hover:shadow-md hover:-translate-y-[1px]
          transition
        "
      >
        {{ df.label }}
      </button>
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
