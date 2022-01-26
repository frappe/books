<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template slot="title">{{ t('Top Expenses') }}</template>
      <PeriodSelector
        slot="action"
        :value="period"
        @change="(value) => (period = value)"
      />
    </SectionHeader>
    <div class="flex relative" v-show="hasData">
      <div class="w-1/2">
        <div
          class="mt-5 flex justify-between items-center text-sm"
          v-for="(d, i) in expenses"
          :key="d.name"
        >
          <div
            class="flex items-center"
            @mouseover="active = i"
            @mouseleave="active = null"
          >
            <div class="w-3 h-3 rounded-sm" :class="d.class"></div>
            <div class="ml-3">{{ d.account }}</div>
          </div>
          <div>{{ frappe.format(d.total, 'Currency') }}</div>
        </div>
      </div>
      <DonutChart
        class="w-1/2"
        :active="active"
        :sectors="sectors"
        :offset-x="3"
        :thickness="11.5"
        :text-offset-x="6.5"
        :value-formatter="(value) => frappe.format(value, 'Currency')"
        :total-label="t('Total Spending')"
        @change="(value) => (active = value)"
      />
    </div>
    <div v-if="expenses.length === 0" class="flex-1 w-full h-full flex-center">
      <span class="text-base text-gray-600">
        {{ t('No expenses in this period') }}
      </span>
    </div>
  </div>
</template>

<script>
import frappe from 'frappe';
import theme from '@/theme';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';
import DonutChart from '../../components/Charts/DonutChart.vue';

export default {
  name: 'Expenses',
  components: {
    DonutChart,
    PeriodSelector,
    SectionHeader,
  },
  data: () => ({
    period: 'This Year',
    active: null,
    expenses: [],
  }),
  watch: {
    period(new_, old) {
      this.setData();
    },
  },
  activated() {
    this.setData();
  },
  computed: {
    totalExpense() {
      return this.expenses.reduce((sum, expense) => sum + expense.total, 0);
    },
    hasData() {
      return this.expenses.length > 0;
    },
    sectors() {
      return this.expenses.map(({ account, color, total }) => ({
        color,
        label: account,
        value: total,
      }));
    },
  },
  methods: {
    async setData() {
      const { fromDate, toDate } = await getDatesAndPeriodicity(this.period);
      const expenseAccounts = frappe.db.knex
        .select('name')
        .from('Account')
        .where('rootType', 'Expense');

      let topExpenses = await frappe.db.knex
        .select({
          total: frappe.db.knex.raw(
            'sum(cast(?? as real)) - sum(cast(?? as real))',
            ['debit', 'credit']
          ),
        })
        .select('account')
        .from('AccountingLedgerEntry')
        .where('account', 'in', expenseAccounts)
        .whereBetween('date', [fromDate, toDate])
        .groupBy('account')
        .orderBy('total', 'desc')
        .limit(5);

      const shades = [
        { class: 'bg-gray-800', hex: theme.backgroundColor.gray['800'] },
        { class: 'bg-gray-600', hex: theme.backgroundColor.gray['600'] },
        { class: 'bg-gray-400', hex: theme.backgroundColor.gray['400'] },
        { class: 'bg-gray-300', hex: theme.backgroundColor.gray['300'] },
        { class: 'bg-gray-200', hex: theme.backgroundColor.gray['200'] },
      ];

      topExpenses = topExpenses.map((d, i) => {
        d.color = shades[i].hex;
        d.class = shades[i].class;
        return d;
      });

      this.expenses = topExpenses;
    },
  },
};
</script>
