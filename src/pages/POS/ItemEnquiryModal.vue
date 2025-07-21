<template>
  <Modal class="h-auto w-96" :set-close-listener="false">
    <p class="text-center font-semibold py-3">{{ t`Item Enquiry` }}</p>
    <div class="px-10">
      <hr class="dark:border-gray-800" />
      <div class="flex flex-col gap-5 pt-8">
        <Link
          :df="{
            fieldname: 'item',
            fieldtype: 'Link',
            target: 'Item',
            label: t`Item`,
            required: true,
          }"
          :value="form.item"
          :border="true"
          :show-label="true"
          @change="(value: string) => {
      form.item = value;
    }"
        />

        <Text
          :df="{
            fieldname: 'description',
            fieldtype: 'Text',
            label: t`Description`,
          }"
          :value="form.description"
          :border="true"
          :show-label="true"
          @change="(value: string) => form.description = value"
        />

        <Link
          :df="{
            fieldname: 'customer',
            fieldtype: 'Link',
            target: 'Party',
            label: t`Customer`,
          }"
          :value="form.customer"
          :border="true"
          :show-label="true"
          @change="(value: string) => {
      form.customer = value;
      updateCustomerContact(value);
    }"
        />

        <Data
          :df="{
            fieldname: 'contact',
            fieldtype: 'Data',
            label: t`Contact`,
          }"
          :value="form.contact"
          :border="true"
          :show-label="true"
          @change="(value: string) => form.contact = value"
        />

        <Link
          :df="{
            fieldname: 'similarProduct',
            fieldtype: 'Link',
            target: 'Item',
            label: t`Similar Product`,
          }"
          :value="form.similarProduct"
          :border="true"
          :show-label="true"
          @change="(value: string) => form.similarProduct = value"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 mt-10 mb-4">
        <div class="col-span-2">
          <Button
            class="w-full bg-green-500 dark:bg-green-700"
            style="padding: 1.35rem"
            @click="submitForm"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Submit` }}
              </p>
            </slot>
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="col-span-2">
          <Button
            class="w-full bg-red-500 dark:bg-red-700"
            style="padding: 1.35rem"
            @click="closeModal"
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
import { defineComponent } from 'vue';
import { t } from 'fyo';
import { showToast } from 'src/utils/interactive';
import Modal from 'src/components/Modal.vue';
import Button from 'src/components/Button.vue';
import Link from 'src/components/Controls/Link.vue';
import Text from 'src/components/Controls/Text.vue';
import Data from 'src/components/Controls/Data.vue';

export default defineComponent({
  name: 'ItemEnquiryModal',
  components: {
    Modal,
    Button,
    Link,
    Text,
    Data,
  },
  emits: ['toggleModal'],
  data() {
    return {
      form: {
        item: '',
        customer: '',
        contact: '',
        description: '',
        similarProduct: '',
      },
    };
  },
  methods: {
    async updateCustomerContact(customer: string) {
      if (!customer) {
        this.form.contact = '';
        return;
      }

      try {
        const party = await this.fyo.db.get('Party', customer);
        this.form.contact = party?.phone?.toString?.() || '';
      } catch (error) {
        this.form.contact = '';
      }
    },

    clearFormValues() {
      this.form = {
        item: '',
        customer: '',
        contact: '',
        description: '',
        similarProduct: '',
      };
    },

    async submitForm() {
      if (!this.form.item.trim()) {
        showToast({
          type: 'error',
          message: t`Item Name is required`,
        });
        return;
      }

      try {
        const doc = this.fyo.doc.getNewDoc('ItemEnquiry');
        doc.item = this.form.item;
        doc.customer = this.form.customer;
        doc.contact = this.form.contact;
        doc.description = this.form.description;
        doc.similarProduct = this.form.similarProduct;

        await doc.sync();

        showToast({
          type: 'success',
          message: t`Item enquiry submitted`,
        });

        this.clearFormValues();
        this.$emit('toggleModal', 'ItemEnquiry');
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },

    closeModal() {
      this.clearFormValues();
      this.$emit('toggleModal', 'ItemEnquiry');
    },
  },
});
</script>
