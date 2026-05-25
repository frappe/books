import { HiddenMap, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { Party as BaseParty } from 'models/baseModels/Party/Party';
import { PartyRole } from 'models/baseModels/Party/types';
import { EE_VAT_NUMBER_RE } from 'regional/ee';
import { PartyVatType } from './types';

export class Party extends BaseParty {
  vatNumber?: string;
  role?: PartyRole;
  partyVatType?: PartyVatType;
  // eslint-disable-next-line @typescript-eslint/require-await
  async beforeSync() {
    const partyVatType = this.get('partyVatType') as PartyVatType | undefined;
    const vatNumber = this.get('vatNumber') as string | undefined;
    if (
      vatNumber &&
      (partyVatType === 'EE_UNREGISTERED' ||
        partyVatType === 'EU_B2C' ||
        partyVatType === 'EXEMPT')
    ) {
      this.vatNumber = '';
    }
  }

  validations: ValidationMap = {
    vatNumber: (value) => {
      if (!value || typeof value !== 'string') return;
      const partyVatType = this.get('partyVatType') as PartyVatType | undefined;
      if (partyVatType === 'EE_REGISTERED' && !EE_VAT_NUMBER_RE.test(value)) {
        throw new ValidationError(
          this.fyo
            .t`Estonian VAT number must match format EE followed by 9 digits.`
        );
      }
    },
  };

  hidden: HiddenMap = {
    vatNumber: () => {
      const t = this.partyVatType;
      return t === 'EE_UNREGISTERED' || t === 'EU_B2C' || t === 'EXEMPT';
    },
  };
}
