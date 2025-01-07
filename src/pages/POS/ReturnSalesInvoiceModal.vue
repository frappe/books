<template>
  <Modal class="h-96 w-96" :set-close-listener="false">
    <p class="text-center py-4 font-semibold">{{ t`Return Sales Invoice` }}</p>
    <hr class="dark:border-gray-800 mx-10" />
    <div class="p-10">
      <div v-if="sinvDoc.fieldMap" class="flex justify-cente pb-14">
        <div class="w-80">
          <Link
            v-if="sinvDoc.fieldMap"
            class="flex-shrink-0"
            :show-label="true"
            :border="true"
            :value="salesInvoiceName"
            :df="sinvDoc.fieldMap.returnAgainst"
            @change="updateCouponCode"
          />
        </div>
      </div>

      <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto mb-2">
        <div class="col-span-2">
          <Button
            class="w-full bg-green-500 dark:bg-green-700"
            style="padding: 1.35rem"
            :disabled="!salesInvoiceName"
            @click="selectReturnInvoice"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Saved` }}
              </p>
            </slot>
          </Button>
        </div>
      </div>

      <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto">
        <div class="col-span-2">
          <Button
            class="w-full bg-red-500 dark:bg-red-700"
            style="padding: 1.35rem"
            @click="$emit('toggleModal', 'ReturnSalesInvoice')"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Cancel` }}
              </p>
            </slot>
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { defineComponent, inject } from 'vue';
import Link from 'src/components/Controls/Link.vue';
export default defineComponent({
  name: 'ReturnSalesInvoice',
  components: {
    Modal,
    Button,
    Link,
  },
  emits: ['toggleModal', 'selectedReturnInvoice'],
  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
    };
  },
  data() {
    return {
      salesInvoiceName: '',
    };
  },
  methods: {
    updateCouponCode(invoiceName: string) {
      this.salesInvoiceName = invoiceName;
    },
    selectReturnInvoice() {
      console.log('selectReturnInvoiceselectReturnInvo');

      this.$emit('selectedReturnInvoice', this.salesInvoiceName);
      this.$emit('toggleModal', 'ReturnSalesInvoice');

      this.salesInvoiceName = '';
    },
  },
});
</script>
