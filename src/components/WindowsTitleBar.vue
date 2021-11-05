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
import { ipcRenderer } from 'electron';
import { runWindowAction } from '@/utils';
import { IPC_MESSAGES } from '@/messages';

export default {
  name: 'WindowsTitleBar',
  methods: {
    async action(name) {
      const actionRan = await runWindowAction(name);
      this.$emit(actionRan);
    },
    openMenu() {
      ipcRenderer.send(IPC_MESSAGES.OPEN_MENU);
    },
  },
};
</script>
