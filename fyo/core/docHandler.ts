import Doc from 'fyo/model/doc';
import { DocMap, ModelMap, SinglesMap } from 'fyo/model/types';
import { coreModels } from 'fyo/models';
import Observable from 'fyo/utils/observable';
import { Schema } from 'schemas/types';
import { getRandomString } from 'utils';
import { Fyo } from '..';
import { DocValue, DocValueMap } from './types';

export class DocHandler {
  fyo: Fyo;
  singles: SinglesMap = {};
  docs: Observable<DocMap> = new Observable();
  models: ModelMap = {};

  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  init() {
    this.models = {};
    this.singles = {};
    this.docs = new Observable();
  }

  purgeCache() {
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
   * Cache operations
   */

  addToCache(doc: Doc) {
    if (!this.docs) {
      return;
    }

    // add to `docs` cache
    const name = doc.name;
    const schemaName = doc.schemaName;

    if (!name) {
      return;
    }

    if (!this.docs[schemaName]) {
      this.docs[schemaName] = {};
    }

    (this.docs[schemaName] as DocMap)[name] = doc;

    // singles available as first level objects too
    if (schemaName === doc.name) {
      this.singles[name] = doc;
    }

    // propagate change to `docs`
    doc.on('change', (params: unknown) => {
      this.docs!.trigger('change', params);
    });
  }

  removeFromCache(schemaName: string, name: string) {
    const docMap = this.docs[schemaName] as DocMap | undefined;
    delete docMap?.[name];
  }

  getFromCache(schemaName: string, name: string): Doc | undefined {
    const docMap = this.docs[schemaName] as DocMap | undefined;
    return docMap?.[name];
  }

  getCachedValue(
    schemaName: string,
    name: string,
    fieldname: string
  ): DocValue | Doc[] | undefined {
    const docMap = this.docs[schemaName] as DocMap;
    const doc = docMap[name];
    if (doc === undefined) {
      return;
    }

    return doc.get(fieldname);
  }

  isDirty(schemaName: string, name: string): boolean {
    const doc = (this.docs?.[schemaName] as DocMap)?.[name];
    if (doc === undefined) {
      return false;
    }

    return doc.dirty;
  }

  /**
   * Doc Operations
   */

  async getDoc(
    schemaName: string,
    name: string,
    options = { skipDocumentCache: false }
  ) {
    let doc: Doc | undefined;
    if (!options?.skipDocumentCache) {
      doc = this.getFromCache(schemaName, name);
    }

    if (doc) {
      return doc;
    }

    doc = this.getNewDoc(schemaName, { name });
    await doc.load();
    this.addToCache(doc);

    return doc;
  }

  getModel(schemaName: string): typeof Doc {
    const Model = this.models[schemaName];
    if (Model === undefined) {
      return Doc;
    }

    return Model;
  }

  async getSingle(schemaName: string) {
    return await this.getDoc(schemaName, schemaName);
  }

  async getDuplicate(doc: Doc): Promise<Doc> {
    const newDoc = await doc.duplicate(false);
    delete newDoc.name;
    return newDoc;
  }

  getEmptyDoc(schemaName: string, cacheDoc: boolean = true): Doc {
    const doc = this.getNewDoc(schemaName);
    doc.name = getRandomString();

    if (cacheDoc) {
      this.addToCache(doc);
    }

    return doc;
  }

  getNewDoc(
    schemaName: string,
    data: DocValueMap = {},
    schema?: Schema,
    Model?: typeof Doc
  ): Doc {
    Model ??= this.getModel(schemaName);
    schema ??= this.fyo.schemaMap[schemaName];
    if (schema === undefined) {
      throw new Error(`Schema not found for ${schemaName}`);
    }

    const doc = new Model(schema, data, this.fyo);
    doc.setDefaults();
    return doc;
  }

  async syncDoc(schemaName: string, data: DocValueMap) {
    const name = data.name as string | undefined;
    if (name === undefined) {
      return;
    }

    const docExists = await this.fyo.db.exists(schemaName, name);
    if (!docExists) {
      const doc = this.getNewDoc(schemaName, data);
      await doc.insert;
      return;
    }

    const doc = await this.getDoc(schemaName, name);
    await doc.setMultiple(data);
    await doc.update();
  }
}
