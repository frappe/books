import { Fyo, t } from 'fyo';
import { RawValueMap } from 'fyo/core/types';
import { groupBy } from 'lodash';
import { ModelNameEnum } from 'models/types';
import { reports } from 'reports';
import { OptionField } from 'schemas/types';
import { createFilters, routeFilters } from 'src/utils/filters';
import { GetAllOptions } from 'utils/db/types';
import { safeParseFloat } from 'utils/index';
import { RouteLocationRaw } from 'vue-router';
import { fuzzyMatch } from '.';
import { getFormRoute, routeTo } from './ui';
import { searchGroups } from '../../utils/types';
import type { SearchGroup, SearchItem } from '../../utils/types';

export { searchGroups };
export type { SearchGroup, SearchItem };

interface StoredRecentItem {
  label: string;
  group: string;
  route?: string;
  schemaName?: string;
  reportName?: string;
  initData?: RawValueMap;
  timestamp: number;
}

interface DocSearchItem extends Omit<SearchItem, 'group'> {
  group: 'Docs';
  schemaLabel: string;
  more: string[];
}

interface RecentSearchItem extends Omit<SearchItem, 'group'> {
  group: 'Recent';
}

export type SearchItems = (DocSearchItem | SearchItem | RecentSearchItem)[];

interface Searchable {
  needsUpdate: boolean;
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

interface SearchFilters {
  groupFilters: Record<SearchGroup, boolean>;
  skipTables: boolean;
  skipTransactions: boolean;
  schemaFilters: Record<string, boolean>;
}

interface SearchIntermediate {
  suggestions: SearchItems;
  previousInput?: string;
}

export function getGroupLabelMap() {
  return {
    Create: t`Create`,
    List: t`List`,
    Report: t`Report`,
    Docs: t`Docs`,
    Page: t`Page`,
    Recent: t`Recent`,
  };
}

function getCreateAction(fyo: Fyo, schemaName: string, initData?: RawValueMap) {
  return async function action() {
    const doc = fyo.doc.getNewDoc(schemaName, initData);
    const route = getFormRoute(schemaName, doc.name!);
    await routeTo(route);
  };
}

function getCreateList(fyo: Fyo): SearchItem[] {
  const hasInventory = fyo.doc.singles.AccountingSettings?.enableInventory;
  const formEditCreateList = [
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.PurchaseInvoice,
    ModelNameEnum.JournalEntry,
    ...(hasInventory
      ? [
          ModelNameEnum.Shipment,
          ModelNameEnum.PurchaseReceipt,
          ModelNameEnum.StockMovement,
        ]
      : []),
  ].map(
    (schemaName) =>
      ({
        label: fyo.schemaMap[schemaName]?.label,
        group: 'Create',
        action: getCreateAction(fyo, schemaName),
        schemaName,
      } as SearchItem)
  );

  const filteredCreateList = [
    {
      label: t`Sales Payment`,
      schemaName: ModelNameEnum.Payment,
      create: createFilters.SalesPayments,
    },
    {
      label: t`Purchase Payment`,
      schemaName: ModelNameEnum.Payment,
      create: createFilters.PurchasePayments,
    },
    {
      label: t`Customer`,
      schemaName: ModelNameEnum.Party,
      create: createFilters.Customers,
    },
    {
      label: t`Supplier`,
      schemaName: ModelNameEnum.Party,
      create: createFilters.Suppliers,
    },
    {
      label: t`Party`,
      schemaName: ModelNameEnum.Party,
      create: createFilters.Party,
    },
    {
      label: t`Sales Item`,
      schemaName: ModelNameEnum.Item,
      create: createFilters.SalesItems,
    },
    {
      label: t`Purchase Item`,
      schemaName: ModelNameEnum.Item,
      create: createFilters.PurchaseItems,
    },
    {
      label: t`Item`,
      schemaName: ModelNameEnum.Item,
      create: createFilters.Items,
    },
  ].map(({ label, create, schemaName }) => {
    return {
      label,
      group: 'Create',
      action: getCreateAction(fyo, schemaName, create),
      schemaName,
      initData: create,
    } as SearchItem;
  });

  return [formEditCreateList, filteredCreateList].flat();
}

function getReportList(fyo: Fyo): SearchItem[] {
  const hasGstin = !!fyo.singles?.AccountingSettings?.gstin;
  const hasInventory = !!fyo.singles?.AccountingSettings?.enableInventory;
  const reportNames = Object.keys(reports) as (keyof typeof reports)[];
  return reportNames
    .filter((r) => {
      const report = reports[r];
      if (report.isInventory && !hasInventory) {
        return false;
      }

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

function getListViewList(fyo: Fyo): SearchItem[] {
  let schemaNames = [
    ModelNameEnum.Account,
    ModelNameEnum.JournalEntry,
    ModelNameEnum.PurchaseInvoice,
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.Tax,
    ModelNameEnum.UOM,
    ModelNameEnum.Address,
    ModelNameEnum.AccountingLedgerEntry,
    ModelNameEnum.Currency,
    ModelNameEnum.NumberSeries,
    ModelNameEnum.PrintTemplate,
  ];

  if (fyo.doc.singles.AccountingSettings?.enableInventory) {
    schemaNames.push(
      ModelNameEnum.StockMovement,
      ModelNameEnum.Shipment,
      ModelNameEnum.PurchaseReceipt,
      ModelNameEnum.Location,
      ModelNameEnum.StockLedgerEntry
    );
  }

  if (fyo.doc.singles.AccountingSettings?.enablePriceList) {
    schemaNames.push(ModelNameEnum.PriceList);
  }

  if (fyo.singles.InventorySettings?.enableBatches) {
    schemaNames.push(ModelNameEnum.Batch);
  }

  if (fyo.singles.InventorySettings?.enableSerialNumber) {
    schemaNames.push(ModelNameEnum.SerialNumber);
  }

  if (fyo.doc.singles.AccountingSettings?.enableFormCustomization) {
    schemaNames.push(ModelNameEnum.CustomForm);
  }

  schemaNames = Object.keys(fyo.schemaMap) as ModelNameEnum[];

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
    {
      label: t`Customers`,
      route: `/list/Party/${t`Customers`}`,
      filters: routeFilters.Customers,
    },
    {
      label: t`Suppliers`,
      route: `/list/Party/${t`Suppliers`}`,
      filters: routeFilters.Suppliers,
    },
    {
      label: t`Party`,
      route: `/list/Party/${t`Party`}`,
      filters: routeFilters.Party,
    },
    {
      label: t`Sales Items`,
      route: `/list/Item/${t`Sales Items`}`,
      filters: routeFilters.SalesItems,
    },
    {
      label: t`Sales Payments`,
      route: `/list/Payment/${t`Sales Payments`}`,
      filters: routeFilters.SalesPayments,
    },
    {
      label: t`Purchase Items`,
      route: `/list/Item/${t`Purchase Items`}`,
      filters: routeFilters.PurchaseItems,
    },
    {
      label: t`Items`,
      route: `/list/Item/${t`Items`}`,
      filters: routeFilters.Items,
    },
    {
      label: t`Purchase Payments`,
      route: `/list/Payment/${t`Purchase Payments`}`,
      filters: routeFilters.PurchasePayments,
    },
  ].map((i) => {
    const label = i.label;
    const route = encodeURI(`${i.route}?filters=${JSON.stringify(i.filters)}`);

    return { label, route, group: 'List' } as SearchItem;
  });

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
      label: t`Import Wizard`,
      route: '/import-wizard',
      group: 'Page',
    },
    {
      label: t`Settings`,
      route: '/settings',
      group: 'Page',
    },
  ];
}

function getNonDocSearchList(fyo: Fyo) {
  return [
    getListViewList(fyo),
    getCreateList(fyo),
    getReportList(fyo),
    getSetupList(),
  ]
    .flat()
    .map((d) => {
      if (d.route && !d.action) {
        d.action = async () => {
          await routeTo(d.route!);
        };
      }
      return d;
    });
}

export class Search {
  /**
   * A simple fuzzy searcher.
   *
   * How the Search works:
   * - Pulls `keywordFields` (string columns) from the db.
   * - `name` or `parent` (parent doc's name) is used as the main
   *   label.
   * - The `name`, `keywordFields` and schema label are used as
   *   search target terms.
   * - Input is split on `' '` (whitespace) and each part has to completely
   *   or partially match the search target terms.
   * - Non matches are ignored.
   * - Each letter in the input narrows the search using the `this._intermediate`
   *   object where the incremental searches are stored.
   * - Search index is marked for updation when a doc is entered or deleted.
   * - Marked indices are rebuilt when the modal is opened.
   */

  _obsSet = false;
  numSearches = 0;
  recentKey = 'searchRecents';
  searchables: Record<string, Searchable>;
  keywords: Record<string, Keyword[]>;
  priorityMap: Record<string, number> = {
    [ModelNameEnum.SalesInvoice]: 125,
    [ModelNameEnum.PurchaseInvoice]: 100,
    [ModelNameEnum.Payment]: 75,
    [ModelNameEnum.StockMovement]: 75,
    [ModelNameEnum.Shipment]: 75,
    [ModelNameEnum.PurchaseReceipt]: 75,
    [ModelNameEnum.Item]: 50,
    [ModelNameEnum.Party]: 50,
    [ModelNameEnum.JournalEntry]: 50,
  };

  filters: SearchFilters = {
    groupFilters: {
      List: true,
      Report: true,
      Create: true,
      Page: true,
      Docs: true,
      Recent: true,
    },
    schemaFilters: {},
    skipTables: false,
    skipTransactions: false,
  };

  fyo: Fyo;

  _intermediate: SearchIntermediate = { suggestions: [] };

  _nonDocSearchList: SearchItem[];
  _groupLabelMap?: Record<SearchGroup, string>;

  maxRecentItems = 10;
  recentExpiryDays = 30;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
    this.keywords = {};
    this.searchables = {};
    this._nonDocSearchList = getNonDocSearchList(fyo);
  }

  /**
   * these getters are used for hacky two way binding between the
   * `skipT*` filters and the `schemaFilters`.
   */

  private _loadAndCleanRecentItems(): StoredRecentItem[] {
    try {
      const raw = localStorage.getItem(this.recentKey);
      return raw ? (JSON.parse(raw) as StoredRecentItem[]) : [];
    } catch (error) {
      return [];
    }
  }

  private _saveRecentItems(items: StoredRecentItem[]) {
    localStorage.setItem(this.recentKey, JSON.stringify(items));
  }

  addToRecent(item: SearchItems[number]) {
    const recents = this._loadAndCleanRecentItems();

    const recentItem: StoredRecentItem = {
      label: item.label,
      group: item.group,
      timestamp: Date.now(),
    };

    if ('route' in item && item.route) {
      recentItem.route = item.route;
    } else if (item.group === 'Docs') {
      recentItem.schemaName = item.schemaLabel;
    } else if (item.group === 'Create') {
      recentItem.schemaName = item.schemaName;
      recentItem.initData = item.initData;
    }

    const updatedRecents = [
      recentItem,
      ...recents.filter((r) => r.label !== recentItem.label),
    ].slice(0, this.maxRecentItems);

    this._saveRecentItems(updatedRecents);
  }

  getRecentItems(searchTerm?: string): RecentSearchItem[] {
    try {
      const recents = this._loadAndCleanRecentItems();

      let filtered = recents;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = recents.filter(
          (item) =>
            item.label.toLowerCase().includes(lower) ||
            item.group.toLowerCase().includes(lower)
        );
      }

      const result = filtered.map((item) => ({
        label: item.label,
        group: 'Recent' as const,
        action: () => this._executeRecentAction(item),
        route: item.route,
      }));

      return result;
    } catch (error) {
      return [];
    }
  }

  private _executeRecentAction(item: StoredRecentItem) {
    if (item.route) {
      void routeTo(item.route);
    } else if (item.schemaName && item.group === 'Create') {
      const action = getCreateAction(this.fyo, item.schemaName, item.initData);
      void action();
    } else if (item.schemaName) {
      this._openDocList(item.schemaName);
    } else if (item.reportName) {
      this._openReport(item.reportName);
    }
  }

  private _openDocList(schemaName: string) {
    const route = `/list/${schemaName}`;
    void routeTo(route);
  }

  private _openReport(reportName: string) {
    const route = `/report/${reportName}`;
    void routeTo(route);
  }

  get skipTables() {
    let value = true;
    for (const val of Object.values(this.searchables)) {
      if (!val.isChild) {
        continue;
      }

      value &&= !this.filters.schemaFilters[val.schemaName];
    }
    return value;
  }

  get skipTransactions() {
    let value = true;
    for (const val of Object.values(this.searchables)) {
      if (!val.isSubmittable) {
        continue;
      }

      value &&= !this.filters.schemaFilters[val.schemaName];
    }
    return value;
  }

  set(filterName: string, value: boolean) {
    /**
     * When a filter is set, intermediate is reset
     * this way the groups are rebuild with the filters
     * applied.
     */

    if (filterName in this.filters.groupFilters) {
      this.filters.groupFilters[filterName as SearchGroup] = value;
    } else if (filterName in this.searchables) {
      this.filters.schemaFilters[filterName] = value;
      this.filters.skipTables = this.skipTables;
      this.filters.skipTransactions = this.skipTransactions;
    } else if (filterName === 'skipTables') {
      Object.values(this.searchables)
        .filter(({ isChild }) => isChild)
        .forEach(({ schemaName }) => {
          this.filters.schemaFilters[schemaName] = !value;
        });
      this.filters.skipTables = value;
    } else if (filterName === 'skipTransactions') {
      Object.values(this.searchables)
        .filter(({ isSubmittable }) => isSubmittable)
        .forEach(({ schemaName }) => {
          this.filters.schemaFilters[schemaName] = !value;
        });
      this.filters.skipTransactions = value;
    }

    this._setIntermediate([]);
  }

  async initializeKeywords() {
    this._setSearchables();
    await this.updateKeywords();
    this._setDocObservers();
    this._setSchemaFilters();
    this._groupLabelMap = getGroupLabelMap();
    this._setFilterDefaults();
  }

  _setFilterDefaults() {
    const totalChildKeywords = Object.values(this.searchables)
      .filter((s) => s.isChild)
      .map((s) => this.keywords[s.schemaName]?.length ?? 0)
      .reduce((a, b) => a + b, 0);

    if (totalChildKeywords > 2_000) {
      this.set('skipTables', true);
    }
  }

  _setSchemaFilters() {
    for (const name in this.searchables) {
      this.filters.schemaFilters[name] = true;
    }
  }

  async updateKeywords() {
    for (const searchable of Object.values(this.searchables)) {
      if (!searchable.needsUpdate) {
        continue;
      }

      const options: GetAllOptions = {
        fields: [searchable.fields, searchable.meta].flat(),
        order: 'desc',
      };

      if (!searchable.isChild) {
        options.orderBy = 'modified';
      }

      const maps = await this.fyo.db.getAllRaw(searchable.schemaName, options);
      this._setKeywords(maps, searchable);
      this.searchables[searchable.schemaName].needsUpdate = false;
    }
  }

  _searchSuggestions(input: string): SearchItems {
    const matches: { si: SearchItems[number]; distance: number }[] = [];

    for (const si of this._intermediate.suggestions) {
      const label = si.label;
      const groupLabel =
        (si as DocSearchItem).schemaLabel || this._groupLabelMap?.[si.group];
      const more = (si as DocSearchItem).more ?? [];
      const values = [label, more, groupLabel]
        .flat()
        .filter(Boolean) as string[];

      const { isMatch, distance } = this._getMatchAndDistance(input, values);

      if (isMatch) {
        matches.push({ si, distance });
      }
    }

    matches.sort((a, b) => a.distance - b.distance);
    const suggestions = matches.map((m) => m.si);
    this._setIntermediate(suggestions, input);
    return suggestions;
  }

  _shouldUseSuggestions(input?: string): boolean {
    if (!input) {
      return false;
    }

    const { suggestions, previousInput } = this._intermediate;
    if (!suggestions?.length || !previousInput) {
      return false;
    }

    if (!input.startsWith(previousInput)) {
      return false;
    }

    return true;
  }

  _setIntermediate(suggestions: SearchItems, previousInput?: string) {
    this.numSearches = suggestions.length;
    this._intermediate.suggestions = suggestions;
    this._intermediate.previousInput = previousInput;
  }

  search(input?: string): SearchItems {
    const useSuggestions = this._shouldUseSuggestions(input);
    /**
     * If the suggestion list is already populated
     * and the input is an extention of the previous
     * then use the suggestions.
     */
    if (useSuggestions) {
      return this._searchSuggestions(input!);
    } else {
      this._setIntermediate([]);
    }

    /**
     * Create the suggestion list.
     */
    const groupedKeywords = this._getGroupedKeywords();
    const keys = Object.keys(groupedKeywords);
    if (!keys.includes('0')) {
      keys.push('0');
    }

    keys.sort((a, b) => safeParseFloat(b) - safeParseFloat(a));
    const array: SearchItems = [];

    const showRecent =
      !input ||
      input.startsWith('#') ||
      input.toLowerCase().startsWith('recent');
    if (showRecent && this.filters.groupFilters.Recent) {
      const recentSearchTerm = input?.replace(/^#|recent/gi, '').trim();
      const recentItems = this.getRecentItems(recentSearchTerm);
      if (recentItems.length > 0) {
        array.push(...recentItems);
      }
    }

    for (const key of keys) {
      const keywords = groupedKeywords[key] ?? [];
      this._pushDocSearchItems(keywords, array, input);
      if (key === '0') {
        this._pushNonDocSearchItems(array, input);
      }
    }

    this._setIntermediate(array, input);
    return array;
  }

  _pushDocSearchItems(keywords: Keyword[], array: SearchItems, input?: string) {
    if (!input) {
      return;
    }

    if (!this.filters.groupFilters.Docs) {
      return;
    }

    const subArray = this._getSubSortedArray(keywords, input);
    array.push(...subArray);
  }

  _pushNonDocSearchItems(array: SearchItems, input?: string) {
    const filtered = this._nonDocSearchList.filter(
      (si) => this.filters.groupFilters[si.group]
    );
    const subArray = this._getSubSortedArray(filtered, input);
    array.push(...subArray);
  }

  _getSubSortedArray(
    items: (SearchItem | Keyword)[],
    input?: string
  ): SearchItems {
    const subArray: { item: SearchItems[number]; distance: number }[] = [];

    for (const item of items) {
      const subArrayItem = this._getSubArrayItem(item, input);
      if (!subArrayItem) {
        continue;
      }

      subArray.push(subArrayItem);
    }

    subArray.sort((a, b) => a.distance - b.distance);
    return subArray.map(({ item }) => item);
  }

  _getSubArrayItem(
    item: SearchItem | Keyword,
    input?: string
  ): { item: SearchItems[number]; distance: number } | null {
    if (isSearchItem(item)) {
      return this._getSubArrayItemFromSearchItem(item, input);
    }

    if (!input) {
      return null;
    }

    return this._getSubArrayItemFromKeyword(item, input);
  }

  _getSubArrayItemFromSearchItem(item: SearchItem, input?: string) {
    if (!input) {
      return { item, distance: 0 };
    }

    const values = this._getValueListFromSearchItem(item).filter(Boolean);
    const { isMatch, distance } = this._getMatchAndDistance(input, values);

    if (!isMatch) {
      return null;
    }

    return { item, distance };
  }

  _getValueListFromSearchItem({ label, group }: SearchItem): string[] {
    return [label, group];
  }

  _getSubArrayItemFromKeyword(item: Keyword, input: string) {
    const values = this._getValueListFromKeyword(item).filter(Boolean);
    const { isMatch, distance } = this._getMatchAndDistance(input, values);

    if (!isMatch) {
      return null;
    }

    return {
      item: this._getDocSearchItemFromKeyword(item),
      distance,
    };
  }

  _getValueListFromKeyword({ values, meta }: Keyword): string[] {
    const schemaLabel = meta.schemaName as string;
    return [values, schemaLabel].flat();
  }

  _getMatchAndDistance(input: string, values: string[]) {
    /**
     * All the parts should match with something.
     */

    let distance = Number.MAX_SAFE_INTEGER;
    for (const part of input.split(' ').filter(Boolean)) {
      const match = this._getInternalMatch(part, values);
      if (!match.isMatch) {
        return { isMatch: false, distance: Number.MAX_SAFE_INTEGER };
      }

      distance = match.distance < distance ? match.distance : distance;
    }

    return { isMatch: true, distance };
  }

  _getInternalMatch(input: string, values: string[]) {
    let isMatch = false;
    let distance = Number.MAX_SAFE_INTEGER;

    for (const k of values) {
      const match = fuzzyMatch(input, k);
      isMatch ||= match.isMatch;

      if (match.distance < distance) {
        distance = match.distance;
      }
    }

    return { isMatch, distance };
  }

  _getDocSearchItemFromKeyword(keyword: Keyword): DocSearchItem {
    const schemaName = keyword.meta.schemaName as string;
    const schemaLabel = this.fyo.schemaMap[schemaName]?.label ?? schemaName;
    const route = this._getRouteFromKeyword(keyword);
    return {
      label: keyword.values[0],
      schemaLabel,
      more: keyword.values.slice(1),
      group: 'Docs',
      action: async () => {
        await routeTo(route);
      },
    };
  }

  _getRouteFromKeyword(keyword: Keyword): RouteLocationRaw {
    const { parent, parentSchemaName, schemaName } = keyword.meta;
    if (parent && parentSchemaName) {
      return getFormRoute(parentSchemaName as string, parent as string);
    }

    return getFormRoute(schemaName as string, keyword.values[0]);
  }

  _getGroupedKeywords() {
    /**
     * filter out the ignored groups
     * group by the keyword priority
     */
    const keywords: Keyword[] = [];
    const schemaNames = Object.keys(this.keywords);
    for (const sn of schemaNames) {
      const searchable = this.searchables[sn];
      if (!this.filters.schemaFilters[sn] || !this.filters.groupFilters.Docs) {
        continue;
      }

      if (searchable.isChild && this.filters.skipTables) {
        continue;
      }

      if (searchable.isSubmittable && this.filters.skipTransactions) {
        continue;
      }
      keywords.push(...this.keywords[sn]);
    }

    return groupBy(keywords.flat(), 'priority');
  }

  _setSearchables() {
    for (const schemaName of Object.keys(this.fyo.schemaMap)) {
      const schema = this.fyo.schemaMap[schemaName];
      if (!schema?.keywordFields?.length || this.searchables[schemaName]) {
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

      this.searchables[schemaName] = {
        schemaName,
        fields,
        meta,
        isChild: !!schema.isChild,
        isSubmittable: !!schema.isSubmittable,
        needsUpdate: true,
      };
    }
  }

  _setDocObservers() {
    if (this._obsSet) {
      return;
    }

    for (const { schemaName } of Object.values(this.searchables)) {
      this.fyo.doc.observer.on(`sync:${schemaName}`, () => {
        this.searchables[schemaName].needsUpdate = true;
      });

      this.fyo.doc.observer.on(`delete:${schemaName}`, () => {
        this.searchables[schemaName].needsUpdate = true;
      });
    }

    this._obsSet = true;
  }

  _setKeywords(maps: RawValueMap[], searchable: Searchable) {
    if (!maps?.length) {
      return;
    }

    this.keywords[searchable.schemaName] = [];

    for (const map of maps) {
      const keyword: Keyword = { values: [], meta: {}, priority: 0 };
      this._setKeywordValues(map, searchable, keyword);
      this._setMeta(map, searchable, keyword);
      this.keywords[searchable.schemaName]!.push(keyword);
    }

    this._setPriority(searchable);
  }

  _setKeywordValues(
    map: RawValueMap,
    searchable: Searchable,
    keyword: Keyword
  ) {
    // Set individual field values
    for (const fn of searchable.fields) {
      let value = map[fn] as string | undefined;
      const field = this.fyo.getField(searchable.schemaName, fn);

      const { options } = field as OptionField;
      if (options) {
        value = options.find((o) => o.value === value)?.label ?? value;
      }

      keyword.values.push(value ?? '');
    }
  }

  _setMeta(map: RawValueMap, searchable: Searchable, keyword: Keyword) {
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
    if (keyword.meta.parent) {
      keyword.values.unshift(keyword.meta.parent as string);
    }
  }

  _setPriority(searchable: Searchable) {
    const keywords = this.keywords[searchable.schemaName] ?? [];
    const basePriority = this.priorityMap[searchable.schemaName] ?? 0;

    for (const k of keywords) {
      k.priority += basePriority;

      if (k.meta.submitted) {
        k.priority += 25;
      }

      if (k.meta.cancelled) {
        k.priority -= 200;
      }

      if (searchable.isChild) {
        k.priority -= 150;
      }
    }
  }
}

function isSearchItem(item: SearchItem | Keyword): item is SearchItem {
  return !!(item as SearchItem).group;
}
