<template>
  <div
    class="absolute bottom-0 flex justify-end pb-6 pr-6"
    style="width: calc(100% - 12rem)"
    v-if="open && !close"
  >
    <div
      class="
        text-gray-900
        shadow-lg
        px-3
        py-3
        items-center
        w-96
        z-10
        bg-white
        rounded-lg
      "
      v-if="true"
    >
      <p class="text-base text-gray-600 pb-2" v-if="message.length">{{ message }}</p>
      <div class="w-full flex flex-row items-center">
        <div class="w-full bg-gray-200 h-3 mr-2 rounded">
          <div
            class="h-3 rounded bg-blue-400"
            :style="{ width: `${percent * 100}%` }"
          ></div>
        </div>
        <feather-icon
          name="x"
          class="
            w-4
            h-4
            ml-auto
            text-gray-600
            cursor-pointer
            hover:text-gray-800
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
  },
  data() {
    return {
      close: false,
    };
  },
  methods: {
    closeToast() {
      this.close = true;
    },
  },
};
</script>
