import { XMLBuilder } from 'fast-xml-parser';
import { VdReportData } from './types';

type OrderedNode = Record<string, OrderedNode[]> | { '#text': string };

export function exportVdXml(data: VdReportData): string {
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
      'q1:VD_deklaratsioon': buildDeclaration(data),
      ':@': {
        '@_xmlns:q1': 'http://www.emta.ee/VD/xsd/webimport/v1',
      },
    } as unknown as OrderedNode,
  ];

  return builder.build(tree);
}

function buildDeclaration(data: VdReportData): OrderedNode[] {
  const nodes: OrderedNode[] = [
    text('deklareerijaKood', data.taxPayerRegCode),
    text('perioodAasta', String(data.year)),
    text('perioodKuu', String(data.month)),
  ];

  if (data.lines.length === 0) {
    nodes.push({ aruandeRead: [] });
  } else {
    nodes.push({
      aruandeRead: data.lines.map((line) => ({
        aruandeRida: [
          text('partnerRiik', line.partnerCountry),
          text('partnerKmkr', line.partnerVatCode),
          text('kood', '2'),
          text('summa', line.amount.toFixed(2)),
        ],
      })),
    });
  }

  return nodes;
}

function text(tag: string, value: string): OrderedNode {
  return { [tag]: [{ '#text': value }] } as OrderedNode;
}
