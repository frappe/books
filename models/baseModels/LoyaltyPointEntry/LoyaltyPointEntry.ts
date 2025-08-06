import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class LoyaltyPointEntry extends Doc {
  loyaltyProgram?: string;
  loyaltyProgramTier?: string;
  customer?: string;
  invoice?: string;
  purchaseAmount?: number;
  postingDate?: Date;
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
