<template>
  <Modal class="h-auto w-96" :set-close-listener="false">
    <p class="text-center font-semibold py-3">{{ t`Item Enquiry` }}</p>
    <div class="px-10">
      <hr class="dark:border-gray-800" />
      <div class="flex flex-col gap-5 pt-8">
        <Link
          :df="{
            fieldname: 'itemName',
            fieldtype: 'Link',
            target: 'Item',
            label: t`Item Name`,
            required: true,
          }"
          :value="form.itemName"
          :border="true"
          :show-label="true"
          @change="(value: string) => {
            form.itemName = value;
          }"
        />

        <Link
          :df="{
            fieldname: 'customerName',
            fieldtype: 'Link',
            target: 'Party',
            label: t`Customer Name`,
            filter: { role: ['in', ['Customer', 'Both']] },
          }"
          :value="form.customerName"
          :border="true"
          :show-label="true"
          @change="(value: string) => {
            form.customerName = value;
            updateCustomerContact(value);
          }"
        />

        <div>
          <label class="block text-sm text-gray-700 dark:text-white mb-1">
            {{ t`Contact` }}
          </label>
          <input
            v-model="form.contact"
            type="text"
            class="
              w-full
              border
              dark:border-gray-700
              rounded
              px-3
              py-2
              mt-1
              dark:bg-gray-800 dark:text-white
              focus:outline-none focus:ring-0
            "
          />
        </div>

        <div>
          <label class="block text-sm text-gray-700 dark:text-white mb-1">
            {{ t`Description` }}
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            class="
              w-full
              border
              dark:border-gray-700
              rounded
              px-3
              py-2
              mt-1
              dark:bg-gray-800 dark:text-white
              focus:outline-none focus:ring-0
            "
          />
        </div>

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

export default defineComponent({
  name: 'ItemEnquiryModal',
  components: {
    Modal,
    Button,
    Link,
  },
  emits: ['toggleModal'],
  data() {
    return {
      form: {
        itemName: '',
        customerName: '',
        contact: '',
        description: '',
        similarProduct: '',
      },
    };
  },
  methods: {
    async updateCustomerContact(customerName: string) {
      if (!customerName) {
        this.form.contact = '';
        return;
      }

      try {
        const party = await this.fyo.db.get('Party', customerName);
        this.form.contact = party?.phone?.toString?.() || '';
      } catch (error) {
        this.form.contact = '';
      }
    },

    clearFormValues() {
      this.form = {
        itemName: '',
        customerName: '',
        contact: '',
        description: '',
        similarProduct: '',
      };
    },

    async submitForm() {
      if (!this.form.itemName.trim()) {
        showToast({
          type: 'error',
          message: t`Item Name is required`,
        });
        return;
      }

      try {
        const doc = this.fyo.doc.getNewDoc('ItemEnquiry');
        doc.itemName = this.form.itemName;
        doc.customerName = this.form.customerName;
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
