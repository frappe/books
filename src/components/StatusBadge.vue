<template>
  <Badge class="text-xs flex-center px-3 ml-2" :color="color" v-if="status">{{
    status
  }}</Badge>
</template>
<script>
import { statusColor } from '../colors';
import Badge from '@/components/Badge';

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
