<template>
  <button
    @click="openHelpLink"
    class="
      text-gray-900
      shadow-md
      px-3
      py-2
      flex
      items-center
      mb-3
      z-10
      bg-white
      rounded-lg
      text-base
    "
  >
    <FeatherIcon class="h-6 w-6 mr-3 text-blue-400" name="help-circle" />
    <p class="mr-1"><slot></slot></p>
  </button>
</template>
<script>
import { IPC_MESSAGES } from '@/messages';
import { ipcRenderer } from 'electron';
import FeatherIcon from './FeatherIcon.vue';

export default {
  props: {
    link: String,
  },
  methods: {
    openHelpLink() {
      ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, this.link);
    },
  },
  components: { FeatherIcon },
};
</script>
