<template>
  <div
    class="
      text-gray-900
      shadow-lg
      px-3
      py-2
      flex
      items-center
      mb-3
      w-96
      z-30
      bg-white
      rounded-lg
    "
    style="transition: opacity 150ms ease-in"
    :style="{ opacity }"
    v-if="show"
  >
    <feather-icon :name="iconName" class="w-6 h-6 me-3" :class="iconColor" />
    <div @click="actionClicked" :class="actionText ? 'cursor-pointer' : ''">
      <p class="text-base">{{ message }}</p>
      <button
        v-if="actionText"
        class="text-sm text-gray-700 hover:text-gray-800"
      >
        {{ actionText }}
      </button>
    </div>
    <feather-icon
      name="x"
      class="w-4 h-4 ms-auto text-gray-600 cursor-pointer hover:text-gray-800"
      @click="closeToast"
    />
  </div>
</template>
<script>
import { getColorClass } from 'src/utils/colors';
import FeatherIcon from './FeatherIcon.vue';

export default {
  components: {
    FeatherIcon,
  },
  data() {
    return {
      opacity: 0,
      show: true,
      opacityTimeoutId: -1,
      cleanupTimeoutId: -1,
    };
  },
  props: {
    message: { type: String, required: true },
    action: { type: Function, default: () => {} },
    actionText: { type: String, default: '' },
    type: { type: String, default: 'info' },
    duration: { type: Number, default: 5000 },
  },
  computed: {
    iconName() {
      switch (this.type) {
        case 'warning':
          return 'alert-triangle';
        case 'success':
          return 'check-circle';
        default:
          return 'alert-circle';
      }
    },
    color() {
      return {
        info: 'blue',
        warning: 'orange',
        error: 'red',
        success: 'green',
      }[this.type];
    },
    iconColor() {
      return getColorClass(this.color, 'text', 400);
    },
  },
  mounted() {
    setTimeout(() => {
      this.opacity = 1;
    }, 50);

    this.opacityTimeoutId = setTimeout(() => {
      this.opacity = 0;
    }, this.duration);

    this.cleanupTimeoutId = setTimeout(() => {
      this.show = false;
      this.cleanup();
    }, this.duration + 300);
  },
  methods: {
    actionClicked() {
      this.action();
      this.closeToast();
    },
    closeToast() {
      clearTimeout(this.opacityTimeoutId);
      clearTimeout(this.cleanupTimeoutId);

      this.opacity = 0;
      setTimeout(() => {
        this.show = false;
        this.cleanup();
      }, 300);
    },
    cleanup() {
      Array.from(this.$el.parentElement?.children ?? [])
        .filter((el) => !el.innerHTML)
        .splice(1)
        .forEach((el) => el.remove());
    },
  },
};
</script>
