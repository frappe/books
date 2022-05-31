<template>
  <div class="flex flex-col">
    <PageHeader :title="t`Dashboard`" />

    <div class="overflow-y-hidden no-scrollbar flex flex-col">
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
</template>

<script>
import PageHeader from 'src/components/PageHeader';
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
};
</script>
