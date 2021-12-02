import GeneralLedgerViewConfig from './GeneralLedger/viewConfig';
import SalesRegisterViewConfig from './SalesRegister/viewConfig';
import PurchaseRegisterViewConfig from './PurchaseRegister/viewConfig';
import BalanceSheetViewConfig from './BalanceSheet/viewConfig';
import ProfitAndLossViewConfig from './ProfitAndLoss/viewConfig';
import TrialBalanceViewConfig from './TrialBalance/viewConfig';
// import BankReconciliationViewConfig from './BankReconciliation/viewConfig';
import GoodsAndServiceTaxGSTR1View from './GoodsAndServiceTax/GSTR1View';
import GoodsAndServiceTaxGSTR2View from './GoodsAndServiceTax/GSTR2View';

export default {
  'general-ledger' : GeneralLedgerViewConfig,
  'sales-register' : SalesRegisterViewConfig,
  'purchase-register' : PurchaseRegisterViewConfig,
  'balance-sheet' : BalanceSheetViewConfig,
  'profit-and-loss' : ProfitAndLossViewConfig,
  'trial-balance' : TrialBalanceViewConfig,
  // 'bank-reconciliation' : BankReconciliationViewConfig,
  'gstr-1' : GoodsAndServiceTaxGSTR1View,
  'gstr-2' : GoodsAndServiceTaxGSTR2View,
};
