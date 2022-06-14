<template>
  <Badge class="text-sm flex-center px-3 ml-2" :color="color" v-if="status">{{
    statusLabel
  }}</Badge>
</template>
<script>
import { getStatusMap, statusColor } from 'models/helpers';
import Badge from './Badge.vue';

export default {
  name: 'StatusBadge',
  props: ['status'],
  computed: {
    color() {
      return statusColor[this.status];
    },
    statusLabel() {
      const statusMap = getStatusMap();
      return statusMap[this.status] ?? this.status;
    },
  },
  components: { Badge },
};
</script>
