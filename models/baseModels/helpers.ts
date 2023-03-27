import { Doc } from 'fyo/model/doc';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';

export async function getItemRate(doc: Doc) {
  return (await doc.fyo.getValue('Item', doc.item as string, 'rate')) as Money;
}

export async function getPriceListRate(doc: Doc, isSales: boolean) {
  if (!doc.priceList || !doc.party) return false;

  const itemPriceName = (await doc.fyo.db.getItemPrice(
    doc.item as string,
    doc.priceList as string,
    new Date(),
    isSales,
    doc.party as string,
    doc.transferUnit as string,
    doc.batch as string
  )) as string;

  if (!itemPriceName.length) return false;

  return (await doc.fyo.getValue(
    ModelNameEnum.ItemPrice,
    itemPriceName as string,
    'rate'
  )) as Money;
}
