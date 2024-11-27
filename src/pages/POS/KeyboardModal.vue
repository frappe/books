<template>
  <Modal class="h-auto" :set-close-listener="false">
    <div class="px-5" style="width: 30vw">
      <p class="text-center font-semibold py-3">Keyboard</p>
      <hr class="dark:border-gray-800" />
      <div class="mx-6 my-3">
        <component
          :is="selectedItemRow?.fieldMap[selectedItemField!].fieldtype"
          ref="dynamicInput"
          :df="{
            fieldname: selectedItemRow?.fieldMap[selectedItemField!].fieldname as string,
            fieldtype: selectedItemRow?.fieldMap[selectedItemField!].fieldtype,
            label: selectedItemRow?.fieldMap[selectedItemField!].label as string,
          }"
          class="mb-3"
          :border="true"
          :show-label="true"
          :value="selectedValue"
          :focus-input="true"
          @change="(value: number) => handleInput(value.toString())"
        />

        <div
          id="keypad"
          class="text-4xl grid grid-cols-4 gap-3 rounded font-bold py-4"
        >
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('7')"
          >
            7
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('8')"
          >
            8
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('9')"
          >
            9
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="deleteLast()"
          >
            Del
          </button>

          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('4')"
          >
            4
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('5')"
          >
            5
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('6')"
          >
            6
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('-')"
          >
            -
          </button>

          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('1')"
          >
            1
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('2')"
          >
            2
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('3')"
          >
            3
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('+')"
          >
            +
          </button>

          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('.')"
          >
            •
          </button>
          <button
            class="
              py-2.5
              bg-gray-100
              text-2xl
              border-transparent
              rounded-lg
              transition-colors
              duration-200
              hover:bg-gray-200
              dark:bg-gray-875 dark:hover:bg-gray-900
            "
            @click="appendValue('0')"
          >
            0
          </button>
          <div class="grid col-span-2">
            <button
              class="
                py-2.5
                bg-gray-100
                text-2xl
                border-transparent
                rounded-lg
                transition-colors
                duration-200
                hover:bg-gray-200
                dark:bg-gray-875 dark:hover:bg-gray-900
              "
              @click="reset()"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div class="px-5">
        <div class="grid row-start-6 grid-cols-2 gap-4 mt-auto mb-3">
          <div class="col-span-2">
            <Button
              class="w-full bg-green-500 dark:bg-green-700"
              style="padding: 1.35rem"
              @click="saveSelectedItem()"
            >
              <slot>
                <p class="uppercase text-lg text-white font-semibold">
                  {{ t`Save` }}
                </p>
              </slot>
            </Button>
          </div>
        </div>

        <div class="grid row-start-6 grid-cols-2 gap-4 mt-auto mb-8">
          <div class="col-span-2">
            <Button
              class="w-full bg-red-500 dark:bg-red-700"
              style="padding: 1.35rem"
              @click="closeKeyboardModal()"
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
    </div>
  </Modal>
</template>

<script lang="ts">
import Modal from 'src/components/Modal.vue';
import { ModelNameEnum } from 'models/types';
import { defineComponent, inject } from 'vue';
import Button from 'src/components/Button.vue';
import Float from 'src/components/Controls/Float.vue';
import Currency from 'src/components/Controls/Currency.vue';
import { updatePricingRuleItem } from 'models/helpers';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';

export default defineComponent({
  name: 'KeyboardModal',
  components: {
    Modal,
    Float,
    Button,
    Currency,
  },
  props: {
    modalStatus: Boolean,
    selectedItemRow: SalesInvoiceItem,
    selectedItemField: {
      type: String,
      default: '',
    },
  },
  emits: ['toggleModal'],
  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
    };
  },
  data() {
    return {
      selectedValue: '',
    };
  },
  watch: {
    async modalStatus(newVal) {
      if (newVal) {
        await this.$nextTick();
        await this.focusInput();
      }
      this.updateSelectedValue();
    },
  },
  async mounted() {
    this.updateSelectedValue();
    await this.focusInput();
  },
  methods: {
    async appendValue(value: string) {
      if (value === '-') {
        this.selectedValue = this.selectedValue.startsWith('-')
          ? this.selectedValue
          : `-${this.selectedValue}`;
      } else if (value === '+') {
        this.selectedValue = this.selectedValue.startsWith('-')
          ? this.selectedValue.slice(1)
          : this.selectedValue;
      } else {
        this.selectedValue =
          this.selectedValue === '0' ? value : this.selectedValue + value;
      }

      await this.focusInput();
    },
    updateSelectedValue() {
      this.selectedValue = '';

      if (
        this.selectedItemRow?.fieldMap[this.selectedItemField].fieldtype !==
        ModelNameEnum.Currency
      ) {
        this.selectedValue = this.selectedItemRow![
          this.selectedItemField
        ] as string;
      }
    },
    handleInput(value: string) {
      this.selectedValue = value;
    },
    async saveSelectedItem() {
      if (
        this.selectedItemRow?.fieldMap[this.selectedItemField].fieldtype ===
        ModelNameEnum.Currency
      ) {
        this.selectedItemRow[this.selectedItemField] = this.fyo.pesa(
          Number(this.selectedValue)
        );

        if (this.selectedItemField === 'rate') {
          this.selectedItemRow.setRate = this.fyo.pesa(
            Number(this.selectedValue)
          );

          await this.sinvDoc.runFormulas();
          this.$emit('toggleModal', 'Keyboard');

          return;
        }

        if (this.selectedItemField === 'itemDiscountAmount') {
          this.selectedItemRow.setItemDiscountAmount = true;
          this.selectedItemRow.itemDiscountAmount = this.fyo.pesa(
            Number(this.selectedValue)
          );
        }
      } else {
        this.selectedItemRow![this.selectedItemField] = Number(
          this.selectedValue
        );

        if (this.selectedItemField === 'itemDiscountPercent') {
          await this.selectedItemRow?.set('setItemDiscountAmount', false);
          await this.selectedItemRow?.set(
            'itemDiscountPercent',
            this.selectedValue
          );
        }

        if (this.selectedItemField === 'quantity') {
          await updatePricingRuleItem(this.sinvDoc);
        }
      }

      await this.sinvDoc.runFormulas();
      this.$emit('toggleModal', 'Keyboard');
    },
    async deleteLast() {
      this.selectedValue = this.selectedValue?.slice(0, -1);
      await this.focusInput();
    },
    async reset() {
      this.selectedValue = '';
      await this.focusInput();
    },
    async focusInput() {
      await this.$nextTick();
      (this.$refs.dynamicInput as HTMLInputElement)?.focus();
    },
    async closeKeyboardModal() {
      await this.reset();
      this.$emit('toggleModal', 'Keyboard');
    },
  },
});
</script>
