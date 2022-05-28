<template>
  <div class="flex flex-col">
    <PageHeader :title="t`Dashboard`" />

    <div class="mx-4 overflow-y-auto no-scrollbar flex flex-col gap-8">
      <Cashflow class="" />
      <hr />
      <UnpaidInvoices />
      <hr />
      <div class="flex gap-8">
        <ProfitAndLoss class="w-full" />
        <Expenses class="w-full" />
      </div>
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
