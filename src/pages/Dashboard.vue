<template>
  <div class="flex flex-col">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold">{{ _('Dashboard') }}</h1>
      <template slot="actions">
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <div class="mt-4 px-8">
      <div class="border-t" />
      <div class="mt-6">
        <div class="flex items-center justify-between">
          <div class="font-medium">{{ _('Cash Flow') }}</div>
          <div class="flex text-base">
            <div class="flex items-center">
              <span class="w-3 h-3 rounded inline-block bg-blue-500"></span>
              <span class="ml-2">{{ _('Inflow') }}</span>
            </div>
            <div class="flex items-center ml-6">
              <span class="w-3 h-3 rounded inline-block bg-gray-500"></span>
              <span class="ml-2">{{ _('Outflow' )}}</span>
            </div>
          </div>
          <div class="text-sm flex items-center">
            {{ _('Last 30 Days') }}
            <feather-icon name="chevron-down" class="ml-1 w-3 h-3" />
          </div>
        </div>
        <div class="chart-wrapper" ref="cashflow"></div>
      </div>
      <div class="my-10 border-t" />
      <div class="flex -mx-4">
        <div class="w-1/2 px-4" v-for="invoice in invoices" :key="invoice.title">
          <div class="font-medium">{{ invoice.title }}</div>
          <div class="mt-6 flex justify-between">
            <div class="text-sm">
              {{ frappe.format(invoice.paid, 'Currency') }}
              <span class="text-gray-600">{{ _('Paid') }}</span>
            </div>
            <div class="text-sm">
              {{ frappe.format(invoice.unpaid, 'Currency') }}
              <span class="text-gray-600">{{ _('Unpaid') }}</span>
            </div>
          </div>
          <div class="mt-2 relative">
            <div
              class="w-full h-4 rounded"
              :class="invoice.color == 'blue' ? 'bg-blue-200' : 'bg-gray-200'"
            ></div>
            <div
              class="absolute inset-0 h-4 rounded"
              :class="invoice.color == 'blue' ? 'bg-blue-500' : 'bg-gray-500'"
              :style="`width: ${invoice.paid / invoice.total * 100}%`"
            ></div>
          </div>
        </div>
      </div>
      <div class="my-10 border-t" />
      <div class="flex -mx-4">
        <div class="w-1/2 px-4">
          <span class="font-medium">{{ _('Profit and Loss') }}</span>
          <div class="chart-wrapper" ref="profit-and-loss"></div>
        </div>
        <div class="w-1/2 px-4">
          <span class="font-medium">{{ _('Top Expenses') }}</span>
          <div class="flex">
            <div class="w-1/2">
              <div
                class="mt-5 flex justify-between items-center text-sm"
                v-for="d in expenses"
                :key="d.name"
              >
                <div class="flex items-center">
                  <div class="w-3 h-3 rounded" :style="`backgroundColor: ${d.color}`"></div>
                  <div class="ml-3">{{ d.name }}</div>
                </div>
                <div>{{ frappe.format(d.value, 'Currency') }}</div>
              </div>
            </div>
            <div class="w-1/2 chart-wrapper" ref="top-expenses"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import { Chart } from 'frappe-charts';
import PageHeader from '@/components/PageHeader';
import SearchBar from '@/components/SearchBar';
import { getData } from '../../reports/FinancialStatements/FinancialStatements';
import ProfitAndLoss from '../../reports/ProfitAndLoss/ProfitAndLoss';
import theme from '@/theme';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    SearchBar,
  },
  data() {
    return {
      invoices: [],
      expenses: []
    };
  },
  async mounted() {
    await this.generateIncomeExpenseChart();
    this.getInvoiceTotals();
    this.generateProfitAndLossChart();
    this.generateExpensesPieChart();
  },

  methods: {
    async getInvoiceTotals() {
      let res;
      res = await frappe.db.sql(`
        select
          sum(baseGrandTotal) as total,
          sum(outstandingAmount) as outstanding
        from SalesInvoice
      `);
      let { total, outstanding } = res[0];
      this.invoices.push({
        title: 'Sales Invoices',
        total: total,
        unpaid: outstanding,
        paid: total - outstanding,
        color: 'blue'
      });

      res = await frappe.db.sql(`
        select
          sum(baseGrandTotal) as total,
          sum(outstandingAmount) as outstanding
        from PurchaseInvoice
      `);
      let { total: purchaseTotal, outstanding: purchaseOutstanding } = res[0];
      this.invoices.push({
        title: 'Purchase Invoices',
        total: purchaseTotal,
        unpaid: purchaseOutstanding,
        paid: purchaseTotal - purchaseOutstanding,
        color: 'gray'
      });
    },
    async generateIncomeExpenseChart() {
      let income = await getData({
        rootType: 'Income',
        balanceMustBe: 'Credit',
        fromDate: '2019-01-01',
        toDate: '2019-12-31',
        periodicity: 'Monthly'
      });

      let expense = await getData({
        rootType: 'Expense',
        balanceMustBe: 'Debit',
        fromDate: '2019-01-01',
        toDate: '2019-12-31',
        periodicity: 'Monthly'
      });

      const chart = new Chart(this.$refs['cashflow'], {
        title: '',
        type: 'line',
        animate: false,
        colors: ['#2490EF', '#B7BFC6'],
        axisOptions: {
          xAxisMode: 'tick',
          shortenYAxisNumbers: true
        },
        lineOptions: {
          regionFill: 1,
          hideDots: 1,
          heatLine: 1
        },
        tooltipOptions: {
          formatTooltipY: value => frappe.format(value, 'Currency')
        },
        data: {
          labels: income.periodList,
          datasets: [
            {
              name: 'Income',
              chartType: 'line',
              values: income.periodList.map(key => income.totalRow[key])
            },
            {
              name: 'Expense',
              chartType: 'line',
              values: expense.periodList.map(key => expense.totalRow[key])
            }
          ]
        }
      });
    },
    async generateProfitAndLossChart() {
      let pl = new ProfitAndLoss();
      let res = await pl.run({
        fromDate: '2019-01-01',
        toDate: '2019-12-31',
        periodicity: 'Monthly'
      });

      let totalRow = res.rows[res.rows.length - 1];

      const chart = new Chart(this.$refs['profit-and-loss'], {
        title: '',
        animate: false,
        type: 'bar',
        colors: ['#2490EF', '#B7BFC6'],
        axisOptions: {
          xAxisMode: 'tick',
          shortenYAxisNumbers: true
        },
        tooltipOptions: {
          formatTooltipY: value => frappe.format(value, 'Currency')
        },
        data: {
          labels: res.columns.map(d => d.replace('2019', '')),
          datasets: [
            {
              name: 'Income',
              chartType: 'bar',
              values: res.columns.map(key => totalRow[key])
            }
          ]
        }
      });
    },

    async generateExpensesPieChart() {
      let expense = await getData({
        rootType: 'Expense',
        balanceMustBe: 'Debit',
        fromDate: '2019-01-01',
        toDate: '2019-12-31',
        periodicity: 'Yearly'
      });

      // let key = expense.periodList[0];
      let key = '2019 - 2020';
      let shades = ['800', '600', '400', '200', '100'];
      let expenses = expense.accounts
        .filter(d => d[key])
        .map((d, i) => {
          return {
            name: d.name,
            value: d[key]
          };
        })
        .sort((a, b) => {
          return b.value - a.value;
        })
        .slice(0, 5)
        .map((d, i) => {
          d.color = theme.backgroundColor.gray[shades[i]];
          return d;
        });

      this.expenses = expenses;

      let chart = new Chart(this.$refs['top-expenses'], {
        type: 'pie',
        colors: expenses.map(d => d.color),
        data: {
          labels: expenses.map(d => d.name),
          datasets: [
            {
              values: expenses.map(d => d.value)
            }
          ]
        }
      });
    }
  }
};
</script>
<style scoped>
.chart-wrapper >>> .chart-legend {
  display: none;
}
</style>
