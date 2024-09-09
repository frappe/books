<template>
  <div
    class="
      w-quick-edit
      bg-white
      dark:bg-gray-850
      border-l
      dark:border-gray-800
      overflow-y-auto
      custom-scroll custom-scroll-thumb2
    "
  >
    <!-- Page Header -->
    <div
      class="
        flex
        items-center
        justify-between
        px-4
        h-row-largest
        sticky
        top-0
        bg-white
        dark:bg-gray-850
      "
      style="z-index: 1"
    >
      <div class="flex items-center justify-between w-full">
        <Button :icon="true" @click="$emit('close')">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
        <p class="text-xl font-semibold text-gray-600 dark:text-gray-400">
          {{ t`Linked Entries` }}
        </p>
      </div>
    </div>

    <!-- Linked Entry List -->
    <div
      v-if="sequence.length"
      class="
        w-full
        overflow-y-auto
        custom-scroll custom-scroll-thumb2
        border-t
        dark:border-gray-800
      "
    >
      <div
        v-for="sn of sequence"
        :key="sn"
        class="border-b dark:border-gray-800 p-4 overflow-auto"
      >
        <!-- Header with count and schema label -->
        <div
          class="flex justify-between cursor-pointer"
          :class="entries[sn].collapsed ? '' : 'pb-4'"
          @click="entries[sn].collapsed = !entries[sn].collapsed"
        >
          <h2
            class="
              text-base text-gray-600
              dark:text-gray-400
              font-semibold
              select-none
            "
          >
            {{ fyo.schemaMap[sn]?.label ?? sn
            }}<span class="font-normal">{{
              ` – ${entries[sn].details.length}`
            }}</span>
          </h2>
          <feather-icon
            :name="entries[sn].collapsed ? 'chevron-up' : 'chevron-down'"
            class="w-4 h-4 text-gray-600 dark:text-gray-400"
          />
        </div>

        <!-- Entry list -->
        <div
          v-show="!entries[sn].collapsed"
          class="
            entry-container
            rounded-md
            border
            dark:border-gray-800
            overflow-hidden
          "
        >
          <!-- Entry -->
          <div
            v-for="e of entries[sn].details"
            :key="String(e.name) + sn"
            class="
              p-2
              text-sm
              cursor-pointer
              border-b
              last:border-0
              dark:border-gray-800
              hover:bg-gray-50
              dark:hover:bg-gray-875
            "
            @click="routeTo(sn, String(e.name))"
          >
            <div class="flex justify-between">
              <!-- Name -->
              <p class="font-semibold dark:text-gray-25">
                {{ e.name }}
              </p>

              <!-- Date -->
              <p v-if="e.date" class="text-xs text-gray-600 dark:text-gray-400">
                {{ fyo.format(e.date, 'Date') }}
              </p>
            </div>
            <div class="flex gap-2 mt-1 pill-container flex-wrap">
              <!-- Credit or Debit (GLE) -->
              <p
                v-if="isPesa(e.credit) && e.credit.isPositive()"
                class="pill"
                :class="colorClass('gray')"
              >
                {{ t`Cr. ${fyo.format(e.credit, 'Currency')}` }}
              </p>
              <p
                v-else-if="isPesa(e.debit) && e.debit.isPositive()"
                class="pill"
                :class="colorClass('gray')"
              >
                {{ t`Dr. ${fyo.format(e.debit, 'Currency')}` }}
              </p>

              <!-- Party or EntryType or Account -->
              <p
                v-if="e.party || e.entryType || e.account"
                class="pill"
                :class="colorClass('gray')"
              >
                {{ e.party || e.entryType || e.account }}
              </p>

              <p v-if="e.item" class="pill" :class="colorClass('gray')">
                {{ e.item }}
              </p>
              <p v-if="e.location" class="pill" :class="colorClass('gray')">
                {{ e.location }}
              </p>

              <!-- Amounts -->
              <p
                v-if="
                  isPesa(e.outstandingAmount) &&
                  e.outstandingAmount.isPositive()
                "
                class="pill no-scrollbar"
                :class="colorClass('orange')"
              >
                {{ t`Unpaid ${fyo.format(e.outstandingAmount, 'Currency')}` }}
              </p>
              <p
                v-else-if="isPesa(e.grandTotal) && e.grandTotal.isPositive()"
                class="pill no-scrollbar"
                :class="colorClass('green')"
              >
                {{ fyo.format(e.grandTotal, 'Currency') }}
              </p>
              <p
                v-else-if="isPesa(e.amount) && e.amount.isPositive()"
                class="pill no-scrollbar"
                :class="colorClass('green')"
              >
                {{ fyo.format(e.amount, 'Currency') }}
              </p>

              <!-- Quantities -->
              <p
                v-if="e.stockNotTransferred"
                class="pill no-scrollbar"
                :class="colorClass('orange')"
              >
                {{
                  t`Pending qty. ${fyo.format(e.stockNotTransferred, 'Float')}`
                }}
              </p>
              <p
                v-else-if="typeof e.quantity === 'number' && e.quantity"
                class="pill no-scrollbar"
                :class="colorClass('gray')"
              >
                {{ t`Qty. ${fyo.format(e.quantity, 'Float')}` }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="p-4 text-sm text-gray-600 dark:text-gray-400">
      {{ t`No linked entries found` }}
    </p>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { isPesa } from 'fyo/utils';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import { getBgTextColorClass } from 'src/utils/colors';
import { getLinkedEntries } from 'src/utils/doc';
import { shortcutsKey } from 'src/utils/injectionKeys';
import { getFormRoute, routeTo } from 'src/utils/ui';
import { PropType, defineComponent, inject } from 'vue';

const COMPONENT_NAME = 'LinkedEntries';

export default defineComponent({
  components: { Button },
  props: { doc: { type: Object as PropType<Doc>, required: true } },
  emits: ['close'],
  setup() {
    return { shortcuts: inject(shortcutsKey) };
  },
  data() {
    return { entries: {} } as {
      entries: Record<
        string,
        { collapsed: boolean; details: Record<string, unknown>[] }
      >;
    };
  },
  computed: {
    sequence(): string[] {
      const seq: string[] = linkSequence.filter(
        (s) => !!this.entries[s]?.details?.length
      );

      for (const s in this.entries) {
        if (seq.includes(s)) {
          continue;
        }
        seq.push(s);
      }

      return seq;
    },
  },
  async mounted() {
    await this.setLinkedEntries();
    this.shortcuts?.set(COMPONENT_NAME, ['Escape'], () => this.$emit('close'));
  },
  unmounted() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  methods: {
    isPesa,
    colorClass: getBgTextColorClass,
    async routeTo(schemaName: string, name: string) {
      const route = getFormRoute(schemaName, name);
      await routeTo(route);
    },
    async setLinkedEntries() {
      const linkedEntries = await getLinkedEntries(this.doc);
      for (const key in linkedEntries) {
        const collapsed = false;
        const entryNames = linkedEntries[key];
        if (!entryNames.length) {
          continue;
        }

        const fields = linkEntryDisplayFields[key] ?? ['name'];
        const details = await this.fyo.db.getAll(key, {
          fields,
          filters: { name: ['in', entryNames] },
        });

        this.entries[key] = {
          collapsed,
          details,
        };
      }
    },
  },
});

const linkSequence = [
  // Invoices
  ModelNameEnum.SalesInvoice,
  ModelNameEnum.PurchaseInvoice,
  // Stock Transfers
  ModelNameEnum.Shipment,
  ModelNameEnum.PurchaseReceipt,
  // Other Transactional
  ModelNameEnum.Payment,
  ModelNameEnum.JournalEntry,
  ModelNameEnum.StockMovement,
  // Non Transfers
  ModelNameEnum.Party,
  ModelNameEnum.Item,
  ModelNameEnum.Account,
  ModelNameEnum.Location,
  // Ledgers
  ModelNameEnum.AccountingLedgerEntry,
  ModelNameEnum.StockLedgerEntry,
];

const linkEntryDisplayFields: Record<string, string[]> = {
  // Invoices
  [ModelNameEnum.SalesInvoice]: [
    'name',
    'date',
    'party',
    'grandTotal',
    'outstandingAmount',
    'stockNotTransferred',
  ],
  [ModelNameEnum.PurchaseInvoice]: [
    'name',
    'date',
    'party',
    'grandTotal',
    'outstandingAmount',
    'stockNotTransferred',
  ],
  // Stock Transfers
  [ModelNameEnum.Shipment]: ['name', 'date', 'party', 'grandTotal'],
  [ModelNameEnum.PurchaseReceipt]: ['name', 'date', 'party', 'grandTotal'],
  // Other Transactional
  [ModelNameEnum.Payment]: ['name', 'date', 'party', 'amount'],
  [ModelNameEnum.JournalEntry]: ['name', 'date', 'entryType'],
  [ModelNameEnum.StockMovement]: ['name', 'date', 'amount'],
  // Ledgers
  [ModelNameEnum.AccountingLedgerEntry]: [
    'name',
    'date',
    'account',
    'credit',
    'debit',
  ],
  [ModelNameEnum.StockLedgerEntry]: [
    'name',
    'date',
    'item',
    'location',
    'quantity',
  ],
};
</script>
<style scoped>
.pill-container:empty {
  display: none;
}
</style>
