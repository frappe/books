<template>
  <Badge class="text-xs flex-center px-3 ml-2" :color="color" v-if="status">{{
    status
  }}</Badge>
</template>
<script>
import Badge from 'src/components/Badge';
import { statusColor } from '../colors';

export default {
  name: 'StatusBadge',
  props: ['status'],
  components: {
    Badge,
  },
  computed: {
    color() {
      return statusColor[this.status];
    },
  },
};
</script>
