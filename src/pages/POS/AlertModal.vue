<template>
  <Modal class="h-auto px-6 select-none" :set-close-listener="false">
    <p class="text-center font-semibold py-3">{{ t`Alert` }}</p>
    <hr class="dark:border-gray-800" />
    <p class="py-6">
      {{ t`Clicking continue will remove all the selected items.` }}
    </p>

    <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto pb-6">
      <div class="flex col-span-2 gap-5">
        <Button
          class="py-5 w-full bg-red-500 dark:bg-red-700"
          @click="$emit('toggleModal', 'RouteToInvoiceList')"
        >
          <slot>
            <p class="uppercase text-lg text-white font-semibold">
              {{ t`Cancel` }}
            </p>
          </slot>
        </Button>

        <Button
          class="w-full py-5 bg-green-500 dark:bg-green-700"
          @click="
            routeTo('/list/SalesInvoice');
            $emit('toggleModal', 'RouteToInvoiceList');
          "
        >
          <slot>
            <p class="uppercase text-lg text-white font-semibold">
              {{ t`Continue` }}
            </p>
          </slot>
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import { defineComponent } from 'vue';
import { routeTo } from 'src/utils/ui';

export default defineComponent({
  name: 'AlertModal',
  components: {
    Modal,
    Button,
  },
  emits: ['toggleModal', 'selectedInvoiceName'],
  methods: {
    routeTo,
  },
});
</script>
