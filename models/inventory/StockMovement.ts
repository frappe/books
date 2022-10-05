import { Doc } from 'fyo/model/doc';
import { DefaultMap, FiltersMap, ListViewSettings } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { StockMovementItem } from './StockMovementItem';
import { MovementType } from './types';

export class StockMovement extends Doc {
  name?: string;
  date?: Date;
  numberSeries?: string;
  movementType?: MovementType;
  items?: StockMovementItem;
  amount?: Money;

  static filters: FiltersMap = {
    numberSeries: () => ({ referenceType: ModelNameEnum.StockMovement }),
  };

  static defaults: DefaultMap = {
    date: () => new Date(),
  };

  static getListViewSettings(): ListViewSettings {
    return { columns: ['name', 'date', 'movementType'] };
  }
}
