import { ConfigKeys } from 'fyo/core/types';
import { fyo } from 'src/initFyo';

export function incrementOpenCount() {
  let openCount = fyo.config.get(ConfigKeys.OpenCount);
  if (typeof openCount !== 'number') {
    openCount = 1;
  } else {
    openCount += 1;
  }

  fyo.config.set(ConfigKeys.OpenCount, openCount);
}
