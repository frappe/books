import { t } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { ModelNameEnum } from 'models/types';
import { OptionField } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { GetAllOptions } from 'utils/db/types';
import { routeTo } from './ui';

export const searchGroups = ['Docs', 'List', 'Create', 'Report', 'Page'];
enum SearchGroupEnum {
  'List' = 'List',
  'Report' = 'Report',
  'Create' = 'Create',
  'Page' = 'Page',
  'Docs' = 'Docs',
}

type SearchGroup = keyof typeof SearchGroupEnum;
interface SearchItem {
  label: string;
  group: SearchGroup;
  route?: string;
  action?: () => void;
}

async function openQuickEditDoc(schemaName: string) {
  await routeTo(`/list/${schemaName}`);
  const doc = await fyo.doc.getNewDoc(schemaName);
  const { openQuickEdit } = await import('src/utils/ui');

  await openQuickEdit({
    schemaName,
    name: doc.name as string,
  });
}

async function openFormEditDoc(schemaName: string) {
  const doc = fyo.doc.getNewDoc(schemaName);
  const name = doc.name;

  routeTo(`/edit/${schemaName}/${name}`);
}

function getCreateList(): SearchItem[] {
  const quickEditCreateList = [
    ModelNameEnum.Item,
    ModelNameEnum.Party,
    ModelNameEnum.Payment,
  ].map(
    (schemaName) =>
      ({
        label: fyo.schemaMap[schemaName]?.label,
        group: 'Create',
        action() {
          openQuickEditDoc(schemaName);
        },
      } as SearchItem)
  );

  const formEditCreateList = [
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.PurchaseInvoice,
    ModelNameEnum.JournalEntry,
  ].map(
    (schemaName) =>
      ({
        label: fyo.schemaMap[schemaName]?.label,
        group: 'Create',
        action() {
          openFormEditDoc(schemaName);
        },
      } as SearchItem)
  );

  const filteredCreateList = [
    {
      label: t`Customers`,
      schemaName: ModelNameEnum.Party,
      filter: { role: 'Customer' },
    },
    {
      label: t`Suppliers`,
      schemaName: ModelNameEnum.Party,
      filter: { role: 'Supplier' },
    },
    {
      label: t`Sales Items`,
      schemaName: ModelNameEnum.Item,
      filter: { for: 'Sales' },
    },
    {
      label: t`Purchase Items`,
      schemaName: ModelNameEnum.Item,
      filter: { for: 'Purchases' },
    },
    {
      label: t`Common Items`,
      schemaName: ModelNameEnum.Item,
      filter: { for: 'Both' },
    },
  ].map(({ label, filter, schemaName }) => {
    const fk = Object.keys(filter)[0] as 'for' | 'role';
    const ep = `${fk}/${filter[fk]}`;

    const route = `/list/${schemaName}/${ep}/${label}`;
    return {
      label,
      group: 'Create',
      async action() {
        await routeTo(route);
        const doc = await fyo.doc.getNewDoc(schemaName, filter);
        const { openQuickEdit } = await import('src/utils/ui');
        await openQuickEdit({
          schemaName,
          name: doc.name as string,
        });
      },
    } as SearchItem;
  });

  return [quickEditCreateList, formEditCreateList, filteredCreateList].flat();
}

function getReportList(): SearchItem[] {
  /*return Object.values(reports).map((report) => {
    return {
      label: report.title,
      route: `/report/${report.method}`,
      group: 'Report',
    };
  });
  */
  return [];
}

function getListViewList(): SearchItem[] {
  let schemaNames = [
    ModelNameEnum.Account,
    ModelNameEnum.Party,
    ModelNameEnum.Payment,
    ModelNameEnum.JournalEntry,
    ModelNameEnum.PurchaseInvoice,
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.Tax,
  ];

  if (fyo.store.isDevelopment) {
    schemaNames = Object.keys(fyo.schemaMap) as ModelNameEnum[];
  }
  const standardLists = schemaNames
    .map((s) => fyo.schemaMap[s])
    .filter((s) => s && !s.isChild && !s.isSingle)
    .map(
      (s) =>
        ({
          label: s!.label,
          route: `/list/${s!.name}`,
          group: 'List',
        } as SearchItem)
    );

  const filteredLists = [
    { label: t`Customers`, route: `/list/Party/role/Customer/${t`Customers`}` },
    { label: t`Suppliers`, route: `/list/Party/role/Supplier/${t`Suppliers`}` },
    {
      label: t`Sales Items`,
      route: `/list/Item/for/Sales/${t`Sales Items`}`,
    },
    {
      label: t`Sales Payments`,
      route: `/list/Payment/paymentType/Receive/${t`Sales Payments`}`,
    },
    {
      label: t`Purchase Items`,
      route: `/list/Item/for/Purchases/${t`Purchase Items`}`,
    },
    {
      label: t`Common Items`,
      route: `/list/Item/for/Both/${t`Common Items`}`,
    },
    {
      label: t`Purchase Payments`,
      route: `/list/Payment/paymentType/Pay/${t`Purchase Payments`}`,
    },
  ].map((i) => ({ ...i, group: 'List' } as SearchItem));

  return [standardLists, filteredLists].flat();
}

function getSetupList(): SearchItem[] {
  return [
    {
      label: t`Dashboard`,
      route: '/',
      group: 'Page',
    },
    {
      label: t`Chart of Accounts`,
      route: '/chart-of-accounts',
      group: 'Page',
    },
    {
      label: t`Data Import`,
      route: '/data-import',
      group: 'Page',
    },
    {
      label: t`Settings`,
      route: '/settings',
      group: 'Page',
    },
  ];
}

export function getSearchList() {
  return [
    getListViewList(),
    getCreateList(),
    getReportList(),
    getSetupList(),
  ].flat();
}

interface Searchable {
  schemaName: string;
  fields: string[];
  meta: string[];
  isChild: boolean;
  isSubmittable: boolean;
}

interface Keyword {
  values: string[];
  meta: Record<string, string | boolean | undefined>;
  priority: number;
}

interface Keywords {
  searchable: Searchable;
  keywords: Keyword[];
}

class Search {
  keywords: Record<string, Keywords>;
  priorityMap: Record<string, number> = {
    [ModelNameEnum.SalesInvoice]: 125,
    [ModelNameEnum.PurchaseInvoice]: 100,
    [ModelNameEnum.Payment]: 75,
    [ModelNameEnum.Item]: 50,
    [ModelNameEnum.Party]: 50,
    [ModelNameEnum.JournalEntry]: 50,
  };

  constructor() {
    this.keywords = {};
  }

  getSearchList() {
    const keywords = Object.values(this.keywords);
    return keywords.map((kw) => kw.keywords).flat();
  }

  async fetchKeywords() {
    const searchables = this.#getSearchables();
    for (const searchable of searchables) {
      const options: GetAllOptions = {
        fields: [searchable.fields, searchable.meta].flat(),
        order: 'desc',
      };

      if (!searchable.isChild) {
        options.orderBy = 'modified';
      }

      const maps = await fyo.db.getAllRaw(searchable.schemaName, options);
      this.addToSearchable(maps, searchable);
    }

    this.#setPriority();
  }

  #getSearchables(): Searchable[] {
    const searchable: Searchable[] = [];
    for (const schemaName of Object.keys(fyo.schemaMap)) {
      const schema = fyo.schemaMap[schemaName];
      if (!schema?.keywordFields?.length) {
        continue;
      }

      const fields = [...schema.keywordFields];
      const meta = [];
      if (schema.isChild) {
        meta.push('parent', 'parentSchemaName');
      }

      if (schema.isSubmittable) {
        meta.push('submitted', 'cancelled');
      }

      searchable.push({
        schemaName,
        fields,
        meta,
        isChild: !!schema.isChild,
        isSubmittable: !!schema.isSubmittable,
      });
    }

    return searchable;
  }

  #setPriority() {
    for (const schemaName in this.keywords) {
      const kw = this.keywords[schemaName];
      const basePriority = this.priorityMap[schemaName] ?? 0;

      for (const k of kw.keywords) {
        k.priority += basePriority;

        if (k.meta.submitted) {
          k.priority += 25;
        }

        if (k.meta.cancelled) {
          k.priority -= 200;
        }

        if (kw.searchable.isChild) {
          k.priority -= 150;
        }
      }
    }
  }

  addToSearchable(maps: DocValueMap[], searchable: Searchable) {
    if (!maps.length) {
      return;
    }

    this.keywords[searchable.schemaName] ??= { searchable, keywords: [] };

    for (const map of maps) {
      const keyword: Keyword = { values: [], meta: {}, priority: 0 };
      this.#setKeywords(map, searchable, keyword);
      this.#setMeta(map, searchable, keyword);
      this.keywords[searchable.schemaName]!.keywords.push(keyword);
    }
  }

  #setKeywords(map: DocValueMap, searchable: Searchable, keyword: Keyword) {
    // Set individual field values
    for (const fn of searchable.fields) {
      let value = map[fn] as string | undefined;
      const field = fyo.getField(searchable.schemaName, fn);
      const { options } = field as OptionField;
      if (options) {
        value = options.find((o) => o.value === value)?.label ?? value;
      }

      keyword.values.push(value ?? '');
    }
  }

  #setMeta(map: DocValueMap, searchable: Searchable, keyword: Keyword) {
    // Set the meta map
    for (const fn of searchable.meta) {
      const meta = map[fn];
      if (typeof meta === 'number') {
        keyword.meta[fn] = Boolean(meta);
      } else if (typeof meta === 'string') {
        keyword.meta[fn] = meta;
      }
    }

    keyword.meta.schemaName = searchable.schemaName;
  }
}

//@ts-ignore
window.sc = new Search();
