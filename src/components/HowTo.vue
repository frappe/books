<template>
  <button @click="openHelpLink" class="flex items-center z-10">
    <p class="mr-1"><slot></slot></p>
    <FeatherIcon
      class="h-5 w-5 ml-3 text-blue-400"
      name="help-circle"
      v-if="icon"
    />
  </button>
</template>
<script>
import { IPC_MESSAGES } from 'utils/messages';
import { ipcRenderer } from 'electron';
import FeatherIcon from './FeatherIcon.vue';

export default {
  props: {
    link: String,
    icon: {
      default: true,
      type: Boolean,
    },
  },
  methods: {
    openHelpLink() {
      ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, this.link);
    },
  },
  components: { FeatherIcon },
};
</script>
