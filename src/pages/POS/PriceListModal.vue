<template>
  <Modal class="h-auto w-96" :set-close-listener="false">
    <p class="text-center font-semibold py-3">Apply Price List</p>
    <div class="px-10">
      <hr class="dark:border-gray-800" />
      <div class="flex justify-center pt-10">
        <div class="w-80 mb-20">
          <Link
            v-if="sinvDoc.fieldMap"
            class="flex-shrink-0"
            :border="true"
            :value="priceList"
            :df="sinvDoc.fieldMap.priceList"
            @change="(value) => (priceList = value)"
          />
        </div>
      </div>

      <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto mb-2">
        <div class="col-span-2">
          <Button
            class="w-full bg-green-500 dark:bg-green-700"
            style="padding: 1.35rem"
            @click="setPriceList()"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Save` }}
              </p>
            </slot>
          </Button>
        </div>
      </div>

      <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto mb-8">
        <div class="col-span-2">
          <Button
            class="w-full bg-red-500 dark:bg-red-700"
            style="padding: 1.35rem"
            @click="$emit('toggleModal', 'PriceList')"
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
import { t } from 'fyo';
import Modal from 'src/components/Modal.vue';
import { defineComponent, inject } from 'vue';
import Button from 'src/components/Button.vue';
import { showToast } from 'src/utils/interactive';
import Link from 'src/components/Controls/Link.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';

export default defineComponent({
  name: 'PriceListModal',
  components: {
    Link,
    Modal,
    Button,
  },
  emits: ['toggleModal'],
  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
    };
  },
  data() {
    return {
      priceList: '',
    };
  },
  methods: {
    async setPriceList() {
      try {
        await this.sinvDoc.set('priceList', this.priceList);

        this.$emit('toggleModal', 'PriceList');
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
  },
});
</script>
