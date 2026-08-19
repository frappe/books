import { Fyo } from 'fyo';

export function getDefaultUOMs(fyo: Fyo) {
  return [
    {
      name: fyo.t`Unit`,
      isWhole: true,
    },
    {
      name: fyo.t`Kg`,
      isWhole: false,
    },
    {
      name: fyo.t`Gram`,
      isWhole: false,
    },
    {
      name: fyo.t`Meter`,
      isWhole: false,
    },
    {
      name: fyo.t`Hour`,
      isWhole: false,
    },
    {
      name: fyo.t`Day`,
      isWhole: false,
    },
  ];
}

export function getDefaultLocations(fyo: Fyo) {
  return [{ name: fyo.t`Stores` }];
}
