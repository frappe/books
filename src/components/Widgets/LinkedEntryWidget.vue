<template>
  <div class="w-quick-edit border-s bg-white flex flex-col">
    <!-- Linked Entry Title -->
    <div class="flex items-center justify-between px-4 h-row-largest border-b">
      <Button :icon="true" @click="$emit('close-widget')">
        <feather-icon name="x" class="w-4 h-4" />
      </Button>
      <p class="font-semibold text-xl text-gray-600">
        {{ linked.title }}
      </p>
    </div>

    <!-- Linked Entry Items -->
    <div
      v-for="entry in linked.entries"
      :key="entry.name"
      class="p-4 border-b flex flex-col hover:bg-gray-50 cursor-pointer"
      @click="openEntry(entry.name)"
    >
      <!-- Name And Status -->
      <div class="mb-2 flex justify-between items-center">
        <p class="font-semibold text-gray-900">
          {{ entry.name }}
        </p>
        <StatusBadge
          :status="getStatus(entry)"
          :default-size="false"
          class="px-0 text-xs"
        />
      </div>

      <!-- Date and Amount -->
      <div class="text-sm flex justify-between items-center">
        <p>
          {{ fyo.format(entry.date as Date, 'Date') }}
        </p>
        <p>{{ fyo.format(entry.amount as Money, 'Currency') }}</p>
      </div>

      <!-- Quantity and Location -->
      <div
        v-if="['Shipment', 'PurchaseReceipt'].includes(linked.schemaName)"
        class="text-sm flex justify-between items-center mt-1"
      >
        <p>
          {{ entry.location }}
        </p>
        <p>
          {{ t`Qty. ${fyo.format(entry.quantity as number, 'Float')}` }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Money } from 'pesa';
import { getFormRoute, routeTo } from 'src/utils/ui';
import { defineComponent, PropType } from 'vue';
import Button from '../Button.vue';
import StatusBadge from '../StatusBadge.vue';

interface Linked {
  schemaName: string;
  title: string;
  entries: {
    name: string;
    cancelled: boolean;
    submitted: boolean;
    [key: string]: unknown;
  }[];
}

export default defineComponent({
  emits: ['close-widget'],
  props: {
    linked: { type: Object as PropType<Linked>, required: true },
  },
  methods: {
    getStatus(entry: { cancelled?: boolean; submitted?: boolean }) {
      if (entry.cancelled) {
        return 'Cancelled';
      }

      if (entry.submitted) {
        return 'Submitted';
      }

      return 'Saved';
    },
    async openEntry(name: string) {
      const route = getFormRoute(this.linked.schemaName, name);
      await routeTo(route);
    },
  },
  components: { Button, StatusBadge },
});
</script>
