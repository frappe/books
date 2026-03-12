<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Account Balances` }}</template>
    </SectionHeader>

    <div v-if="hasData" class="mt-4 overflow-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800">
            <th
              class="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
            >
              {{ t`Account` }}
            </th>
            <th
              class="px-2 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
            >
              {{ t`Balance` }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="account in accountBalances"
            :key="account.name"
            class="border-b border-gray-100 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-850"
          >
            <td class="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
              {{ account.name }}
            </td>
            <td
              class="px-2 py-3 text-sm text-right font-medium"
              :class="getBalanceClass(account.balance)"
            >
              {{ formatCurrency(account.balance) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-300 dark:border-gray-700">
            <td class="px-2 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {{ t`Total` }}
            </td>
            <td
              class="px-2 py-3 text-sm text-right font-semibold"
              :class="getBalanceClass(totalBalance)"
            >
              {{ formatCurrency(totalBalance) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-else class="flex-1 w-full h-full flex-center my-20">
      <div class="text-center">
        <feather-icon
          name="credit-card"
          class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3"
        />
        <span class="block text-sm text-gray-600 dark:text-gray-500 mb-2">
          {{ t`No bank or cash accounts found` }}
        </span>
        <span class="block text-xs text-gray-500 dark:text-gray-600">
          {{ t`Add accounts under Bank Accounts or Cash in Chart of Accounts` }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import SectionHeader from './SectionHeader.vue';

export default defineComponent({
  name: 'AccountBalances',
  components: {
    SectionHeader,
  },
  props: {
    commonPeriod: { type: String, default: 'This Year' },
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      accountBalances: [] as Array<{ name: string; balance: number }>,
      hasData: false,
    };
  },
  computed: {
    totalBalance(): number {
      return this.accountBalances.reduce((sum, acc) => sum + acc.balance, 0);
    },
  },
  watch: {
    commonPeriod() {
      this.setData();
    },
  },
  activated() {
    this.setData();
  },
  methods: {
    async setData() {
      try {
        // Load all accounts under Bank Accounts and Cash (Current Assets)
        const allAccounts = await fyo.db.getAll('Account', {
          fields: ['name', 'rootType', 'accountType', 'isGroup'],
          filters: {
            rootType: 'Asset',
            isGroup: false,
          },
        });

        // Filter for Bank and Cash accounts
        const bankAndCashAccounts = allAccounts.filter(
          (acc: any) => 
            acc.accountType === 'Bank' || 
            acc.accountType === 'Cash'
        );

        if (!bankAndCashAccounts || bankAndCashAccounts.length === 0) {
          this.hasData = false;
          this.accountBalances = [];
          return;
        }

        // Get total credit and debit for all accounts (same method as ChartOfAccounts)
        const totals = await fyo.db.getTotalCreditAndDebit();
        const totalsMap: Record<string, { totalCredit: number; totalDebit: number }> = {};
        
        totals.forEach((total: any) => {
          totalsMap[total.account] = {
            totalCredit: this.toNumber(total.totalCredit),
            totalDebit: this.toNumber(total.totalDebit),
          };
        });

        // Calculate balance for each account
        this.accountBalances = bankAndCashAccounts.map((account: any) => {
          const total = totalsMap[account.name];
          let balance = 0;
          
          if (total) {
            // For Asset accounts (Bank, Cash), balance = totalDebit - totalCredit
            balance = total.totalDebit - total.totalCredit;
          }
          
          return {
            name: account.name as string,
            balance,
          };
        });

        // Sort by account name
        this.accountBalances.sort((a, b) => a.name.localeCompare(b.name));

        this.hasData = this.accountBalances.length > 0;
      } catch (error) {
        console.error('Error loading account balances:', error);
        this.hasData = false;
        this.accountBalances = [];
      }
    },
    formatCurrency(value: number): string {
      return fyo.format(value ?? 0, 'Currency');
    },
    getBalanceClass(balance: number): string {
      if (balance > 0) {
        return 'text-green-600 dark:text-green-400';
      } else if (balance < 0) {
        return 'text-red-600 dark:text-red-400';
      }
      return 'text-gray-900 dark:text-gray-100';
    },
    toNumber(value: any): number {
      if (value === null || value === undefined) {
        return 0;
      }
      if (typeof value === 'bigint') {
        return Number(value);
      }
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    },
  },
});
</script>
