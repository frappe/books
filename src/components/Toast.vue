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
<script lang="ts">
import { getColorClass } from 'src/utils/colors';
import { ToastDuration, ToastType } from 'src/utils/types';
import { toastDurationMap } from 'src/utils/ui';
import { defineComponent, PropType } from 'vue';
import FeatherIcon from './FeatherIcon.vue';

type TimeoutId = ReturnType<typeof setTimeout>;

export default defineComponent({
  components: {
    FeatherIcon,
  },
  data() {
    return {
      opacity: 0,
      show: true,
      opacityTimeoutId: null,
      cleanupTimeoutId: null,
    } as {
      opacity: number;
      show: boolean;
      opacityTimeoutId: null | TimeoutId;
      cleanupTimeoutId: null | TimeoutId;
    };
  },
  props: {
    message: { type: String, required: true },
    action: { type: Function, default: () => {} },
    actionText: { type: String, default: '' },
    type: { type: String as PropType<ToastType>, default: 'info' },
    duration: { type: String as PropType<ToastDuration>, default: 'long' },
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
      return getColorClass(this.color ?? 'gray', 'text', 400);
    },
  },
  mounted() {
    const duration = toastDurationMap[this.duration];
    setTimeout(() => {
      this.opacity = 1;
    }, 50);

    this.opacityTimeoutId = setTimeout(() => {
      this.opacity = 0;
    }, duration);

    this.cleanupTimeoutId = setTimeout(() => {
      this.show = false;
      this.cleanup();
    }, duration + 300);
  },
  methods: {
    actionClicked() {
      this.action();
      this.closeToast();
    },
    closeToast() {
      if (this.opacityTimeoutId != null) {
        clearTimeout(this.opacityTimeoutId);
      }
      if (this.cleanupTimeoutId != null) {
        clearTimeout(this.cleanupTimeoutId);
      }

      this.opacity = 0;
      setTimeout(() => {
        this.show = false;
        this.cleanup();
      }, 300);
    },
    cleanup() {
      const element = this.$el;
      if (!(element instanceof Element)) {
        return;
      }

      Array.from(element.parentElement?.children ?? [])
        .filter((el) => !el.innerHTML)
        .splice(1)
        .forEach((el) => el.remove());
    },
  },
});
</script>
