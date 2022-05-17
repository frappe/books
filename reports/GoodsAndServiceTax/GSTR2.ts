import { Action } from 'fyo/model/types';
import { BaseGSTR } from './BaseGSTR';
import { GSTRType } from './types';

export class GSTR2 extends BaseGSTR {
  static title = 'GSTR2';
  static reportName = 'gstr-2';

  gstrType: GSTRType = 'GSTR-2';
  getActions(): Action[] {
    return [];
  }
}
