import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class LoyaltyPointEntry extends Doc {
  loyaltyProgram?: string;
  customer?: string;
  invoice?: string;
  purchaseAmount?: number;
  expiryDate?: Date;

  static override getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'loyaltyProgram',
        'customer',
        'purchaseAmount',
        'loyaltyPoints',
      ],
    };
  }
}
