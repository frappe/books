import { ErrorLog } from '@/errorHandling';
import { Model } from '@/types/model';
import Doc from 'frappe/model/document';
import Meta from 'frappe/model/meta';
import { getMoneyMaker, MoneyMaker } from 'pesa';
import { markRaw } from 'vue';
import {
  DEFAULT_DISPLAY_PRECISION,
  DEFAULT_INTERNAL_PRECISION,
} from '../utils/consts';
import * as errors from '../utils/errors';
import { format } from '../utils/format';
import { t, T } from '../utils/translation';
import { AuthHandler } from './authHandler';
import { DbHandler } from './dbHandler';
import { DocHandler } from './docHandler';

export class Frappe {
  t = t;
  T = T;
  format = format;

  errors = errors;
  isElectron = false;
  isServer = false;

  pesa: MoneyMaker;

  auth: AuthHandler;
  doc: DocHandler;
  db: DbHandler;

  Meta?: typeof Meta;
  Document?: typeof Doc;

  _initialized: boolean = false;

  errorLog?: ErrorLog[];
  methods?: Record<string, Function>;
  temp?: Record<string, unknown>;

  constructor() {
    this.auth = new AuthHandler(this);
    this.doc = new DocHandler(this);
    this.db = new DbHandler(this);
    this.pesa = getMoneyMaker({
      currency: 'XXX',
      precision: DEFAULT_INTERNAL_PRECISION,
      display: DEFAULT_DISPLAY_PRECISION,
      wrapper: markRaw,
    });
  }

  get initialized() {
    return this._initialized;
  }

  get docs() {
    return this.doc.docs;
  }

  get models() {
    return this.doc.models;
  }

  async initializeAndRegister(customModels = {}, force = false) {
    this.init(force);

    this.Meta = (await import('frappe/model/meta')).default;
    this.Document = (await import('frappe/model/document')).default;

    const coreModels = await import('frappe/models');
    this.doc.registerModels(coreModels.default as Record<string, Model>);
    this.doc.registerModels(customModels);
  }

  init(force: boolean) {
    if (this._initialized && !force) return;

    this.methods = {};
    this.errorLog = [];

    // temp params while calling routes
    this.temp = {};

    this.doc.init();
    this.auth.init();
    this.db.init();
    this._initialized = true;
  }

  async initializeMoneyMaker(currency: string = 'XXX') {
    // to be called after db initialization
    const values =
      (await this.db?.getSingleValues(
        {
          fieldname: 'internalPrecision',
          parent: 'SystemSettings',
        },
        {
          fieldname: 'displayPrecision',
          parent: 'SystemSettings',
        }
      )) ?? [];

    const acc = values.reduce((acc, sv) => {
      acc[sv.fieldname] = sv.value as string | number | undefined;
      return acc;
    }, {} as Record<string, string | number | undefined>);

    let precision: string | number =
      acc.internalPrecision ?? DEFAULT_INTERNAL_PRECISION;
    let display: string | number =
      acc.displayPrecision ?? DEFAULT_DISPLAY_PRECISION;

    if (typeof precision === 'string') {
      precision = parseInt(precision);
    }

    if (typeof display === 'string') {
      display = parseInt(display);
    }

    this.pesa = getMoneyMaker({
      currency,
      precision,
      display,
      wrapper: markRaw,
    });
  }

  close() {
    this.db.close();
    this.auth.logout();
  }

  store = {
    isDevelopment: false,
    appVersion: '',
  };
}

export { T, t };
export default new Frappe();
