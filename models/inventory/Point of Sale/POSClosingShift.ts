import { ListViewSettings } from 'fyo/model/types';
import { ClosingAmounts } from './ClosingAmounts';
import { ClosingCash } from './ClosingCash';
import { Doc } from 'fyo/model/doc';
import { sendNtfyNotification } from 'src/utils/ntfy';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { POSOpeningShift } from './POSOpeningShift';

export class POSClosingShift extends Doc {
  closingAmounts?: ClosingAmounts[];
  closingCash?: ClosingCash[];
  closingDate?: Date;
  openingShift?: string;

  get closingCashAmount() {
    if (!this.closingCash) {
      return this.fyo.pesa(0);
    }

    let closingAmount = this.fyo.pesa(0);

    this.closingCash.map((row: ClosingCash) => {
      const denomination = row.denomination ?? this.fyo.pesa(0);
      const count = row.count ?? 0;

      const amount = denomination.mul(count);
      closingAmount = closingAmount.add(amount);
    });
    return closingAmount;
  }

  async afterSubmit() {
    await super.afterSubmit();

    const dateStr = DateTime.fromJSDate(this.closingDate || new Date()).toFormat('MMMM d, yyyy');
    const title = 'EOD Sales Summary - ' + dateStr;

    const formatNumber = (num: number | string) => {
      return Number(num).toLocaleString('en-US');
    };

    // 1. Get Opening Date from Opening Shift
    let openingDate: Date | undefined;
    if (this.openingShift) {
        const openingShiftDoc = (await this.fyo.doc.getDoc(ModelNameEnum.POSOpeningShift, this.openingShift)) as POSOpeningShift;
        openingDate = openingShiftDoc?.openingDate;
    }

    // 2. Fetch Sales Invoices for the shift period
    let productLines = '';
    let productLinesTotal = this.fyo.pesa(0);
    if (openingDate && this.closingDate) {
        const invoicesList = (await this.fyo.db.getAll(ModelNameEnum.SalesInvoice, {
            filters: {
                isPOS: true,
                date: ['between', [openingDate.toISOString(), this.closingDate.toISOString()]],
                submitted: true,
            }
        })) as any[];

        const aggregatedProducts: Record<string, { quantity: number, amount: Money }> = {};

        for (const invData of invoicesList) {
            const inv = (await this.fyo.doc.getDoc(ModelNameEnum.SalesInvoice, invData.name)) as any;
            const items = (inv.items || []) as any[];
            for (const item of items) {
                const itemName = item.item as string;
                if (!aggregatedProducts[itemName]) {
                    aggregatedProducts[itemName] = { quantity: 0, amount: this.fyo.pesa(0) };
                }
                aggregatedProducts[itemName].quantity += item.quantity || 0;
                const itemAmount = item.amount || this.fyo.pesa(0);
                aggregatedProducts[itemName].amount = aggregatedProducts[itemName].amount.add(itemAmount);
                productLinesTotal = productLinesTotal.add(itemAmount);
            }
        }

        productLines = Object.entries(aggregatedProducts)
            .map(([name, data], index) => (index + 1) + '. ' + name + ' (x' + data.quantity + ') - ' + formatNumber(data.amount.toString()))
            .join('\n');
    }

    const totalSalesMoney = (this.closingAmounts ?? [])
      .reduce((acc, row) => acc.add(row.closingAmount ?? this.fyo.pesa(0)), this.fyo.pesa(0));
    
    const totalSales = formatNumber(totalSalesMoney.toString());

    // 3. Fetch Actual Account Balances (Dashboard Logic)
    const allAccounts = await this.fyo.db.getAll(ModelNameEnum.Account, {
      fields: ['name', 'rootType', 'accountType', 'isGroup'],
      filters: {
        rootType: 'Asset',
        isGroup: false,
      },
    });

    const bankAndCashAccounts = allAccounts.filter(
      (acc: any) => 
        acc.accountType === 'Bank' || 
        acc.accountType === 'Cash'
    );

    const totals = await this.fyo.db.getTotalCreditAndDebit();
    const totalsMap: Record<string, { totalCredit: number; totalDebit: number }> = {};
    
    const toNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'bigint') return Number(value);
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    totals.forEach((total: any) => {
      totalsMap[total.account] = {
        totalCredit: toNumber(total.totalCredit),
        totalDebit: toNumber(total.totalDebit),
      };
    });

    const accountBalances = bankAndCashAccounts.map((account: any) => {
      const total = totalsMap[account.name];
      let balance = 0;
      if (total) {
        balance = total.totalDebit - total.totalCredit;
      }
      return {
        name: account.name as string,
        balance,
      };
    });

    accountBalances.sort((a, b) => a.name.localeCompare(b.name));

    const accountBalancesTotal = accountBalances.reduce((sum, acc) => sum + acc.balance, 0);

    const accountBalancesBreakdown = accountBalances
      .map(
        (acc, index) =>
          index +
          1 +
          '. ' +
          acc.name +
          ': ' +
          formatNumber(acc.balance)
      )
      .join('\n');

    const message = '\n\nFollowing products were sold today:\n\n' + (productLines || 'No products sold.') + (productLines ? '\n\n**Total Amount: ' + formatNumber(productLinesTotal.toString()) + '**' : '') + '\n\n**Account Balances:**\n' + accountBalancesBreakdown + '\n\n**Total Balance:** ' + formatNumber(accountBalancesTotal);

    await sendNtfyNotification(this.fyo, message, title);
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'closingDate'],
    };
  }

  get isSubmittable() {
    return true;
  }
}