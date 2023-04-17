import { Doc } from 'fyo/model/doc';
import { DocMap, ModelMap, SinglesMap } from 'fyo/model/types';
import { coreModels } from 'fyo/models';
import { NotFoundError, ValueError } from 'fyo/utils/errors';
import Observable from 'fyo/utils/observable';
import { Schema } from 'schemas/types';
import { getRandomString } from 'utils';
import { Fyo } from '..';
import { DocValueMap, RawValueMap } from './types';

export class DocHandler {
  fyo: Fyo;
  models: ModelMap = {};
  singles: SinglesMap = {};
  docs: Observable<DocMap | undefined> = new Observable();
  observer: Observable<never> = new Observable();
  #temporaryNameCounters: Record<string, number>;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
    this.#temporaryNameCounters = {};
  }

  init() {
    this.models = {};
    this.singles = {};
    this.docs = new Observable();
    this.observer = new Observable();
  }

  async purgeCache() {
    this.init();
  }

  registerModels(models: ModelMap, regionalModels: ModelMap = {}) {
    for (const schemaName in this.fyo.db.schemaMap) {
      if (coreModels[schemaName] !== undefined) {
        this.models[schemaName] = coreModels[schemaName];
      } else if (regionalModels[schemaName] !== undefined) {
        this.models[schemaName] = regionalModels[schemaName];
      } else if (models[schemaName] !== undefined) {
        this.models[schemaName] = models[schemaName];
      } else {
        this.models[schemaName] = Doc;
      }
    }
  }

  /**
   * Doc Operations
   */

  async getDoc(
    schemaName: string,
    name?: string,
    options = { skipDocumentCache: false }
  ) {
    if (name === undefined) {
      name = schemaName;
    }

    if (name === schemaName && !this.fyo.schemaMap[schemaName]?.isSingle) {
      throw new ValueError(`${schemaName} is not a Single Schema`);
    }

    let doc: Doc | undefined;
    if (!options?.skipDocumentCache) {
      doc = this.#getFromCache(schemaName, name);
    }

    if (doc) {
      return doc;
    }

    doc = this.getNewDoc(schemaName, { name }, false);
    await doc.load();
    this.#addToCache(doc);

    return doc;
  }

  getNewDoc(
    schemaName: string,
    data: DocValueMap | RawValueMap = {},
    cacheDoc: boolean = true,
    schema?: Schema,
    Model?: typeof Doc,
    isRawValueMap: boolean = true
  ): Doc {
    if (!this.models[schemaName] && Model) {
      this.models[schemaName] = Model;
    }

    Model ??= this.models[schemaName];
    schema ??= this.fyo.schemaMap[schemaName];

    if (schema === undefined) {
      throw new NotFoundError(`Schema not found for ${schemaName}`);
    }

    const doc = new Model!(schema, data, this.fyo, isRawValueMap);
    doc.name ??= this.getTemporaryName(schema);
    if (cacheDoc) {
      this.#addToCache(doc);
    }

    return doc;
  }

  isTemporaryName(name: string, schema: Schema): boolean {
    const label = schema.label ?? schema.name;
    const template = this.fyo.t`New ${label} `;
    return name.includes(template);
  }

  getTemporaryName(schema: Schema): string {
    if (schema.naming === 'random') {
      return getRandomString();
    }

    this.#temporaryNameCounters[schema.name] ??= 1;

    const idx = this.#temporaryNameCounters[schema.name];
    this.#temporaryNameCounters[schema.name] = idx + 1;
    const label = schema.label ?? schema.name;

    return this.fyo.t`New ${label} ${String(idx).padStart(2, '0')}`;
  }

  /**
   * Cache operations
   */

  #addToCache(doc: Doc) {
    if (!doc.name) {
      return;
    }

    const name = doc.name;
    const schemaName = doc.schemaName;

    if (!this.docs[schemaName]) {
      this.docs.set(schemaName, {});
      this.#setCacheUpdationListeners(schemaName);
    }

    this.docs.get(schemaName)![name] = doc;

    // singles available as first level objects too
    if (schemaName === doc.name) {
      this.singles[name] = doc;
    }

    // propagate change to `docs`
    doc.on('change', (params: unknown) => {
      this.docs!.trigger('change', params);
    });

    doc.on('afterSync', () => {
      if (doc.name === name && this.#cacheHas(schemaName, name)) {
        return;
      }

      this.removeFromCache(doc.schemaName, name);
      this.#addToCache(doc);
    });
  }

  #setCacheUpdationListeners(schemaName: string) {
    this.fyo.db.observer.on(`delete:${schemaName}`, (name: string) => {
      this.removeFromCache(schemaName, name);
    });

    this.fyo.db.observer.on(
      `rename:${schemaName}`,
      (names: { oldName: string; newName: string }) => {
        const doc = this.#getFromCache(schemaName, names.oldName);
        if (doc === undefined) {
          return;
        }

        this.removeFromCache(schemaName, names.oldName);
        this.#addToCache(doc);
      }
    );
  }

  removeFromCache(schemaName: string, name: string) {
    const docMap = this.docs.get(schemaName);
    delete docMap?.[name];
  }

  #getFromCache(schemaName: string, name: string): Doc | undefined {
    const docMap = this.docs.get(schemaName);
    return docMap?.[name];
  }

  #cacheHas(schemaName: string, name: string): boolean {
    return !!this.#getFromCache(schemaName, name);
  }
}
