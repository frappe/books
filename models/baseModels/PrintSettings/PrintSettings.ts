import { Attachment } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { HiddenMap } from 'fyo/model/types';

export class PrintSettings extends Doc {
  logo?: Attachment;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  color?: string;
  font?: string;
  displayLogo?: boolean;
  displayTime?: boolean;
  displayDescription?: boolean;
  posPrintWidth?: number;
  amountInWords?: boolean;
  override hidden: HiddenMap = {};
}
