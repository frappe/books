<template>
  <div class="h-screen" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`">
      <div class="flex items-center gap-2">
        <!-- Period selector -->
        <div
          class="
            border
            dark:border-gray-900
            rounded
            bg-gray-50
            dark:bg-gray-890
            focus-within:bg-gray-100
            dark:focus-within:bg-gray-900
            flex
            items-center
          "
        >
          <PeriodSelector
            class="px-3"
            :value="period"
            :options="['This Year', 'This Quarter', 'This Month', 'YTD']"
            @change="(value) => (period = value)"
          />
        </div>

        <!-- Customize button -->
        <button
          class="
            p-1.5
            rounded
            hover:bg-gray-100
            dark:hover:bg-gray-800
            text-gray-500
            dark:text-gray-400
          "
          :title="t`Customize Dashboard`"
          @click="showCustomize = true"
        >
          <FeatherIcon name="settings" class="w-4 h-4" />
        </button>
      </div>
    </PageHeader>

    <div
      class="no-scrollbar overflow-auto dark:bg-gray-875"
      style="height: calc(100vh - var(--h-row-largest) - 1px)"
    >
      <!-- Empty state: all widgets hidden -->
      <div
        v-if="visibleRows.length === 0"
        class="
          h-full
          flex flex-col
          items-center
          justify-center
          gap-3
          text-gray-500
          dark:text-gray-400
        "
      >
        <FeatherIcon name="layout" class="w-10 h-10 opacity-30" />
        <p class="text-sm">{{ t`No widgets are visible.` }}</p>
        <button
          class="text-sm text-blue-500 hover:underline"
          @click="showCustomize = true"
        >
          {{ t`Customize Dashboard` }}
        </button>
      </div>

      <!-- Widget canvas -->
      <div v-else style="min-width: var(--w-desk-fixed)">
        <template v-for="(row, idx) in visibleRows" :key="idx">
          <!-- Full-width widget -->
          <div
            v-if="row.type === 'full'"
            :class="WIDGET_META[row.widget.id].wrapClass"
          >
            <component
              :is="widgetComponent(row.widget.id)"
              :common-period="period"
              :dark-mode="darkMode"
              v-bind="widgetExtraProps(row.widget.id)"
              @period-change="handlePeriodChange"
            />
          </div>

          <!-- Side-by-side half pair -->
          <!-- Each column is a strict w-1/2. The border lives on the bare
               layout wrapper so its position never varies with wrapClass.
               A child div carries the per-widget padding (wrapClass). -->
          <div v-else-if="row.type === 'half-pair'" class="flex w-full">
            <div class="w-1/2 border-e dark:border-gray-800">
              <div class="h-full" :class="WIDGET_META[row.left.id].wrapClass">
                <component
                  :is="widgetComponent(row.left.id)"
                  :common-period="period"
                  :dark-mode="darkMode"
                  v-bind="widgetExtraProps(row.left.id)"
                  @period-change="handlePeriodChange"
                />
              </div>
            </div>
            <div class="w-1/2">
              <div class="h-full" :class="WIDGET_META[row.right.id].wrapClass">
                <component
                  :is="widgetComponent(row.right.id)"
                  :common-period="period"
                  :dark-mode="darkMode"
                  v-bind="widgetExtraProps(row.right.id)"
                  @period-change="handlePeriodChange"
                />
              </div>
            </div>
          </div>

          <!-- Unpaired half-width widget — spans the full row -->
          <div v-else :class="WIDGET_META[row.widget.id].wrapClass">
            <component
              :is="widgetComponent(row.widget.id)"
              :common-period="period"
              :dark-mode="darkMode"
              v-bind="widgetExtraProps(row.widget.id)"
              @period-change="handlePeriodChange"
            />
          </div>

          <hr class="dark:border-gray-800" />
        </template>
      </div>
    </div>

    <!-- Customize panel (mounted only when open) -->
    <DashboardCustomizePanel
      v-if="showCustomize"
      :layout="layout"
      :current-profile="activeProfile"
      @close="showCustomize = false"
      @saved="onLayoutSaved"
    />
  </div>
</template>

<script lang="ts">
import { ModelNameEnum } from 'models/types';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { docsPathRef } from 'src/utils/refs';
import { PeriodKey } from 'src/utils/types';
import { defineComponent } from 'vue';
import Cashflow from './Cashflow.vue';
import CashOnHand from './CashOnHand.vue';
import DashboardCustomizePanel from './DashboardCustomizePanel.vue';
import Expenses from './Expenses.vue';
import GrossMargin from './GrossMargin.vue';
import OverdueInvoices from './OverdueInvoices.vue';
import PeriodSelector from './PeriodSelector.vue';
import ProfitAndLoss from './ProfitAndLoss.vue';
import TopCustomers from './TopCustomers.vue';
import TopSuppliers from './TopSuppliers.vue';
import UnpaidInvoices from './UnpaidInvoices.vue';
import InvoiceDrafts from './InvoiceDrafts.vue';
import ReceivablesAging from './ReceivablesAging.vue';
import UpcomingBills from './UpcomingBills.vue';
import {
  buildWidgetRows,
  DashboardProfile,
  DEFAULT_LAYOUT,
  parseWidgetLayout,
  WIDGET_META,
  WidgetConfig,
  WidgetKey,
  WidgetRow,
} from './types';

/** Maps a WidgetKey to the Vue component that renders it. */
const WIDGET_COMPONENTS: Record<WidgetKey, unknown> = {
  cashflow: Cashflow,
  salesInvoices: UnpaidInvoices,
  purchaseInvoices: UnpaidInvoices,
  profitAndLoss: ProfitAndLoss,
  expenses: Expenses,
  overdueInvoices: OverdueInvoices,
  upcomingBills: UpcomingBills,
  cashOnHand: CashOnHand,
  topCustomers: TopCustomers,
  grossMargin: GrossMargin,
  topSuppliers: TopSuppliers,
  invoiceDrafts: InvoiceDrafts,
  receivablesAging: ReceivablesAging,
};

/** Extra props passed to specific widgets beyond commonPeriod / darkMode. */
const WIDGET_EXTRA_PROPS: Partial<Record<WidgetKey, Record<string, unknown>>> =
  {
    salesInvoices: { schemaName: 'SalesInvoice' },
    purchaseInvoices: { schemaName: 'PurchaseInvoice' },
  };

export default defineComponent({
  name: 'Dashboard',
  components: {
    PageHeader,
    FeatherIcon,
    DashboardCustomizePanel,
    // Registered here so Vue can resolve them inside <component :is="...">
    Cashflow,
    ProfitAndLoss,
    Expenses,
    PeriodSelector,
    UnpaidInvoices,
    OverdueInvoices,
    UpcomingBills,
    CashOnHand,
    TopCustomers,
    GrossMargin,
    InvoiceDrafts,
    ReceivablesAging,
    TopSuppliers,
  },

  props: {
    darkMode: { type: Boolean, default: false },
  },

  data() {
    return {
      period: 'This Year' as PeriodKey,
      layout: DEFAULT_LAYOUT.map((c) => ({ ...c })) as WidgetConfig[],
      activeProfile: 'Custom' as DashboardProfile,
      showCustomize: false,
      WIDGET_META,
    };
  },

  computed: {
    visibleRows(): WidgetRow[] {
      return buildWidgetRows(this.layout);
    },
  },

  async activated() {
    docsPathRef.value = 'books/dashboard';
    await this.loadLayout();
  },

  deactivated() {
    docsPathRef.value = '';
  },

  methods: {
    async loadLayout() {
      const doc = await fyo.doc.getDoc(ModelNameEnum.DashboardSettings);
      this.layout = parseWidgetLayout(doc.widgetLayout as string | undefined);
      this.activeProfile =
        (doc.activeProfile as DashboardProfile | undefined) ?? 'Custom';
    },

    widgetComponent(id: WidgetKey): unknown {
      return WIDGET_COMPONENTS[id];
    },

    widgetExtraProps(id: WidgetKey): Record<string, unknown> {
      return WIDGET_EXTRA_PROPS[id] ?? {};
    },

    handlePeriodChange(period: PeriodKey) {
      if (period === this.period) return;
      this.period = '';
    },

    onLayoutSaved(newLayout: WidgetConfig[], profile: DashboardProfile) {
      this.layout = newLayout;
      this.activeProfile = profile;
    },
  },
});
</script>
