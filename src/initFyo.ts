import { Frappe } from 'frappe';

export const fyo = new Frappe({ isTest: false, isElectron: true });
