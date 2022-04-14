import Doc from 'frappe/model/doc';

export interface QuickEditOptions {
  schemaName: string;
  name: string;
  hideFields?: string[];
  showFields?: string[];
  defaults?: Record<string, unknown>;
}

export async function openQuickEdit({
  schemaName,
  name,
  hideFields,
  showFields,
  defaults = {},
}: QuickEditOptions) {
  const router = (await import('./router')).default;

  const currentRoute = router.currentRoute.value;
  const query = currentRoute.query;
  let method: 'push' | 'replace' = 'push';

  if (query.edit && query.doctype === schemaName) {
    // replace the current route if we are
    // editing another document of the same doctype
    method = 'replace';
  }
  if (query.name === name) return;

  const forWhat = (defaults?.for ?? []) as string[];
  if (forWhat[0] === 'not in') {
    const purpose = forWhat[1]?.[0];

    defaults = Object.assign({
      for:
        purpose === 'sales'
          ? 'purchases'
          : purpose === 'purchases'
          ? 'sales'
          : 'both',
    });
  }

  if (forWhat[0] === 'not in' && forWhat[1] === 'sales') {
    defaults = Object.assign({ for: 'purchases' });
  }

  router[method]({
    query: {
      edit: 1,
      doctype: schemaName,
      name,
      showFields: showFields ?? getShowFields(schemaName),
      hideFields,
      valueJSON: stringifyCircular(defaults),
      // @ts-ignore
      lastRoute: currentRoute,
    },
  });
}

function getShowFields(schemaName: string) {
  if (schemaName === 'Party') {
    return ['customer'];
  }
  return [];
}

export function stringifyCircular(
  obj: Record<string, unknown>,
  ignoreCircular = false,
  convertDocument = false
) {
  const cacheKey: string[] = [];
  const cacheValue: unknown[] = [];

  return JSON.stringify(obj, (key, value) => {
    if (typeof value !== 'object' || value === null) {
      cacheKey.push(key);
      cacheValue.push(value);
      return value;
    }

    if (cacheValue.includes(value)) {
      const circularKey = cacheKey[cacheValue.indexOf(value)] || '{self}';
      return ignoreCircular ? undefined : `[Circular:${circularKey}]`;
    }

    cacheKey.push(key);
    cacheValue.push(value);

    if (convertDocument && value instanceof Doc) {
      return value.getValidDict();
    }

    return value;
  });
}
