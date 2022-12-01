<template>
  <Badge
    class="flex-center"
    :color="color"
    v-if="status"
    :class="defaultSize ? 'text-sm px-3' : ''"
    >{{ statusLabel }}</Badge
  >
</template>
<script>
import { getStatusText, statusColor } from 'models/helpers';
import Badge from './Badge.vue';

export default {
  name: 'StatusBadge',
  props: { status: String, defaultSize: { type: Boolean, default: true } },
  computed: {
    color() {
      return statusColor[this.status];
    },
    statusLabel() {
      return getStatusText(this.status) || this.status;
    },
  },
  components: { Badge },
};
</script>
