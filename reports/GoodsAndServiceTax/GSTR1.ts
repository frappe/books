import { BaseGSTR } from './BaseGSTR';
import { GSTRType } from './types';

export class GSTR1 extends BaseGSTR {
  static title = 'GSTR1';
  static reportName = 'gstr-1';

  gstrType: GSTRType = 'GSTR-1';
}
