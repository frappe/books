<template>
  <Badge class="text-xs flex-center px-3 ml-2" :color="color" v-if="status">{{
    statusLabel
  }}</Badge>
</template>
<script>
import { t } from 'fyo';
import { statusColor } from 'src/utils/colors';
import Badge from './Badge.vue';

export default {
  name: 'StatusBadge',
  props: ['status'],
  computed: {
    color() {
      return statusColor[this.status];
    },
    statusLabel() {
      return (
        {
          Draft: t`Draft`,
          Unpaid: t`Unpaid`,
          Paid: t`Paid`,
          Cancelled: t`Cancelled`,
        }[this.status] ?? this.status
      );
    },
  },
  components: { Badge },
};
</script>
