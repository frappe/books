<template>
  <Modal class="h-auto" :set-close-listener="false">
    <div class="px-5" style="width: 30vw">
      <p class="text-center dark:text-gray-400 font-semibold py-3">Keyboard</p>
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
          class="
            text-4xl
            grid grid-cols-4
            gap-3
            rounded
            font-bold
            py-4
            dark:text-gray-400
          "
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
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { ValidationError } from 'fyo/utils/errors';
import { showToast } from 'src/utils/interactive';
import { validateQty } from 'models/helpers';
import { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';

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
  emits: ['toggleModal', 'applyPricingRule'],
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
      try {
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
            if (this.sinvDoc.grandTotal?.lte(this.selectedValue)) {
              this.selectedItemRow.itemDiscountAmount = this.fyo.pesa(
                Number(0)
              );

              throw new ValidationError(
                this.fyo.t`Discount Amount (${this.fyo.format(
                  this.selectedValue,
                  'Currency'
                )}) cannot be greated than Amount (${this.fyo.format(
                  this.sinvDoc.grandTotal,
                  'Currency'
                )}).`
              );
            }

            await this.selectedItemRow.set('setItemDiscountAmount', true);
            await this.selectedItemRow.set(
              'itemDiscountAmount',
              this.fyo.pesa(Number(this.selectedValue))
            );
          }
        } else {
          this.selectedItemRow![this.selectedItemField] = Number(
            this.selectedValue
          );

          if (this.selectedItemField === 'itemDiscountPercent') {
            if (Number(this.selectedValue) > 100) {
              await this.selectedItemRow?.set('itemDiscountPercent', 0);

              throw new ValidationError(
                this.fyo
                  .t`Discount Percent (${this.selectedValue}) cannot be greater than 100.`
              );
            }

            await this.selectedItemRow?.set('setItemDiscountAmount', false);
            await this.selectedItemRow?.set(
              'itemDiscountPercent',
              this.selectedValue
            );
          }

          if (this.selectedItemField === 'quantity') {
            const existingItems =
              this.sinvDoc.items?.filter(
                (invoiceItem: InvoiceItem) =>
                  invoiceItem.item === this.selectedItemRow?.item &&
                  !invoiceItem.isFreeItem
              ) ?? [];

            await validateQty(
              this.sinvDoc,
              this.selectedItemRow,
              existingItems
            );

            this.$emit('applyPricingRule');
          }
        }

        await this.sinvDoc.runFormulas();
        this.$emit('toggleModal', 'Keyboard');
      } catch (error) {
        showToast({
          type: 'error',
          message: this.t`${error as string}`,
        });

        if (this.selectedItemField === 'quantity') {
          this.$emit('applyPricingRule');
        }
      }
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
