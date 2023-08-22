<template>
  <div class="">
    <PageHeader :title="t`NeuPOS`">
      <slot>
        <div class="flex justify-end">
          <Button class="bg-red-500">
            <span class="text-white font-medium">{{
              t`Close POS Shift `
            }}</span>
          </Button>
        </div>
      </slot>
    </PageHeader>

    <OpenPOSShift
      :open-modal="!isPosShiftOpen"
      @toggle-shift-open-modal="toggleShiftOpenModal"
    />
  </div>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import OpenPOSShift from './OpenPOSShift.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { defineComponent } from 'vue';
import { fyo } from 'src/initFyo';

export default defineComponent({
  name: 'NeuPOS',
  components: { Button, OpenPOSShift, PageHeader },
  data() {
    return {
      openShiftOpenModal: false,
    };
  },
  computed: {
    isPosShiftOpen: () => !!fyo.singles.POSShift?.isShiftOpen,
  },
  methods: {
    toggleShiftOpenModal(value?: boolean): boolean {
      if (value) {
        return (this.openShiftOpenModal = value);
      }
      return (this.openShiftOpenModal = !this.openShiftOpenModal);
    },
  },
});
</script>
