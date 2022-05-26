import { t } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { Dictionary, groupBy } from 'lodash';
import { ModelNameEnum } from 'models/types';
import { reports } from 'reports';
import { OptionField } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { GetAllOptions } from 'utils/db/types';
import { fuzzyMatch } from '.';
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

interface DocSearchItem extends SearchItem {
  schemaLabel: string;
  more: string[];
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
  const hasGstin = !!fyo.singles?.AccountingSettings?.gstin;
  return Object.keys(reports)
    .filter((r) => {
      const report = reports[r];
      if (report.title.startsWith('GST') && !hasGstin) {
        return false;
      }
      return true;
    })
    .map((r) => {
      const report = reports[r];
      return {
        label: report.title,
        route: `/report/${r}`,
        group: 'Report',
      };
    });
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

  _groupedKeywords?: Dictionary<Keyword[]>;

  constructor() {
    this.keywords = {};
  }

  get groupedKeywords() {
    if (!this._groupedKeywords || !Object.keys(this._groupedKeywords!).length) {
      this._groupedKeywords = this.getGroupedKeywords();
    }

    return this._groupedKeywords!;
  }

  search(keyword: string /*, array: DocSearchItem[]*/): DocSearchItem[] {
    const array: DocSearchItem[] = [];
    if (!keyword) {
      return [];
    }

    const groupedKeywords = this.groupedKeywords;
    const keys = Object.keys(groupedKeywords).sort(
      (a, b) => parseFloat(b) - parseFloat(a)
    );

    for (const key of keys) {
      for (const kw of groupedKeywords[key]) {
        let isMatch = false;
        for (const word of kw.values) {
          isMatch ||= fuzzyMatch(keyword, word).isMatch;
          if (isMatch) {
            break;
          }
        }

        if (!isMatch) {
          continue;
        }

        array.push({
          label: kw.values[0],
          schemaLabel: fyo.schemaMap[kw.meta.schemaName as string]?.label!,
          more: kw.values.slice(1),
          group: 'Docs',
          action: () => {
            console.log('selected', kw);
          },
        });
      }
    }
    return array;
  }

  getGroupedKeywords() {
    const keywords = Object.values(this.keywords);
    return groupBy(keywords.map((kw) => kw.keywords).flat(), 'priority');
  }

  async fetchKeywords() {
    const searchables = this._getSearchables();
    for (const searchable of searchables) {
      const options: GetAllOptions = {
        fields: [searchable.fields, searchable.meta].flat(),
        order: 'desc',
      };

      if (!searchable.isChild) {
        options.orderBy = 'modified';
      }

      const maps = await fyo.db.getAllRaw(searchable.schemaName, options);
      this._addToSearchable(maps, searchable);
    }

    this._setPriority();
  }

  _getSearchables(): Searchable[] {
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

  _setPriority() {
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

  _addToSearchable(maps: DocValueMap[], searchable: Searchable) {
    if (!maps.length) {
      return;
    }

    this.keywords[searchable.schemaName] ??= { searchable, keywords: [] };

    for (const map of maps) {
      const keyword: Keyword = { values: [], meta: {}, priority: 0 };
      this._setKeywords(map, searchable, keyword);
      this._setMeta(map, searchable, keyword);
      this.keywords[searchable.schemaName]!.keywords.push(keyword);
    }
  }

  _setKeywords(map: DocValueMap, searchable: Searchable, keyword: Keyword) {
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

  _setMeta(map: DocValueMap, searchable: Searchable, keyword: Keyword) {
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

export const docSearch = new Search();

if (fyo.store.isDevelopment) {
  //@ts-ignore
  window.search = docSearch;
}
