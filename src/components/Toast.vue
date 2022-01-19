<template>
  <div
    class="
      text-gray-900
      shadow-md
      px-3
      py-2
      rounded
      flex
      items-center
      mb-3
      w-80
    "
    :class="bgColor + (action ? ' cursor-pointer' : '')"
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
        @click="action"
        class="text-sm text-gray-700 hover:text-gray-800"
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>
<script>
import { getBgColorClass, getTextColorClass } from '../colors';

export default {
  data() {
    return { opacity: 0, show: true };
  },
  props: {
    message: String,
    action: Function,
    actionText: String,
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
    bgColor() {
      return getBgColorClass(this.color);
    },
    iconColor() {
      return getTextColorClass(this.color);
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
