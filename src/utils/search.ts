import { t } from 'fyo';
import { ModelNameEnum } from 'models/types';
import reports from 'reports/view';
import { fyo } from 'src/initFyo';
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
      filter: { for: 'sales' },
    },
    {
      label: t`Purchase Items`,
      schemaName: ModelNameEnum.Item,
      filter: { for: 'purchases' },
    },
    {
      label: t`Common Items`,
      schemaName: ModelNameEnum.Item,
      filter: { for: 'both' },
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
  return Object.values(reports).map((report) => {
    return {
      label: report.title,
      route: `/report/${report.method}`,
      group: 'Report',
    };
  });
}

function getListViewList(): SearchItem[] {
  const standardLists = [
    ModelNameEnum.Account,
    ModelNameEnum.Party,
    ModelNameEnum.Payment,
    ModelNameEnum.JournalEntry,
    ModelNameEnum.PurchaseInvoice,
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.Tax,
  ]
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
      route: `/list/Item/for/sales/${t`Sales Items`}`,
    },
    {
      label: t`Purchase Items`,
      route: `/list/Item/for/purchases/${t`Purchase Items`}`,
    },
    {
      label: t`Common Items`,
      route: `/list/Item/for/both/${t`Common Items`}`,
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
