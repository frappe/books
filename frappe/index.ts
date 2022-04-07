import { ErrorLog } from '@/errorHandling';
import { getMoneyMaker, MoneyMaker } from 'pesa';
import { markRaw } from 'vue';
import { AuthHandler } from './core/authHandler';
import { DatabaseHandler } from './core/dbHandler';
import { DocHandler } from './core/docHandler';
import { DatabaseDemuxConstructor } from './core/types';
import { ModelMap } from './model/types';
import coreModels from './models';
import {
  DEFAULT_DISPLAY_PRECISION,
  DEFAULT_INTERNAL_PRECISION,
} from './utils/consts';
import * as errors from './utils/errors';
import { format } from './utils/format';
import { t, T } from './utils/translation';

/**
 * Terminology
 * - Schema: object that defines shape of the data in the database
 * - Model: the controller class that extends the Doc class or the Doc
 *    class itself.
 * - Doc: instance of a Model, i.e. what has the data.
 */

export class Frappe {
  t = t;
  T = T;
  format = format;

  errors = errors;
  isElectron = false;

  pesa: MoneyMaker;

  auth: AuthHandler;
  doc: DocHandler;
  db: DatabaseHandler;

  _initialized: boolean = false;

  errorLog?: ErrorLog[];
  methods?: Record<string, Function>;
  temp?: Record<string, unknown>;

  constructor(DatabaseDemux?: DatabaseDemuxConstructor) {
    /**
     * `DatabaseManager` can be passed as the `DatabaseDemux` for
     * testing this class without API or IPC calls.
     */
    this.auth = new AuthHandler(this);
    this.db = new DatabaseHandler(this, DatabaseDemux);
    this.doc = new DocHandler(this);

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

  get schemaMap() {
    return this.db.schemaMap;
  }

  async initializeAndRegister(
    customModels: ModelMap = {},
    force: boolean = false
  ) {
    await this.init(force);

    this.doc.registerModels(coreModels as ModelMap);
    this.doc.registerModels(customModels);
  }

  async init(force?: boolean) {
    if (this._initialized && !force) return;

    this.methods = {};
    this.errorLog = [];

    // temp params while calling routes
    this.temp = {};

    await this.doc.init();
    await this.auth.init();
    await this.db.init();
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
