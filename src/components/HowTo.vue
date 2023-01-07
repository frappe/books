<template>
  <button @click="openHelpLink" class="flex items-center z-10">
    <p class="me-1"><slot></slot></p>
    <FeatherIcon
      class="h-5 w-5 ms-3 text-blue-400"
      name="help-circle"
      v-if="icon"
    />
  </button>
</template>
<script>
import { openLink } from 'src/utils/ipcCalls';
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
      openLink(this.link);
    },
  },
  components: { FeatherIcon },
};
</script>
