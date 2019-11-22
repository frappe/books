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
              <span class="ml-2">{{ _('Outflow') }}</span>
            </div>
          </div>
          <PeriodSelector
            :value="periods.cashflow"
            @change="value => periodChange('cashflow', value)"
          />
        </div>
        <div class="chart-wrapper" ref="cashflow"></div>
      </div>
      <div class="my-10 border-t" />
      <div class="flex -mx-4">
        <div
          class="w-1/2 px-4"
          v-for="invoice in invoices"
          :key="invoice.title"
        >
          <SectionHeader>
            <template slot="title">{{ invoice.title }}</template>
            <PeriodSelector
              slot="action"
              :value="periods[invoice.periodKey]"
              @change="value => periodChange(invoice.periodKey, value)"
            />
          </SectionHeader>
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
              :style="`width: ${(invoice.paid / invoice.total) * 100}%`"
            ></div>
          </div>
        </div>
      </div>
      <div class="my-10 border-t" />
      <div class="flex -mx-4">
        <div class="w-1/2 px-4">
          <SectionHeader>
            <template slot="title">{{ _('Profit and Loss') }}</template>
            <PeriodSelector
              slot="action"
              :value="periods.profitAndLoss"
              @change="value => periodChange('profitAndLoss', value)"
            />
          </SectionHeader>
          <div class="chart-wrapper" ref="profit-and-loss"></div>
        </div>
        <div class="w-1/2 px-4">
          <SectionHeader>
            <template slot="title" class="font-medium">{{
              _('Top Expenses')
            }}</template>
            <PeriodSelector
              slot="action"
              :value="periods.expenses"
              @change="value => periodChange('expenses', value)"
            />
          </SectionHeader>
          <div class="flex">
            <div class="w-1/2">
              <div
                class="mt-5 flex justify-between items-center text-sm"
                v-for="d in expenses"
                :key="d.name"
              >
                <div class="flex items-center">
                  <div class="w-3 h-3 rounded" :class="d.class"></div>
                  <div class="ml-3">{{ d.account }}</div>
                </div>
                <div>{{ frappe.format(d.total, 'Currency') }}</div>
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
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';
import { getData } from '../../../reports/FinancialStatements/FinancialStatements';
import ProfitAndLoss from '../../../reports/ProfitAndLoss/ProfitAndLoss';
import Cashflow from '../../../reports/Cashflow/Cashflow';
import theme from '@/theme';
import { DateTime } from 'luxon';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    SearchBar,
    PeriodSelector,
    SectionHeader
  },
  data() {
    return {
      invoices: [],
      expenses: [],
      periods: {
        cashflow: 'This Year',
        receivables: 'This Year',
        payables: 'This Year',
        expenses: 'This Year',
        profitAndLoss: 'This Year'
      }
    };
  },

  async mounted() {
    await this.generateCashflowChart();
    this.getInvoiceTotals();
    this.generateProfitAndLossChart();
    this.generateExpensesPieChart();
  },

  methods: {
    async getInvoiceTotals() {
      let promises = [
        {
          title: 'Sales Invoices',
          doctype: 'SalesInvoice',
          total: 0,
          unpaid: 0,
          paid: 0,
          color: 'blue',
          periodKey: 'receivables'
        },
        {
          title: 'Purchase Invoices',
          doctype: 'PurchaseInvoice',
          total: 0,
          unpaid: 0,
          paid: 0,
          color: 'gray',
          periodKey: 'payables'
        },
      ].map(async d => {
        let { fromDate, toDate, periodicity } = await this.getDatesAndPeriodicity(
          this.periods[d.periodKey]
        );

        let res = await frappe.db.sql(
          `
          select
            sum(baseGrandTotal) as total,
            sum(outstandingAmount) as outstanding
          from ${d.doctype}
          where date >= $fromDate and date <= $toDate
        `,
          { $fromDate: fromDate, $toDate: toDate }
        );
        let { total, outstanding } = res[0];
        d.total = total;
        d.unpaid = outstanding;
        d.paid = total - outstanding;
        return d;
      });

      this.invoices = await Promise.all(promises);
    },
    async generateCashflowChart() {
      let { fromDate, toDate, periodicity } = await this.getDatesAndPeriodicity(
        this.periods.cashflow
      );

      let { data, periodList } = await new Cashflow().run({
        fromDate,
        toDate,
        periodicity
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
          labels: periodList,
          datasets: [
            {
              name: 'Inflow',
              chartType: 'line',
              values: data.map(period => period.inflow)
            },
            {
              name: 'Outflow',
              chartType: 'line',
              values: data.map(period => period.outflow)
            }
          ]
        }
      });
    },
    async generateProfitAndLossChart() {
      let { fromDate, toDate, periodicity } = await this.getDatesAndPeriodicity(
        this.periods.profitAndLoss
      );

      let pl = new ProfitAndLoss();
      let res = await pl.run({
        fromDate,
        toDate,
        periodicity
      });

      let totalRow = res.rows[res.rows.length - 1];

      const chart = new Chart(this.$refs['profit-and-loss'], {
        title: '',
        animate: false,
        type: 'bar',
        colors: ['#2490EF', '#B7BFC6'],
        axisOptions: {
          xAxisMode: 'tick',
          shortenYAxisNumbers: true,
          xIsSeries: true
        },
        tooltipOptions: {
          formatTooltipY: value => frappe.format(value, 'Currency')
        },
        data: {
          labels: res.columns,
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
      let { fromDate, toDate } = await this.getDatesAndPeriodicity(
        this.periods.expenses
      );

      let topExpenses = await frappe.db.sql(
        `
        select sum(debit) - sum(credit) as total, account from AccountingLedgerEntry
        where account in (
          select name from Account where rootType = "Expense"
        )
        and date >= $fromDate and date <= $toDate
        group by account
        order by total desc
        limit 5
      `,
        { $fromDate: fromDate, $toDate: toDate }
      );

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

      let chart = new Chart(this.$refs['top-expenses'], {
        type: 'pie',
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
    },

    periodChange(key, value) {
      this.periods[key] = value;
      if (key === 'cashflow') {
        this.generateCashflowChart();
      }
      if (key === 'profitAndLoss') {
        this.generateProfitAndLossChart();
      }
      if (key === 'expenses') {
        this.generateExpensesPieChart();
      }
      if (['receivables', 'payables'].includes(key)) {
        this.getInvoiceTotals();
      }
    },

    async getDatesAndPeriodicity(period) {
      let fromDate, toDate;
      let periodicity = 'Monthly';
      let accountingSettings = await frappe.getSingle('AccountingSettings');

      if (period === 'This Year') {
        fromDate = accountingSettings.fiscalYearStart;
        toDate = accountingSettings.fiscalYearEnd;
      } else if (period === 'This Quarter') {
        fromDate = DateTime.local()
          .startOf('quarter')
          .toISODate();
        toDate = DateTime.local()
          .endOf('quarter')
          .toISODate();
      } else if (period === 'This Month') {
        fromDate = DateTime.local()
          .startOf('month')
          .toISODate();
        toDate = DateTime.local()
          .endOf('month')
          .toISODate();
      }

      return {
        fromDate,
        toDate,
        periodicity
      };
    }
  }
};
</script>
<style scoped>
.chart-wrapper >>> .chart-legend {
  display: none;
}
</style>
