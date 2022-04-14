import Doc from 'frappe/model/doc';
import { ListViewSettings } from 'frappe/model/types';

export class Tax extends Doc {
  static listSettings: ListViewSettings = { columns: ['name'] };
}
