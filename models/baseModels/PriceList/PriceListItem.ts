import { Doc } from 'fyo/model/doc';
import type { FormulaMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import type { Money } from 'pesa';
import type { PriceList } from './PriceList';

export class PriceListItem extends Doc {
  item?: string;
  unit?: string;
  rate?: Money;
  parentdoc?: PriceList;

  formulas: FormulaMap = {
    unit: {
      formula: async () => {
        if (!this.item) {
          return;
        }

        return await this.fyo.getValue(ModelNameEnum.Item, this.item, 'unit');
      },
      dependsOn: ['item'],
    },
  };
}
