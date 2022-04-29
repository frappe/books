// import BalanceSheetViewConfig from './BalanceSheet/viewConfig';
// import GeneralLedgerViewConfig from './GeneralLedger/viewConfig';
// import GoodsAndServiceTaxGSTR1View from './GoodsAndServiceTax/GSTR1View';
// import GoodsAndServiceTaxGSTR2View from './GoodsAndServiceTax/GSTR2View';
// import ProfitAndLossViewConfig from './ProfitAndLoss/viewConfig';
// import PurchaseRegisterViewConfig from './PurchaseRegister/viewConfig';
// import SalesRegisterViewConfig from './SalesRegister/viewConfig';
// import TrialBalanceViewConfig from './TrialBalance/viewConfig';

// export default {
//   'general-ledger': GeneralLedgerViewConfig,
//   'sales-register': SalesRegisterViewConfig,
//   'purchase-register': PurchaseRegisterViewConfig,
//   'balance-sheet': BalanceSheetViewConfig,
//   'profit-and-loss': ProfitAndLossViewConfig,
//   'trial-balance': TrialBalanceViewConfig,
//   'gstr-1': GoodsAndServiceTaxGSTR1View,
//   'gstr-2': GoodsAndServiceTaxGSTR2View,
// };

interface ReportView {
  title: string;
  method: string;
}

export default {} as Record<string, ReportView>;
