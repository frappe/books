import { HiddenMap } from 'fyo/model/types';
import { Party as BaseParty } from 'models/baseModels/Party/Party';
import { GSTType } from './types';
import { PartyRole } from 'models/baseModels/Party/types';

export class Party extends BaseParty {
  gstin?: string;
  role?: PartyRole;
  gstType?: GSTType;
  loyaltyProgram?: string;

  // eslint-disable-next-line @typescript-eslint/require-await
  async beforeSync() {
    const gstin = this.get('gstin') as string | undefined;
    const gstType = this.get('gstType') as GSTType;

    if (gstin && gstType !== 'Registered Regular') {
      this.gstin = '';
    }
  }

  hidden: HiddenMap = {
    gstin: () => (this.gstType as GSTType) !== 'Registered Regular',
    loyaltyProgram: () => {
      if (!this.fyo.singles.AccountingSettings?.enableLoyaltyProgram) {
        return true;
      }
      return this.role === 'Supplier';
    },
    loyaltyPoints: () => !this.loyaltyProgram || this.role === 'Supplier',
  };
}
