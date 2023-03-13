import { Doc } from 'fyo/model/doc';
import { HiddenMap } from 'fyo/model/types';

export class PrintSettings extends Doc {
  override hidden: HiddenMap = {};
}
