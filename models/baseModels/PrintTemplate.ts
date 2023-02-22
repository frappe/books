import { Doc } from 'fyo/model/doc';

export class PrintTemplate extends Doc {
  name?: string;
  type?: string;
  template?: string;
  isCustom?: boolean;
}
