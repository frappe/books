import { DateTime } from 'luxon';

// prettier-ignore
export const partyPurchaseItemMap: Record<string, string[]> = {
  'Janky Office Spaces': ['Office Rent', 'Office Cleaning'],
  "Josféña's 611s": ['611 Jeans - PCH', '611 Jeans - SHR'],
  'Lankness Feet Fomenters': ['Bominga Shoes', 'Jade Slippers'],
  'The Overclothes Company': ['Jacket - RAW', 'Cryo Gloves', 'Cool Cloth'],
  'Adani Electricity Mumbai Limited': ['Electricity'],
  'Only Fulls': ['Full Sleeve - BLK', 'Full Sleeve - COL'],
  'Just Epaulettes': ['Epaulettes - 4POR'],
  'Le Socials': ['Social Ads'],
  'Maxwell': ['Marketing - Video'],
};

export const purchaseItemPartyMap: Record<string, string> = Object.keys(
  partyPurchaseItemMap
).reduce((acc, party) => {
  for (const item of partyPurchaseItemMap[party]) {
    acc[item] = party;
  }
  return acc;
}, {} as Record<string, string>);

export const flow = [
  0.35, // Jan
  0.25, // Feb
  0.15, // Mar
  0.15, // Apr
  0.25, // May
  0.05, // Jun
  0.05, // Jul
  0.15, // Aug
  0.25, // Sep
  0.35, // Oct
  0.45, // Nov
  0.55, // Dec
];
export function getFlowConstant(months: number) {
  // Jan to December
  const d = DateTime.now().minus({ months });
  return flow[d.month - 1];
}

export function getRandomDates(count: number, months: number): Date[] {
  /**
   * Returns `count` number of dates for a month, `months` back from the
   * current date.
   */
  let endDate = DateTime.now();
  if (months !== 0) {
    const back = endDate.minus({ months });
    endDate = DateTime.local(back.year, back.month, back.daysInMonth);
  }

  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const day = Math.ceil(endDate.day * Math.random());
    const date = DateTime.local(endDate.year, endDate.month, day);
    dates.push(date.toJSDate());
  }

  return dates;
}
