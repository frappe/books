<template>
  <div class="relative" v-on-outside-click="() => toggleDropdown(false)">
    <div class="h-full">
      <slot name="target" :toggleDropdown="toggleDropdown"></slot>
    </div>
    <div
      :class="right ? 'right-0' : 'left-0'"
      class="mt-1 absolute z-10 bg-white rounded-5px border min-w-40 shadow-md"
      v-if="isShown"
    >
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Popover',
  props: ['right'],
  data() {
    return {
      isShown: false
    };
  },
  watch: {
    isShown(newVal, oldVal) {
      if (newVal === false) {
        this.$emit('hide');
      }
      if (newVal === true) {
        this.$emit('show');
      }
    }
  },
  methods: {
    toggleDropdown(flag, from) {
      if (flag == null) {
        flag = !this.isShown;
      }
      this.isShown = Boolean(flag);
    }
  }
};
</script>
