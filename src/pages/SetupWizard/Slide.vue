<template>
  <div class="w-form shadow-lg rounded-lg border relative bg-white" style="height: 700px">
    <!-- Slide Title -->
    <div class="p-4">
      <h1 class="text-2xl font-semibold select-none">
        <slot name="title"></slot>
      </h1>
    </div>
    <hr />

    <!-- Slide Content -->
    <div>
      <slot name="content"></slot>
    </div>

    <!-- Slide Buttons -->
    <div
      class="flex justify-between px-4 pb-4 absolute w-form"
      style="top: 100%; transform: translateY(-100%)"
    >
      <Button
        class="text-sm text-grey-900 w-28"
        @click="$emit('secondary-clicked')"
      >
        <slot name="secondaryButton"></slot>
      </Button>
      <Button
        @click="$emit('primary-clicked')"
        type="primary"
        class="text-sm text-white w-28"
        :disabled="primaryDisabled"
      >
        <slot name="primaryButton"></slot>
      </Button>
    </div>
  </div>
</template>

<script>
import Button from 'src/components/Button.vue';

export default {
  emits: ['primary-clicked', 'secondary-clicked'],
  components: { Button },
  props: {
    usePrimary: { type: Boolean, default: true },
    primaryDisabled: { type: Boolean, default: false },
  },
};
</script>
