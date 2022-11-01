import { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';
import test from 'tape';

export const dummyItems = [
  {
    name: 'Ball Pen',
    rate: 50,
    for: 'Both',
    trackItem: true,
  },
  {
    name: 'Ink Pen',
    rate: 700,
    for: 'Both',
    trackItem: true,
  },
];

export function createDummyItems(fyo: Fyo) {
}
