import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';

export class POSShift extends Doc {
  isShiftOpen?: boolean;
  openingDate?: Date;
  closingDate?: Date;
  openingAmount?: Money;

  async openShift(): Promise<boolean> {
    if (this.isShiftOpen) {
      throw new ValidationError(t`POS Shift is already open.`);
    }

    if (this.openingAmount?.isNegative()) {
      throw new ValidationError(t`Opening Amount can not be negative.`);
    }

    await this.setAndSync({
      isShiftOpen: true,
      openingAmount: this.openingAmount,
      openingDate: new Date().toISOString(),
    });

    return true;
  }

  async closeShift(): Promise<boolean> {
    if (!this.isShiftOpen) {
      throw new ValidationError(t`POS Shift is not open.`);
    }

    await this.setAndSync({
      isShiftOpen: false,
    });

    return true;
  }
}
