<template>
  <div class="flex flex-col">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold">{{ _('Dashboard') }}</h1>
      <template slot="actions">
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <div class="mx-4">
      <div class="border-t" />
      <Cashflow />
      <div class="my-4 mt-0 border-t" />
      <UnpaidInvoices />
      <div class="my-4 border-t" />
      <div class="flex justify-between mx-auto">
        <div class="w-1/2 mx-4">
          <ProfitAndLoss />
        </div>
        <div class="w-1/2 mx-4">
          <Expenses />
        </div>
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
    Expenses
  }
};
</script>
