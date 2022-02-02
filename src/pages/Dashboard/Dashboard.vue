<template>
  <div class="flex flex-col">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold">{{ t('Dashboard') }}</h1>
      <template slot="actions">
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <hr class="border-t mx-4" />
    <div class="mx-4 overflow-y-scroll no-scrollbar">
      <Cashflow class="mt-5" />
      <hr class="border-t mt-10" />
      <UnpaidInvoices class="mt-10 ml-4 mr-4" />
      <hr class="border-t mt-10" />
      <div class="flex justify-between mx-auto mt-10 ml-4 mr-4 gap-10">
        <ProfitAndLoss class="w-1/2" />
        <Expenses class="w-1/2" />
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from '@/components/PageHeader';
import SearchBar from '@/components/SearchBar';
import Cashflow from './Cashflow';
import UnpaidInvoices from './UnpaidInvoices';
import ProfitAndLoss from './ProfitAndLoss';
import Expenses from './Expenses';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    SearchBar,
    Cashflow,
    UnpaidInvoices,
    ProfitAndLoss,
    Expenses,
  },
};
</script>
