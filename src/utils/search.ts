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

  return [quickEditCreateList, formEditCreateList].flat();
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
  return [
    ModelNameEnum.Account,
    ModelNameEnum.Party,
    ModelNameEnum.Item,
    ModelNameEnum.Payment,
    ModelNameEnum.JournalEntry,
    ModelNameEnum.PurchaseInvoice,
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.Tax,
  ]
    .map((s) => fyo.schemaMap[s])
    .filter((s) => s && !s.isChild && !s.isSingle)
    .map((s) => ({
      label: s!.label,
      route: `/list/${s!.name}`,
      group: 'List',
    }));
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
