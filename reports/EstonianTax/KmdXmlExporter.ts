import { KmdBodyTotals, KmdReportData } from './types';

/**
 * Build the `vatDeclaration` XML matching EMTA's `vatdeclaration.xsd`
 * (current version, valid from 2025-07-01).
 *
 * Schema is no-namespace. Element order matters — XSD declares a `sequence`,
 * so we emit body fields in the same order as the schema.
 *
 * Hand-rolled string builder (no external XML lib) — xmlbuilder2 drags
 * Node stream polyfills that break the Electron renderer bundle, and we
 * only need single-pass element emission.
 *
 * The portal computes output VAT and net VAT payable from the rate-bucket
 * totals; we only emit the values that the spec asks for.
 */
export function exportKmdXml(data: KmdReportData): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<vatDeclaration>');

  pushEl(lines, 1, 'taxPayerRegCode', data.taxPayerRegCode);
  pushEl(lines, 1, 'year', String(data.year));
  pushEl(lines, 1, 'month', pad2(data.month));
  pushEl(lines, 1, 'declarationType', String(data.declarationType));
  pushEl(lines, 1, 'version', data.version);

  appendDeclarationBody(lines, data);
  appendSalesAnnex(lines, data);
  appendPurchasesAnnex(lines, data);

  lines.push('</vatDeclaration>');
  return lines.join('\n');
}

function appendDeclarationBody(lines: string[], data: KmdReportData) {
  const b = data.body;
  lines.push(indent(1) + '<declarationBody>');

  pushEl(lines, 2, 'noSales', allZero(salesValues(b)) ? 'true' : 'false');
  pushEl(lines, 2, 'noPurchases', allZero(purchaseValues(b)) ? 'true' : 'false');
  pushEl(lines, 2, 'sumPerPartnerSales', 'true');
  pushEl(lines, 2, 'sumPerPartnerPurchases', 'true');

  appendMonetaryIfNonZero(lines, 2, 'transactions24', b.transactions24);
  appendMonetaryIfNonZero(lines, 2, 'transactions22', b.transactions22);
  appendMonetaryIfNonZero(lines, 2, 'transactions20', b.transactions20);
  appendMonetaryIfNonZero(lines, 2, 'transactions9', b.transactions9);
  appendMonetaryIfNonZero(lines, 2, 'transactions5', b.transactions5);
  appendMonetaryIfNonZero(lines, 2, 'transactions13', b.transactions13);
  appendMonetaryIfNonZero(lines, 2, 'transactionsZeroVat', b.transactionsZeroVat);
  appendMonetaryIfNonZero(
    lines,
    2,
    'euSupplyInclGoodsAndServicesZeroVat',
    b.euSupplyInclGoodsAndServicesZeroVat
  );
  appendMonetaryIfNonZero(lines, 2, 'euSupplyGoodsZeroVat', b.euSupplyGoodsZeroVat);
  appendMonetaryIfNonZero(lines, 2, 'exportZeroVat', b.exportZeroVat);
  appendMonetaryIfNonZero(lines, 2, 'inputVatTotal', b.inputVatTotal);
  appendMonetaryIfNonZero(
    lines,
    2,
    'euAcquisitionsGoodsAndServicesTotal',
    b.euAcquisitionsGoodsAndServicesTotal
  );
  appendMonetaryIfNonZero(lines, 2, 'euAcquisitionsGoods', b.euAcquisitionsGoods);
  appendMonetaryIfNonZero(
    lines,
    2,
    'acquisitionOtherGoodsAndServicesTotal',
    b.acquisitionOtherGoodsAndServicesTotal
  );
  appendMonetaryIfNonZero(lines, 2, 'supplyExemptFromTax', b.supplyExemptFromTax);
  appendMonetaryIfNonZero(lines, 2, 'adjustmentsPlus', b.adjustmentsPlus);
  appendMonetaryIfNonZero(lines, 2, 'adjustmentsMinus', b.adjustmentsMinus);

  lines.push(indent(1) + '</declarationBody>');
}

function appendSalesAnnex(lines: string[], data: KmdReportData) {
  lines.push(indent(1) + '<salesAnnex>');
  pushEl(lines, 2, 'noSales', data.saleAnnex.length === 0 ? 'true' : 'false');
  pushEl(lines, 2, 'sumPerPartnerSales', 'true');
  for (const line of data.saleAnnex) {
    lines.push(indent(2) + '<saleLine>');
    if (line.buyerRegCode) pushEl(lines, 3, 'buyerRegCode', line.buyerRegCode);
    if (line.buyerName) pushEl(lines, 3, 'buyerName', line.buyerName);
    if (line.invoiceNumber) pushEl(lines, 3, 'invoiceNumber', line.invoiceNumber);
    if (line.invoiceDate) pushEl(lines, 3, 'invoiceDate', line.invoiceDate);
    pushEl(lines, 3, 'invoiceSum', money(line.invoiceSum));
    pushEl(lines, 3, 'taxRate', line.taxRate);
    lines.push(indent(2) + '</saleLine>');
  }
  lines.push(indent(1) + '</salesAnnex>');
}

function appendPurchasesAnnex(lines: string[], data: KmdReportData) {
  lines.push(indent(1) + '<purchasesAnnex>');
  pushEl(lines, 2, 'noPurchases', data.purchaseAnnex.length === 0 ? 'true' : 'false');
  pushEl(lines, 2, 'sumPerPartnerPurchases', 'true');
  for (const line of data.purchaseAnnex) {
    lines.push(indent(2) + '<purchaseLine>');
    if (line.sellerRegCode) pushEl(lines, 3, 'sellerRegCode', line.sellerRegCode);
    if (line.sellerName) pushEl(lines, 3, 'sellerName', line.sellerName);
    if (line.invoiceNumber) pushEl(lines, 3, 'invoiceNumber', line.invoiceNumber);
    if (line.invoiceDate) pushEl(lines, 3, 'invoiceDate', line.invoiceDate);
    pushEl(lines, 3, 'invoiceSumVat', money(line.invoiceSumVat));
    pushEl(lines, 3, 'vatInPeriod', money(line.vatInPeriod));
    lines.push(indent(2) + '</purchaseLine>');
  }
  lines.push(indent(1) + '</purchasesAnnex>');
}

function appendMonetaryIfNonZero(
  lines: string[],
  level: number,
  name: string,
  value: number
) {
  if (value === 0) return;
  pushEl(lines, level, name, money(value));
}

function pushEl(lines: string[], level: number, name: string, value: string) {
  lines.push(`${indent(level)}<${name}>${escapeXml(value)}</${name}>`);
}

function indent(level: number): string {
  return '  '.repeat(level);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
    b.supplyExemptFromTax,
  ];
}

function purchaseValues(b: KmdBodyTotals): number[] {
  return [
    b.inputVatTotal,
    b.euAcquisitionsGoodsAndServicesTotal,
    b.acquisitionOtherGoodsAndServicesTotal,
  ];
}

function allZero(values: number[]): boolean {
  return values.every((v) => v === 0);
}
