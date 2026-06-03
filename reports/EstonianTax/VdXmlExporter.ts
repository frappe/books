import { XMLBuilder } from 'fast-xml-parser';
import { VdReportData } from './types';

type OrderedNode = Record<string, unknown>;

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
    },
    {
      'q1:VD_deklaratsioon': buildDeclaration(data),
      ':@': {
        '@_xmlns:q1': 'http://www.emta.ee/VD/xsd/webimport/v1',
      },
    },
  ];

  return builder.build(tree);
}

function buildDeclaration(data: VdReportData): OrderedNode[] {
  return [
    text('deklareerijaKood', data.taxPayerRegCode),
    text('perioodAasta', String(data.year)),
    text('perioodKuu', String(data.month)),
    {
      aruandeRead: data.lines.map((line) => {
        const rida: OrderedNode[] = [
          {
            kmkrKood: [{ '#text': line.partnerVatCode }],
            ':@': { '@_riik': line.partnerCountry },
          },
        ];
        if (line.goods > 0) rida.push(int('kaup', line.goods));
        if (line.triangle > 0) rida.push(int('kolmnurktehing', line.triangle));
        if (line.services > 0) rida.push(int('teenusteMyyk', line.services));
        return { aruandeRida: rida };
      }),
    },
  ];
}

function text(tag: string, value: string): OrderedNode {
  return { [tag]: [{ '#text': value }] };
}

function int(tag: string, value: number): OrderedNode {
  return { [tag]: [{ '#text': String(Math.round(value)) }] };
}
