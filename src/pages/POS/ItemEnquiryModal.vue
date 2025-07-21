<template>
  <Modal class="h-auto w-96" :set-close-listener="false">
    <p class="text-center font-semibold py-3">{{ t`Item Enquiry` }}</p>
    <div class="px-10">
      <hr class="dark:border-gray-800" />
      <div class="flex flex-col gap-5 pt-8">
        <div class="relative">
          <label class="text-sm font-medium">{{ t`Item Name` }} *</label>
          <input
            v-model="form.itemName"
            type="text"
            required
            class="
              w-full
              border
              dark:border-gray-700
              rounded
              px-3
              py-2
              mt-1
              dark:bg-gray-800 dark:text-white
              focus:outline-none
            "
            autocomplete="off"
            @input="suggestSimilarProduct"
            @focus="dropdownOpen = true"
            @blur="dropdownOpen = false"
          />
          <ul
            v-if="dropdownOpen"
            class="
              absolute
              z-50
              bg-white
              dark:bg-gray-800
              shadow-md
              border border-gray-300
              dark:border-gray-700
              w-40
              max-h-40
              overflow-y-auto
              rounded
              mt-1
            "
          >
            <li
              v-for="item in itemOptions"
              :key="item.name"
              class="
                px-3
                py-1
                text-sm text-gray-800
                dark:text-white
                cursor-pointer
                hover:bg-gray-100
                dark:hover:bg-gray-700
              "
              @mousedown.prevent="
                form.itemName = item.name;
                form.description = item.description || '';
                dropdownOpen = false;
                suggestSimilarProduct();
              "
            >
              {{ item.name }}
            </li>
          </ul>
        </div>

        <div class="relative">
          <label class="text-sm font-medium">{{ t`Customer Name` }}</label>
          <input
            v-model="form.customerName"
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
              focus:outline-none
            "
            autocomplete="off"
            @focus="partyDropdownOpen = true"
          />
          <ul
            v-if="partyDropdownOpen"
            class="
              absolute
              z-50
              bg-white
              dark:bg-gray-800
              shadow-md
              border border-gray-300
              dark:border-gray-700
              w-full
              max-h-40
              overflow-y-auto
              rounded
              mt-1
            "
          >
            <li
              v-for="party in parties"
              :key="party.name"
              class="
                px-3
                py-1
                text-sm text-gray-800
                dark:text-white
                cursor-pointer
                hover:bg-gray-100
                dark:hover:bg-gray-700
              "
              @mousedown.prevent="
                form.customerName = party.name;
                form.contact = party.phone;
                partyDropdownOpen = false;
              "
            >
              {{ party.name }}
            </li>
          </ul>
        </div>

        <div>
          <label class="text-sm font-medium">{{ t`Contact` }}</label>
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
          <label class="text-sm font-medium">{{ t`Description` }}</label>
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

        <div>
          <label class="text-sm font-medium">{{ t`Similar Product` }}</label>
          <input
            v-model="form.similarProduct"
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
            readonly
          />
        </div>
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

      <!-- Cancel Button -->
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

export default defineComponent({
  name: 'ItemEnquiryModal',
  components: {
    Modal,
    Button,
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
      itemOptions: [] as { name: string; description?: string }[],
      dropdownOpen: false,

      parties: [] as { name: string; phone: string }[],
      partyDropdownOpen: false,
    };
  },
  async mounted() {
    await this.fetchItems();
    await this.fetchParties();
  },
  methods: {
    async fetchItems() {
      try {
        const items = await this.fyo.db.getAll('Item', {
          filters: {},
          fields: ['name', 'description'],
        });

        this.itemOptions = (items as Record<string, string>[])
          .filter((item) => item.name)
          .map((item) => ({
            name: item.name,
            description: item.description,
          }));
      } catch (error) {
        showToast({ type: 'error', message: t`Failed to load items.` });
      }
    },

    async fetchParties() {
      try {
        const partyData = await this.fyo.db.getAll('Party', {
          filters: { role: ['in', ['Customer', 'Both']] },
          fields: ['name', 'phone'],
        });

        this.parties = (partyData as Record<string, string>[])
          .filter((p) => p.name && p.phone)
          .map((p) => ({
            name: p.name,
            phone: p.phone,
          }));
      } catch (error) {
        showToast({ type: 'error', message: t`Failed to load customers.` });
      }
    },

    suggestSimilarProduct() {
      const input = this.form.itemName.toLowerCase().trim();
      if (!input) {
        this.form.similarProduct = '';
        return;
      }

      const match = this.itemOptions.find(
        (item) =>
          input.includes(item.name.toLowerCase()) &&
          item.name.toLowerCase() !== input
      );

      this.form.similarProduct = match ? match.name : '';
    },

    clearFormValues() {
      this.form = {
        itemName: '',
        customerName: '',
        contact: '',
        description: '',
        similarProduct: '',
      };
      this.dropdownOpen = false;
      this.partyDropdownOpen = false;
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
