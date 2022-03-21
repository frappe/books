import config, { ConfigKeys } from '@/config';

export function incrementOpenCount() {
  let openCount = config.get(ConfigKeys.OpenCount);
  if (typeof openCount !== 'number') {
    openCount = 1;
  } else {
    openCount += 1;
  }

  config.set(ConfigKeys.OpenCount, openCount);
}
