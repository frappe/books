import { BalanceSheet } from './BalanceSheet/BalanceSheet';
import { GeneralLedger } from './GeneralLedger/GeneralLedger';
import { GSTR1 } from './GoodsAndServiceTax/GSTR1';
import { GSTR2 } from './GoodsAndServiceTax/GSTR2';
import { StockLedger } from './inventory/StockLedger';
import { StockBalance } from './inventory/StockBalance';
import { ProfitAndLoss } from './ProfitAndLoss/ProfitAndLoss';
import { Report } from './Report';
import { TrialBalance } from './TrialBalance/TrialBalance';

export const reports = {
  GeneralLedger,
  ProfitAndLoss,
  BalanceSheet,
  TrialBalance,
  GSTR1,
  GSTR2,
  StockLedger,
  StockBalance,
} as Record<string, typeof Report>;
