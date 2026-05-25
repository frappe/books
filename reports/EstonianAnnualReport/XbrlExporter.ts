import { XMLBuilder } from 'fast-xml-parser';
import { XbrlFact, XbrlReportData } from './types';

type OrderedNode = Record<string, OrderedNode[]> | { '#text': string };

const XBRLI_NS = 'http://www.xbrl.org/2003/instance';
const ISO4217_NS = 'http://www.xbrl.org/2003/iso4217';
const ENTITY_SCHEME = 'http://www.rik.ee';

export interface XbrlExportOptions {
  schemaRefHref?: string;
}

export function exportXbrl(
  data: XbrlReportData,
  taxonomyVersion: string,
  options: XbrlExportOptions = {}
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

  const xbrlChildren: OrderedNode[] = [];
  if (options.schemaRefHref) {
    xbrlChildren.push(schemaRefNode(options.schemaRefHref));
  }
  xbrlChildren.push(
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
    ...data.notes.map((n) => textFact(n.element, n.text, n.context))
  );

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

function schemaRefNode(href: string): OrderedNode {
  return {
    'link:schemaRef': [],
    ':@': { '@_xlink:type': 'simple', '@_xlink:href': href },
  } as unknown as OrderedNode;
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
