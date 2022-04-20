<template>
  <div
    class="flex-1 py-10 bg-white h-screen"
    :class="{
      'window-drag': platform !== 'Windows',
    }"
  >
    <div class="px-12">
      <h1 class="text-2xl font-semibold"><slot name="title"></slot></h1>
    </div>

    <div class="px-8 mt-5 window-no-drag">
      <slot name="content"></slot>
    </div>
    <div
      class="flex justify-between px-8 mt-5 window-no-drag absolute w-full"
      style="top: 100%; transform: translateY(-260%)"
    >
      <Button class="text-sm text-grey-900" @click="$emit('secondary-clicked')">
        <slot name="secondaryButton"></slot>
      </Button>
      <Button
        @click="$emit('primary-clicked')"
        type="primary"
        class="text-sm text-white"
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
