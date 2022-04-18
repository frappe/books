import { getMoneyMaker, MoneyMaker } from 'pesa';
import { markRaw } from 'vue';
import { AuthHandler } from './core/authHandler';
import { DatabaseHandler } from './core/dbHandler';
import { DocHandler } from './core/docHandler';
import { DatabaseDemuxConstructor } from './core/types';
import { ModelMap } from './model/types';
import {
  DEFAULT_CURRENCY,
  DEFAULT_DISPLAY_PRECISION,
  DEFAULT_INTERNAL_PRECISION,
} from './utils/consts';
import * as errors from './utils/errors';
import { format } from './utils/format';
import { t, T } from './utils/translation';
import { ErrorLog } from './utils/types';

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

  currencyFormatter?: Intl.NumberFormat;
  currencySymbols: Record<string, string | undefined> = {};

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

  get singles() {
    return this.doc.singles;
  }

  get schemaMap() {
    return this.db.schemaMap;
  }

  async initializeAndRegister(
    models: ModelMap = {},
    regionalModels: ModelMap = {},
    force: boolean = false
  ) {
    if (this._initialized && !force) return;

    await this.#initializeModules();
    await this.#initializeMoneyMaker();

    this.doc.registerModels(models, regionalModels);
    await this.doc.getSingle('SystemSettings');
    this._initialized = true;
  }

  async #initializeModules() {
    this.methods = {};
    this.errorLog = [];

    // temp params while calling routes
    this.temp = {};

    await this.doc.init();
    await this.auth.init();
    await this.db.init();
  }

  async #initializeMoneyMaker() {
    const values =
      (await this.db?.getSingleValues(
        {
          fieldname: 'internalPrecision',
          parent: 'SystemSettings',
        },
        {
          fieldname: 'displayPrecision',
          parent: 'SystemSettings',
        },
        {
          fieldname: 'currency',
          parent: 'SystemSettings',
        }
      )) ?? [];

    const acc = values.reduce((acc, sv) => {
      acc[sv.fieldname] = sv.value as string | number | undefined;
      return acc;
    }, {} as Record<string, string | number | undefined>);

    const precision: number =
      (acc.internalPrecision as number) ?? DEFAULT_INTERNAL_PRECISION;
    const display: number =
      (acc.displayPrecision as number) ?? DEFAULT_DISPLAY_PRECISION;
    const currency: string = (acc.currency as string) ?? DEFAULT_CURRENCY;

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
