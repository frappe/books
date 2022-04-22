<template>
  <div class="w-600 shadow rounded-lg border relative" style="height: 700px">
    <div class="px-6 py-8">
      <h1 class="text-2xl font-semibold"><slot name="title"></slot></h1>
    </div>

    <div class="px-6 window-no-drag">
      <slot name="content"></slot>
    </div>

    <div
      class="flex justify-between px-6 pb-6 window-no-drag absolute w-600"
      style="top: 100%; transform: translateY(-100%)"
    >
      <Button class="text-sm text-grey-900 w-28" @click="$emit('secondary-clicked')">
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
