import { Doc } from 'fyo/model/doc';
import { FormulaMap } from 'fyo/model/types';
import { Money } from 'pesa';
import type { PriceList } from './PriceList';
import { ModelNameEnum } from 'models/types';

export class PriceListItem extends Doc {
  item?: string;
  unit?: string;
  rate?: Money;
  parentdoc?: PriceList;

  get isBuying() {
    return !!this.parentdoc?.buying;
  }

  get isSelling() {
    return !!this.parentdoc?.selling;
  }

  get priceList() {
    return this.parentdoc?.name;
  }

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
