<template>
  <div class="overflow-hidden h-screen" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`" />

    <div class="no-scrollbar overflow-auto h-full">
      <div
        style="min-width: var(--w-desk-fixed); min-height: var(--h-app)"
        class="overflow-auto"
      >
        <Cashflow class="p-4" />
        <hr />
        <UnpaidInvoices />
        <hr />
        <div class="flex">
          <ProfitAndLoss class="w-full p-4 border-r" />
          <Expenses class="w-full p-4" />
        </div>
        <hr />
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from 'src/components/PageHeader';
import { docsPath } from 'src/utils/ui';
import Cashflow from './Cashflow';
import Expenses from './Expenses';
import ProfitAndLoss from './ProfitAndLoss';
import UnpaidInvoices from './UnpaidInvoices';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    UnpaidInvoices,
    Cashflow,
    ProfitAndLoss,
    Expenses,
  },
  activated() {
    docsPath.value = 'analytics/dashboard';
  },
  deactivated() {
    docsPath.value = '';
  },
};
</script>
