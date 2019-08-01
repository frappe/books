<template>
  <div>
    <PageHeader title="Dashboard" />
    <div class="container mt-3">
      <div class="row no-gutters">
        <DashboardCard v-for="chart in chartData" :key="chart.title" :chartData="chart" />
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from '../components/PageHeader';
import DashboardCard from '../components/DashboardCard';
import frappe from 'frappejs';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    DashboardCard
  },
  data() {
    return {
      chartData: [],
      charts: undefined
    };
  },
  async beforeMount() {
    const dashboardSettings = await frappe.getDoc('DashboardSettings');
    this.charts = dashboardSettings.charts;
    this.charts.forEach(async c => {
      const { labels, datasets } = await this.getAccountData(c.account, c.type);
      this.chartData.push({
        title: c.account,
        type: c.type.toLowerCase(),
        color: c.color,
        data: {
          labels,
          datasets
        }
      });
    });
  },
  methods: {
    async getAccountData(account, chartType) {
      let entriesArray = [];
      let accountType;
      async function getAccountEntries(accountName) {
        const account = await frappe.getDoc('Account', accountName);
        accountType = account.rootType;
        if (account.isGroup != 1) {
          const ledgerEntries = await frappe.db.getAll({
            doctype: 'AccountingLedgerEntry',
            filters: { account: account.name },
            fields: ['*']
          });
          entriesArray = entriesArray.concat(ledgerEntries);
        } else {
          const children = await frappe.db.getAll({
            doctype: 'Account',
            filters: { parentAccount: account.name }
          });
          if (children.length)
            for (let account of children) {
              entriesArray = await getAccountEntries(account.name);
            }
        }
        return entriesArray;
      }
      let ledgerEntries = await getAccountEntries(account);
      accountType = ['Asset', 'Expense'].includes(accountType)
        ? 'debit'
        : 'credit';
      let { labels, datasets } = this.createLabelsAndDataSet(chartType);
      const currentMonthIndex = new Date().getMonth();
      for (let entry of ledgerEntries) {
        let monthIndex = parseInt(entry.date.split('-')[1]) - 1;
        let pos = (monthIndex + currentMonthIndex) % 13;
        if (accountType === 'debit')
          datasets[0].values[pos] += entry.debit || -entry.credit;
        else if (accountType === 'credit')
          datasets[0].values[pos] += -entry.debit || entry.credit;
      }
      return { labels, datasets };
    },
    createLabelsAndDataSet(chartType) {
      const currentMonthIndex = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthName = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'June',
        'July',
        'Aug',
        'Sept',
        'Oct',
        'Nov',
        'Dec'
      ];
      let labels = [];
      let datasets = [
        {
          type: chartType,
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
      ];
      for (let i = 0; i < 13; i++) {
        let year = i + currentMonthIndex >= 12 ? currentYear : currentYear - 1;
        labels.push(monthName[(i + currentMonthIndex) % 12]);
      }
      return { labels, datasets };
    }
  }
};
</script>