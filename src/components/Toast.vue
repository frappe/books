<template>
  <div
    class="
      text-gray-900
      shadow-lg
      px-3
      py-2
      rounded
      flex
      items-center
      mb-3
      w-96
      z-10
      bg-white
      border-l-4
    "
    :class="colorClass + (actionText ? ' cursor-pointer' : '')"
    style="transition: opacity 150ms ease-in"
    :style="{ opacity }"
    @click="action"
    v-if="show"
  >
    <feather-icon :name="iconName" class="w-6 h-6 mr-3" :class="iconColor" />
    <div>
      <p class="text-base">{{ message }}</p>
      <button
        v-if="actionText"
        class="text-sm text-gray-700 hover:text-gray-800"
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>
<script>
import { getColorClass } from '../colors';

export default {
  data() {
    return { opacity: 0, show: true };
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
    colorClass() {
      return getColorClass(this.color, 'border', 300);
    },
    iconColor() {
      return getColorClass(this.color, 'text', 400);
    },
  },
  mounted() {
    const mountTarget = document.createElement('div');
    mountTarget.id = 'toast-target';
    this.$el.parentElement.append(mountTarget);

    setTimeout(() => {
      this.opacity = 1;
    }, 50);

    setTimeout(() => {
      this.opacity = 0;
    }, this.duration);

    setTimeout(() => {
      this.show = false;
      this.cleanup();
    }, this.duration + 300);
  },
  methods: {
    cleanup() {
      Array.from(this.$el.parentElement.children)
        .filter((el) => !el.innerHTML)
        .splice(1)
        .forEach((el) => el.remove());
    },
  },
};
</script>
