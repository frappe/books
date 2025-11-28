import { BalanceSheet } from './BalanceSheet/BalanceSheet';
import { CashMovement } from './CashMovement/CashMovement';
import { GeneralLedger } from './GeneralLedger/GeneralLedger';
import { GSTR1 } from './GoodsAndServiceTax/GSTR1';
import { GSTR2 } from './GoodsAndServiceTax/GSTR2';
import { ProfitAndLoss } from './ProfitAndLoss/ProfitAndLoss';
import { TrialBalance } from './TrialBalance/TrialBalance';
import { StockBalance } from './inventory/StockBalance';
import { StockLedger } from './inventory/StockLedger';

export const reports = {
  GeneralLedger,
  ProfitAndLoss,
  BalanceSheet,
  CashMovement,
  TrialBalance,
  GSTR1,
  GSTR2,
  StockLedger,
  StockBalance,
} as const;