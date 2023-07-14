import { Doc } from 'fyo/model/doc';
import { FiltersMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';

export class POSSettings extends Doc {
  defaultCustomer?: string;
  defaultPrintTemplate?: string;

  static filters: FiltersMap = {
    defaultCustomer: () => ({
      role: ['in', ['Customer', 'Both']],
    }),
    defaultPrintTemplate: () => ({
      type: ModelNameEnum.SalesInvoice,
    }),
  };
}
