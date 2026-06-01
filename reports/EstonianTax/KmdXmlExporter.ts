import { XMLBuilder } from 'fast-xml-parser';
import { KmdBodyTotals, KmdReportData } from './types';

type OrderedNode = Record<string, OrderedNode[]> | { '#text': string };

export function exportKmdXml(data: KmdReportData): string {
  const builder = new XMLBuilder({
    format: true,
    indentBy: '  ',
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: true,
    processEntities: true,
    suppressEmptyNode: false,
  });

  const tree: OrderedNode[] = [
    {
      '?xml': [{ '#text': '' }],
      ':@': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    } as unknown as OrderedNode,
    {
      vatDeclaration: buildVatDeclaration(data),
    },
  ];

  return builder.build(tree);
}

function buildVatDeclaration(data: KmdReportData): OrderedNode[] {
  return [
    text('taxPayerRegCode', data.taxPayerRegCode),
    text('year', String(data.year)),
    text('month', pad2(data.month)),
    text('declarationType', String(data.declarationType)),
    text('version', data.version),
    { declarationBody: buildDeclarationBody(data.body) },
    { salesAnnex: buildSalesAnnex(data) },
    { purchasesAnnex: buildPurchasesAnnex(data) },
  ];
}

function buildDeclarationBody(b: KmdBodyTotals): OrderedNode[] {
  const nodes: OrderedNode[] = [
    text('noSales', allZero(salesValues(b)) ? 'true' : 'false'),
    text('noPurchases', allZero(purchaseValues(b)) ? 'true' : 'false'),
    text('sumPerPartnerSales', 'true'),
    text('sumPerPartnerPurchases', 'true'),
  ];

  pushMonetary(nodes, 'transactions24', b.transactions24);
  pushMonetary(nodes, 'transactions22', b.transactions22);
  pushMonetary(nodes, 'transactions20', b.transactions20);
  pushMonetary(nodes, 'transactions9', b.transactions9);
  pushMonetary(nodes, 'transactions5', b.transactions5);
  pushMonetary(nodes, 'transactions13', b.transactions13);
  pushMonetary(nodes, 'transactionsZeroVat', b.transactionsZeroVat);
  pushMonetary(
    nodes,
    'euSupplyInclGoodsAndServicesZeroVat',
    b.euSupplyInclGoodsAndServicesZeroVat
  );
  pushMonetary(nodes, 'euSupplyGoodsZeroVat', b.euSupplyGoodsZeroVat);
  pushMonetary(nodes, 'exportZeroVat', b.exportZeroVat);
  pushMonetary(nodes, 'salePassengersWithReturnVat', b.salePassengersWithReturnVat);
  pushMonetary(nodes, 'inputVatTotal', b.inputVatTotal);
  pushMonetary(nodes, 'importVat', b.importVat);
  pushMonetary(nodes, 'fixedAssetsVat', b.fixedAssetsVat);
  pushMonetary(nodes, 'carsVat', b.carsVat);
  if (b.numberOfCars > 0) nodes.push(text('numberOfCars', String(b.numberOfCars)));
  pushMonetary(nodes, 'carsPartialVat', b.carsPartialVat);
  if (b.numberOfCarsPartial > 0)
    nodes.push(text('numberOfCarsPartial', String(b.numberOfCarsPartial)));
  pushMonetary(
    nodes,
    'euAcquisitionsGoodsAndServicesTotal',
    b.euAcquisitionsGoodsAndServicesTotal
  );
  pushMonetary(nodes, 'euAcquisitionsGoods', b.euAcquisitionsGoods);
  pushMonetary(
    nodes,
    'acquisitionOtherGoodsAndServicesTotal',
    b.acquisitionOtherGoodsAndServicesTotal
  );
  pushMonetary(
    nodes,
    'acquisitionImmovablesAndScrapMetalAndGold',
    b.acquisitionImmovablesAndScrapMetalAndGold
  );
  pushMonetary(nodes, 'supplyExemptFromTax', b.supplyExemptFromTax);
  pushMonetary(nodes, 'supplySpecialArrangements', b.supplySpecialArrangements);
  pushMonetary(nodes, 'adjustmentsPlus', b.adjustmentsPlus);
  pushMonetary(nodes, 'adjustmentsMinus', b.adjustmentsMinus);

  return nodes;
}

function buildSalesAnnex(data: KmdReportData): OrderedNode[] {
  const nodes: OrderedNode[] = [
    text('noSales', data.saleAnnex.length === 0 ? 'true' : 'false'),
    text('sumPerPartnerSales', 'true'),
  ];
  for (const line of data.saleAnnex) {
    const lineNodes: OrderedNode[] = [];
    if (line.buyerRegCode)
      lineNodes.push(text('buyerRegCode', line.buyerRegCode));
    if (line.buyerName) lineNodes.push(text('buyerName', line.buyerName));
    if (line.invoiceNumber)
      lineNodes.push(text('invoiceNumber', line.invoiceNumber));
    if (line.invoiceDate) lineNodes.push(text('invoiceDate', line.invoiceDate));
    lineNodes.push(text('invoiceSum', money(line.invoiceSum)));
    lineNodes.push(text('taxRate', line.taxRate));
    nodes.push({ saleLine: lineNodes });
  }
  return nodes;
}

function buildPurchasesAnnex(data: KmdReportData): OrderedNode[] {
  const nodes: OrderedNode[] = [
    text('noPurchases', data.purchaseAnnex.length === 0 ? 'true' : 'false'),
    text('sumPerPartnerPurchases', 'true'),
  ];
  for (const line of data.purchaseAnnex) {
    const lineNodes: OrderedNode[] = [];
    if (line.sellerRegCode)
      lineNodes.push(text('sellerRegCode', line.sellerRegCode));
    if (line.sellerName) lineNodes.push(text('sellerName', line.sellerName));
    if (line.invoiceNumber)
      lineNodes.push(text('invoiceNumber', line.invoiceNumber));
    if (line.invoiceDate) lineNodes.push(text('invoiceDate', line.invoiceDate));
    lineNodes.push(text('invoiceSumVat', money(line.invoiceSumVat)));
    lineNodes.push(text('vatInPeriod', money(line.vatInPeriod)));
    nodes.push({ purchaseLine: lineNodes });
  }
  return nodes;
}

function text(tag: string, value: string): OrderedNode {
  return { [tag]: [{ '#text': value }] } as OrderedNode;
}

function pushMonetary(nodes: OrderedNode[], name: string, value: number) {
  if (value === 0) return;
  nodes.push(text(name, money(value)));
}

function money(n: number): string {
  return n.toFixed(2);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function salesValues(b: KmdBodyTotals): number[] {
  return [
    b.transactions24,
    b.transactions22,
    b.transactions20,
    b.transactions9,
    b.transactions5,
    b.transactions13,
    b.transactionsZeroVat,
    b.salePassengersWithReturnVat,
    b.supplyExemptFromTax,
    b.supplySpecialArrangements,
  ];
}

function purchaseValues(b: KmdBodyTotals): number[] {
  return [
    b.inputVatTotal,
    b.importVat,
    b.fixedAssetsVat,
    b.carsVat,
    b.carsPartialVat,
    b.euAcquisitionsGoodsAndServicesTotal,
    b.acquisitionOtherGoodsAndServicesTotal,
    b.acquisitionImmovablesAndScrapMetalAndGold,
  ];
}

function allZero(values: number[]): boolean {
  return values.every((v) => v === 0);
}
