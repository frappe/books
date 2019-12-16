<template>
  <div class="bg-white text-base flex justify-between window-drag border-b">
    <div
      class="py-1 px-2 window-no-drag hover:bg-gray-100 cursor-pointer"
      @click="openMenu"
    >
      <feather-icon name="menu" class="w-4 h-4" />
    </div>
    <div class="flex window-no-drag">
      <div
        class="py-1 px-2 hover:bg-gray-100 cursor-pointer"
        @click="action('minimize')"
      >
        <feather-icon name="minus" class="w-4 h-4" />
      </div>
      <div
        class="flex-center py-1 px-2 hover:bg-gray-100 cursor-pointer"
        @click="action('maximize')"
      >
        <feather-icon name="square" class="w-3 h-3" />
      </div>
      <div
        class="py-1 px-2 hover:bg-red-500 hover:text-white cursor-pointer"
        @click="action('close')"
      >
        <feather-icon name="x" class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { openMenu } from '@/menu';

export default {
  name: 'WindowsTitleBar',
  methods: {
    action(name) {
      let window = electron.remote.getCurrentWindow();
      if (name === 'maximize' && window.isMaximized()) {
        name = 'unmaximize';
      }
      this.$emit(name);
      window[name]();
    },
    openMenu() {
      openMenu();
    }
  }
};
</script>
