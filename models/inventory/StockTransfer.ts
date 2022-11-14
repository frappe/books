import { Attachment } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';

export abstract class StockTransfer extends Doc {
  name?: string;
  date?: string;
  party?: string;
  terms?: string;
  attachment?: Attachment;
}
