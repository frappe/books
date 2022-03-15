<template>
  <div
    class="absolute w-screen h-screen z-20 flex justify-center items-center"
    style="background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(6px)"
    v-if="openModal"
  >
    <div
      class="bg-white rounded-lg shadow-2xl"
      v-bind="$attrs"
      style="width: 600px"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    openModal: {
      default: false,
      type: Boolean,
    },
  },
};
</script>
