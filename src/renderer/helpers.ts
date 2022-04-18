import frappe from 'frappe';
import { ConfigKeys } from 'frappe/core/types';

export function incrementOpenCount() {
  let openCount = frappe.config.get(ConfigKeys.OpenCount);
  if (typeof openCount !== 'number') {
    openCount = 1;
  } else {
    openCount += 1;
  }

  frappe.config.set(ConfigKeys.OpenCount, openCount);
}
