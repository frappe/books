<template>
  <div
    class="
      text-gray-900
      bg-white
      shadow-md
      px-3
      py-2
      rounded
      flex
      items-center
      mb-3
      w-60
    "
    style="transition: opacity 150ms ease-in"
    :style="{ opacity }"
    v-if="show"
  >
    <feather-icon name="alert-circle" class="w-8 h-8 mr-3 text-gray-800" />
    <div>
      <p class="text-base">{{ message }}</p>
      <button v-if="actionText" @click="action" class="text-sm text-gray-700 hover:text-gray-800">
        {{ actionText }}
      </button>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return { opacity: 0, show: true };
  },
  props: {
    message: String,
    action: Function,
    actionText: String,
    duration: { type: Number, default: 5000 },
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
