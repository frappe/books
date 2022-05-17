<template>
  <div class="flex flex-col">
    <PageHeader :title="t`Dashboard`" />

    <div class="mx-4 overflow-y-scroll no-scrollbar">
      <Cashflow class="mt-5" />
      <hr class="border-t mt-10" />
      <UnpaidInvoices class="mt-10" />
      <hr class="border-t mt-10" />
      <div class="flex justify-between mx-auto mt-10 ml-4 mr-4 gap-10">
        <ProfitAndLoss class="w-1/2" />
        <!--
        <Expenses class="w-1/2" />
       -->
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from 'src/components/PageHeader';
import Cashflow from './Cashflow';
// import Expenses from './Expenses';
import ProfitAndLoss from './ProfitAndLoss';
import UnpaidInvoices from './UnpaidInvoices';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    UnpaidInvoices,
    Cashflow,
    ProfitAndLoss,
    /*
    Expenses,
    */
  },
};
</script>
