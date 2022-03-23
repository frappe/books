import { Field, Model } from '@/types/model';
import Doc from 'frappe/model/document';
import Meta from 'frappe/model/meta';
import { getDuplicates, getRandomString } from 'frappe/utils';
import Observable from 'frappe/utils/observable';
import { Frappe } from './frappe';

type DocMap = Record<string, Doc | undefined>;
type MetaMap = Record<string, Meta | undefined>;
interface DocData {
  doctype: string;
  name?: string;
  [key: string]: unknown;
}

export class DocHandler {
  frappe: Frappe;
  singles: DocMap = {};
  metaCache: MetaMap = {};
  docs?: Observable<Doc>;
  models: Record<string, Model | undefined> = {};

  constructor(frappe: Frappe) {
    this.frappe = frappe;
  }

  init() {
    this.models = {};
    this.metaCache = {};
    this.docs = new Observable();
  }

  registerModels(models: Record<string, Model>) {
    for (const doctype in models) {
      const metaDefinition = models[doctype];
      if (!metaDefinition.name) {
        throw new Error(`Name is mandatory for ${doctype}`);
      }

      if (metaDefinition.name !== doctype) {
        throw new Error(
          `Model name mismatch for ${doctype}: ${metaDefinition.name}`
        );
      }

      const fieldnames = (metaDefinition.fields || [])
        .map((df) => df.fieldname)
        .sort();

      const duplicateFieldnames = getDuplicates(fieldnames);
      if (duplicateFieldnames.length > 0) {
        throw new Error(
          `Duplicate fields in ${doctype}: ${duplicateFieldnames.join(', ')}`
        );
      }

      this.models[doctype] = metaDefinition;
    }
  }

  getModels(filterFunction: (name: Model) => boolean): Model[] {
    const models: Model[] = [];
    for (const doctype in this.models) {
      models.push(this.models[doctype]!);
    }
    return filterFunction ? models.filter(filterFunction) : models;
  }

  /**
   * Cache operations
   */

  addToCache(doc: Doc) {
    if (!this.docs) return;

    // add to `docs` cache
    const name = doc.name as string | undefined;
    const doctype = doc.doctype as string | undefined;

    if (!doctype || !name) {
      return;
    }

    if (!this.docs[doctype]) {
      this.docs[doctype] = {};
    }

    (this.docs[doctype] as DocMap)[name] = doc;

    // singles available as first level objects too
    if (doctype === doc.name) {
      this.singles[name] = doc;
    }

    // propogate change to `docs`
    doc.on('change', (params: unknown) => {
      this.docs!.trigger('change', params);
    });
  }

  removeFromCache(doctype: string, name: string) {
    const docMap = this.docs?.[doctype] as DocMap | undefined;
    const doc = docMap?.[name];

    if (doc) {
      delete docMap[name];
    } else {
      console.warn(`Document ${doctype} ${name} does not exist`);
    }
  }

  getDocFromCache(doctype: string, name: string): Doc | undefined {
    const doc = (this.docs?.[doctype] as DocMap)?.[name];
    return doc;
  }

  isDirty(doctype: string, name: string) {
    const doc = (this.docs?.[doctype] as DocMap)?.[name];
    if (doc === undefined) {
      return false;
    }

    return !!doc._dirty;
  }

  /**
   * Meta Operations
   */

  getMeta(doctype: string): Meta {
    const meta = this.metaCache[doctype];
    if (meta) {
      return meta;
    }

    const model = this.models?.[doctype];
    if (!model) {
      throw new Error(`${doctype} is not a registered doctype`);
    }

    this.metaCache[doctype] = new this.frappe.Meta!(model);
    return this.metaCache[doctype]!;
  }

  createMeta(fields: Field[]) {
    return new this.frappe.Meta!({ isCustom: 1, fields });
  }

  /**
   * Doc Operations
   */

  async getDoc(
    doctype: string,
    name: string,
    options = { skipDocumentCache: false }
  ) {
    let doc = null;
    if (!options?.skipDocumentCache) {
      doc = this.getDocFromCache(doctype, name);
    }

    if (doc) {
      return doc;
    }

    const DocClass = this.getDocumentClass(doctype);
    doc = new DocClass({
      doctype: doctype,
      name: name,
    });

    await doc.load();
    this.addToCache(doc);

    return doc;
  }

  getDocumentClass(doctype: string): typeof Doc {
    const meta = this.getMeta(doctype);
    let documentClass = this.frappe.Document!;
    if (meta && meta.documentClass) {
      documentClass = meta.documentClass as typeof Doc;
    }

    return documentClass;
  }

  async getSingle(doctype: string) {
    return await this.getDoc(doctype, doctype);
  }

  async getDuplicate(doc: Doc) {
    const doctype = doc.doctype as string;
    const newDoc = await this.getEmptyDoc(doctype);
    const meta = this.getMeta(doctype);

    const fields = meta.getValidFields() as Field[];

    for (const field of fields) {
      if (['name', 'submitted'].includes(field.fieldname)) {
        continue;
      }

      newDoc[field.fieldname] = doc[field.fieldname];
      if (field.fieldtype === 'Table') {
        const value = (doc[field.fieldname] as DocData[]) || [];
        newDoc[field.fieldname] = value.map((d) => {
          const childData = Object.assign({}, d);
          childData.name = '';
          return childData;
        });
      }
    }
    return newDoc;
  }

  getEmptyDoc(doctype: string, cacheDoc: boolean = true): Doc {
    const doc = this.getNewDoc({ doctype });
    doc._notInserted = true;
    doc.name = getRandomString();

    if (cacheDoc) {
      this.addToCache(doc);
    }

    return doc;
  }

  getNewDoc(data: DocData): Doc {
    const DocClass = this.getDocumentClass(data.doctype);
    const doc = new DocClass(data);
    doc.setDefaults();
    return doc;
  }

  async syncDoc(data: DocData) {
    let doc;
    const { doctype, name } = data;
    if (!doctype || !name) {
      return;
    }

    const docExists = await this.frappe.db.exists(doctype, name);
    if (docExists) {
      doc = await this.getDoc(doctype, name);
      Object.assign(doc, data);
      await doc.update();
    } else {
      doc = this.getNewDoc(data);
      await doc.insert();
    }
  }
}
