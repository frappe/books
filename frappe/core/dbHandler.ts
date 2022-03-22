import { Frappe } from 'frappe/core/frappe';

type SingleValue = { fieldname: string; parent: string; value: unknown };

export class DbHandler {
  frappe: Frappe;
  constructor(frappe: Frappe) {
    this.frappe = frappe;
  }

  init() {}
  close() {}
  exists(doctype: string, name: string): boolean {
    return false;
  }

  getSingleValues(...fieldnames: Omit<SingleValue, 'value'>[]): SingleValue[] {
    return [];
  }
}
