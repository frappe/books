<template>
  <div>
    <SectionHeader>
      <template slot="title" class="font-medium">{{
        _('Top Expenses')
      }}</template>
      <PeriodSelector
        v-if="hasData"
        slot="action"
        :value="period"
        @change="value => (period = value)"
      />
    </SectionHeader>
    <div class="flex relative">
      <div class="w-1/2">
        <div
          class="mt-5 flex justify-between items-center text-sm"
          v-for="d in expenses"
          :key="d.name"
        >
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-sm" :class="d.class"></div>
            <div class="ml-3">{{ d.account }}</div>
          </div>
          <div>{{ frappe.format(d.total, 'Currency') }}</div>
        </div>
      </div>
      <div class="w-1/2">
        <div class="chart-wrapper" ref="top-expenses"></div>
        <div
          v-if="hasData"
          class="absolute text-base text-center font-semibold"
          style="right: 3.8rem; top: 32%;"
        >
          <div>
            {{ frappe.format(totalExpense, 'Currency') }}
          </div>
          <div class="text-xs text-gray-600">
            {{ _('Total Spending') }}
          </div>
        </div>
      </div>
      <div v-if="totalExpense === 0" class="absolute inset-0 flex-center">
        <span class="text-base text-gray-600">
          {{ _('No transactions yet') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import { Chart } from 'frappe-charts';
import theme from '@/theme';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';

export default {
  name: 'Expenses',
  components: {
    PeriodSelector,
    SectionHeader
  },
  data: () => ({
    period: 'This Year',
    expenses: [{ account: 'Test', total: 0 }]
  }),
  activated() {
    this.render();
  },
  watch: {
    period: 'render'
  },
  computed: {
    totalExpense() {
      return this.expenses.reduce((sum, expense) => sum + expense.total, 0);
    },
    hasData() {
      return this.totalExpense > 0;
    }
  },
  methods: {
    async render() {
      let { fromDate, toDate } = await getDatesAndPeriodicity(this.period);
      let expenseAccounts = frappe.db.knex
        .select('name')
        .from('Account')
        .where('rootType', 'Expense');
      let topExpenses = await frappe.db.knex
        .select({
          total: frappe.db.knex.raw('sum(??) - sum(??)', ['debit', 'credit'])
        })
        .select('account')
        .from('AccountingLedgerEntry')
        .where('account', 'in', expenseAccounts)
        .whereBetween('date', [fromDate, toDate])
        .groupBy('account')
        .orderBy('total', 'desc')
        .limit(5);

      let shades = [
        { class: 'bg-gray-800', hex: theme.backgroundColor.gray['800'] },
        { class: 'bg-gray-600', hex: theme.backgroundColor.gray['600'] },
        { class: 'bg-gray-400', hex: theme.backgroundColor.gray['400'] },
        { class: 'bg-gray-200', hex: theme.backgroundColor.gray['200'] },
        { class: 'bg-gray-100', hex: theme.backgroundColor.gray['100'] }
      ];
      topExpenses = topExpenses.map((d, i) => {
        d.class = shades[i].class;
        d.color = shades[i].hex;
        return d;
      });

      this.expenses = topExpenses;

      new Chart(this.$refs['top-expenses'], {
        type: 'donut',
        hoverRadio: 0.01,
        strokeWidth: 18,
        colors: topExpenses.map(d => d.color),
        data: {
          labels: topExpenses.map(d => d.account),
          datasets: [
            {
              values: topExpenses.map(d => d.total)
            }
          ]
        }
      });
    }
  }
};
</script>
