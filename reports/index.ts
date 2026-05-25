import { BalanceSheet } from './BalanceSheet/BalanceSheet';
import { AnnualReport } from './EstonianAnnualReport/AnnualReport';
import { KmdReport } from './EstonianTax/KmdReport';
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
  TrialBalance,
  GSTR1,
  GSTR2,
  KmdReport,
  AnnualReport,
  StockLedger,
  StockBalance,
} as const;
