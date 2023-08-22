<template>
  <div class="">
    <PageHeader :title="t`NeuPOS`">
      <slot>
        <div class="flex justify-end">
          <Button class="bg-red-500" @click="toggleModal('ShiftClose')">
            <span class="text-white font-medium">{{
              t`Close POS Shift `
            }}</span>
          </Button>
        </div>
      </slot>
    </PageHeader>

    <OpenPOSShiftModal
      :open-modal="!isPosShiftOpen"
      @toggle-modal="toggleModal"
    />

    <ClosePOSShiftModal
      :open-modal="openShiftCloseModal"
      @toggle-modal="toggleModal"
    />

    <PaymentModal />
  </div>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import PaymentModal from './PaymentModal.vue';

export default defineComponent({
  name: 'NeuPOS',
  components: {
    Button,
    ClosePOSShiftModal,
    OpenPOSShiftModal,
    PageHeader,
    PaymentModal,
  },
  data() {
    return {
      openShiftOpenModal: false,
      openShiftCloseModal: false,
    };
  },
  computed: {
    isPosShiftOpen: () => !!fyo.singles.POSShift?.isShiftOpen,
  },
  methods: {
    toggleModal(modal: 'ShiftOpen' | 'ShiftClose', value?: boolean) {
      if (value) {
        return (this[`open${modal}Modal`] = value);
      }
      return (this[`open${modal}Modal`] = !this[`open${modal}Modal`]);
    },
  },
});
</script>
