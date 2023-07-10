<template>
  <button class="flex items-center z-10" @click="openHelpLink">
    <p class="me-1"><slot></slot></p>
    <FeatherIcon
      v-if="icon"
      class="h-5 w-5 ms-3 text-blue-400"
      name="help-circle"
    />
  </button>
</template>
<script>
import FeatherIcon from './FeatherIcon.vue';

export default {
  components: { FeatherIcon },
  props: {
    link: String,
    icon: {
      default: true,
      type: Boolean,
    },
  },
  methods: {
    openHelpLink() {
      ipc.openLink(this.link);
    },
  },
};
</script>
