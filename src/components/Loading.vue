<template>
  <div
    v-if="open && !close"
    class="absolute bottom-0 flex justify-end pb-6 pe-6"
    :style="{ width: fullWidth ? '100%' : 'calc(100% - 12rem)' }"
  >
    <!-- Loading Continer -->
    <div
      class="
        border
        dark:border-gray-800
        text-gray-900
        dark:text-gray-100
        shadow-lg
        px-3
        py-3
        items-center
        w-96
        z-10
        bg-white
        dark:bg-gray-900
        rounded-lg
      "
    >
      <!-- Message -->
      <p
        v-if="message?.length"
        class="text-base text-gray-600 dark:text-gray-400 pb-2"
      >
        {{ message }}
      </p>

      <!-- Loading Bar Container -->
      <div class="w-full flex flex-row items-center">
        <!-- Loading Bar BG -->
        <div
          class="w-full h-3 me-2 rounded"
          :class="
            percent >= 0
              ? 'bg-gray-200 dark:bg-gray-800'
              : 'bg-gray-300 dark:bg-gray-700'
          "
        >
          <!-- Loading Bar -->
          <div
            v-if="percent >= 0"
            class="h-3 rounded bg-gray-800 dark:bg-gray-200"
            :style="{ width: `${percent * 100}%` }"
          ></div>
        </div>

        <!-- Close Icon -->
        <feather-icon
          v-if="showX"
          name="x"
          class="
            w-4
            h-4
            ms-auto
            text-gray-600
            dark:text-gray-400
            cursor-pointer
            hover:text-gray-800
            dark:hover:text-gray-200
          "
          @click="closeToast"
        />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    open: { type: Boolean, default: false },
    percent: { type: Number, default: 0.5 },
    message: { type: String, default: '' },
    fullWidth: { type: Boolean, default: false },
    showX: { type: Boolean, default: true },
  },
  data() {
    return {
      close: false,
    };
  },
  mounted() {
    window.l = this;
  },
  methods: {
    closeToast() {
      this.close = true;
    },
  },
};
</script>
