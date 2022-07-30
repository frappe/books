import { getMoneyMaker, MoneyMaker } from 'pesa';
import { Field } from 'schemas/types';
import { getIsNullOrUndef } from 'utils';
import { markRaw } from 'vue';
import { AuthHandler } from './core/authHandler';
import { DatabaseHandler } from './core/dbHandler';
import { DocHandler } from './core/docHandler';
import { DocValue, FyoConfig } from './core/types';
import { Config } from './demux/config';
import { Doc } from './model/doc';
import { ModelMap } from './model/types';
import { TelemetryManager } from './telemetry/telemetry';
import {
  DEFAULT_CURRENCY,
  DEFAULT_DISPLAY_PRECISION,
  DEFAULT_INTERNAL_PRECISION
} from './utils/consts';
import * as errors from './utils/errors';
import { format } from './utils/format';
import { t, T } from './utils/translation';
import { ErrorLog } from './utils/types';

export class Fyo {
  t = t;
  T = T;

  errors = errors;
  isElectron: boolean;

  pesa: MoneyMaker;

  auth: AuthHandler;
  doc: DocHandler;
  db: DatabaseHandler;

  _initialized: boolean = false;

  errorLog: ErrorLog[] = [];
  temp?: Record<string, unknown>;

  currencyFormatter?: Intl.NumberFormat;
  currencySymbols: Record<string, string | undefined> = {};

  isTest: boolean;
  telemetry: TelemetryManager;
  config: Config;

  constructor(conf: FyoConfig = {}) {
    this.isTest = conf.isTest ?? false;
    this.isElectron = conf.isElectron ?? true;

    this.auth = new AuthHandler(this, conf.AuthDemux);
    this.db = new DatabaseHandler(this, conf.DatabaseDemux);
    this.doc = new DocHandler(this);

    this.pesa = getMoneyMaker({
      currency: DEFAULT_CURRENCY,
      precision: DEFAULT_INTERNAL_PRECISION,
      display: DEFAULT_DISPLAY_PRECISION,
      wrapper: markRaw,
    });

    this.telemetry = new TelemetryManager(this);
    this.config = new Config(this.isElectron && !this.isTest);
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

  format(value: DocValue, field: string | Field, doc?: Doc) {
    return format(value, field, doc ?? null, this);
  }

  async setIsElectron() {
    try {
      const { ipcRenderer } = await import('electron');
      this.isElectron = Boolean(ipcRenderer);
    } catch {
      this.isElectron = false;
    }
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
    await this.doc.getDoc('SystemSettings');
    this._initialized = true;
  }

  async #initializeModules() {
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

  async close() {
    await this.db.close();
    await this.auth.logout();
  }

  getField(schemaName: string, fieldname: string) {
    const schema = this.schemaMap[schemaName];
    return schema?.fields.find((f) => f.fieldname === fieldname);
  }

  async getValue(
    schemaName: string,
    name: string,
    fieldname?: string
  ): Promise<DocValue | Doc[]> {
    if (fieldname === undefined && this.schemaMap[schemaName]?.isSingle) {
      fieldname = name;
      name = schemaName;
    }

    if (getIsNullOrUndef(name) || getIsNullOrUndef(fieldname)) {
      return undefined;
    }

    let doc: Doc;
    let value: DocValue | Doc[];
    try {
      doc = await this.doc.getDoc(schemaName, name);
      value = doc.get(fieldname!);
    } catch (err) {
      value = undefined;
    }

    if (value === undefined && schemaName === name) {
      const sv = await this.db.getSingleValues({
        fieldname: fieldname!,
        parent: schemaName,
      });

      return sv?.[0]?.value;
    }

    return value;
  }

  async purgeCache() {
    this.pesa = getMoneyMaker({
      currency: DEFAULT_CURRENCY,
      precision: DEFAULT_INTERNAL_PRECISION,
      display: DEFAULT_DISPLAY_PRECISION,
      wrapper: markRaw,
    });

    this._initialized = false;
    this.temp = {};
    this.currencyFormatter = undefined;
    this.currencySymbols = {};
    this.errorLog = [];
    this.temp = {};
    await this.db.purgeCache();
    await this.auth.purgeCache();
    await this.doc.purgeCache();
  }

  store = {
    isDevelopment: false,
    skipTelemetryLogging: false,
    appVersion: '',
    platform: '',
    language: '',
    instanceId: '',
    deviceId: '',
    openCount: -1,
  };
}

export { T, t };
