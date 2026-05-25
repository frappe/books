import { XMLBuilder } from 'fast-xml-parser';
import { XbrlFact, XbrlReportData } from './types';

/**
 * Build an et-gaap XBRL instance document for the Estonian Business Register
 * portal (ettevõtjaportaal.rik.ee).
 *
 * Taxonomy: http://xbrl.eesti.ee/taxonomy/et-gaap_2026-01-01/
 * Entity scheme: http://www.rik.ee  (registry code as identifier)
 *
 * Two contexts only:
 *   - `instant_end`   for balance sheet (periodEnd)
 *   - `duration_year` for income statement (periodStart..periodEnd)
 *
 * Single unit: EUR (iso4217).
 *
 * Built via fast-xml-parser's XMLBuilder with `preserveOrder: true`
 * (browser-safe, already in deps — see plan §6.3 lesson on xmlbuilder2).
 */

type OrderedNode = Record<string, OrderedNode[]> | { '#text': string };

const XBRLI_NS = 'http://www.xbrl.org/2003/instance';
const ISO4217_NS = 'http://www.xbrl.org/2003/iso4217';
const ENTITY_SCHEME = 'http://www.rik.ee';

export function exportXbrl(
  data: XbrlReportData,
  taxonomyVersion: string
): string {
  const taxonomyNs = `http://xbrl.eesti.ee/taxonomy/et-gaap_${taxonomyVersion}/`;

  const builder = new XMLBuilder({
    format: true,
    indentBy: '  ',
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: true,
    processEntities: true,
    suppressEmptyNode: false,
  });

  const xbrlChildren: OrderedNode[] = [
    contextInstant(data.registryCode, data.periodEnd, 'instant_end'),
    contextDuration(
      data.registryCode,
      data.periodStart,
      data.periodEnd,
      'duration_year'
    ),
    unitEUR('EUR'),
    ...factNodes(data.balanceSheet),
    ...factNodes(data.incomeStatement),
    ...data.notes.map((n) => textFact(n.element, n.text, n.context)),
  ];

  const tree: OrderedNode[] = [
    {
      '?xml': [{ '#text': '' }],
      ':@': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    } as unknown as OrderedNode,
    {
      'xbrli:xbrl': xbrlChildren,
      ':@': {
        '@_xmlns:xbrli': XBRLI_NS,
        '@_xmlns:link': 'http://www.xbrl.org/2003/linkbase',
        '@_xmlns:xlink': 'http://www.w3.org/1999/xlink',
        '@_xmlns:iso4217': ISO4217_NS,
        '@_xmlns:et-gaap': taxonomyNs,
      },
    } as unknown as OrderedNode,
  ];

  return builder.build(tree);
}

function contextInstant(
  registryCode: string,
  date: string,
  id: string
): OrderedNode {
  return {
    'xbrli:context': [
      {
        'xbrli:entity': [
          {
            'xbrli:identifier': [{ '#text': registryCode }],
            ':@': { '@_scheme': ENTITY_SCHEME },
          } as unknown as OrderedNode,
        ],
      },
      {
        'xbrli:period': [{ 'xbrli:instant': [{ '#text': date }] }],
      },
    ],
    ':@': { '@_id': id },
  } as unknown as OrderedNode;
}

function contextDuration(
  registryCode: string,
  start: string,
  end: string,
  id: string
): OrderedNode {
  return {
    'xbrli:context': [
      {
        'xbrli:entity': [
          {
            'xbrli:identifier': [{ '#text': registryCode }],
            ':@': { '@_scheme': ENTITY_SCHEME },
          } as unknown as OrderedNode,
        ],
      },
      {
        'xbrli:period': [
          { 'xbrli:startDate': [{ '#text': start }] },
          { 'xbrli:endDate': [{ '#text': end }] },
        ],
      },
    ],
    ':@': { '@_id': id },
  } as unknown as OrderedNode;
}

function unitEUR(id: string): OrderedNode {
  return {
    'xbrli:unit': [{ 'xbrli:measure': [{ '#text': 'iso4217:EUR' }] }],
    ':@': { '@_id': id },
  } as unknown as OrderedNode;
}

function factNodes(facts: XbrlFact[]): OrderedNode[] {
  return facts.map((f) => monetaryFact(f.element, f.value, f.context));
}

function monetaryFact(
  element: string,
  value: number,
  contextRef: string
): OrderedNode {
  return {
    [`et-gaap:${element}`]: [{ '#text': String(value) }],
    ':@': {
      '@_contextRef': contextRef,
      '@_unitRef': 'EUR',
      '@_decimals': '0',
    },
  } as unknown as OrderedNode;
}

function textFact(
  element: string,
  text: string,
  contextRef: string
): OrderedNode {
  return {
    [`et-gaap:${element}`]: [{ '#text': text }],
    ':@': { '@_contextRef': contextRef },
  } as unknown as OrderedNode;
}
