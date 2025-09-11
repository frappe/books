import { t } from 'fyo';
import type { Doc } from 'fyo/model/doc';
import { BaseError } from 'fyo/utils/errors';
import { ErrorLog } from 'fyo/utils/types';
import { truncate } from 'lodash';
import { showDialog } from 'src/utils/interactive';
import { fyo } from './initFyo';
import router from './router';
import { getErrorMessage, stringifyCircular } from './utils';
import type { DialogOptions, ToastOptions } from './utils/types';
import { ModelNameEnum } from 'models/types';

function shouldNotStore(error: Error) {
  const shouldLog = (error as BaseError).shouldStore ?? true;
  return !shouldLog;
}

export async function sendError(errorLogObj: ErrorLog) {
  if (!errorLogObj.stack) {
    return;
  }

  errorLogObj.more ??= {};
  errorLogObj.more.path ??= router.currentRoute.value.fullPath;

  const body = {
    error_name: errorLogObj.name,
    message: errorLogObj.message,
    stack: errorLogObj.stack,
    platform: fyo.store.platform,
    version: fyo.store.appVersion,
    language: fyo.store.language,
    instance_id: fyo.store.instanceId,
    device_id: fyo.store.deviceId,
    open_count: fyo.store.openCount,
    country_code: fyo.singles.SystemSettings?.countryCode,
    more: stringifyCircular(errorLogObj.more),
  };

  if (fyo.store.isDevelopment) {
    // eslint-disable-next-line no-console
    console.log('sendError', body);
  }

  await ipc.sendError(JSON.stringify(body));
}

function getToastProps(errorLogObj: ErrorLog) {
  const props: ToastOptions = {
    message: errorLogObj.name ?? t`Error`,
    type: 'error',
    actionText: t`Report Error`,
    action: () => reportIssue(errorLogObj),
  };

  return props;
}

export function getErrorLogObject(
  error: Error,
  more: Record<string, unknown>
): ErrorLog {
  const { name, stack, message, cause } = error;
  if (cause) {
    more.cause = cause;
  }

  const errorLogObj = { name, stack, message, more };

  fyo.errorLog.push(errorLogObj);

  return errorLogObj;
}

export async function handleError(
  logToConsole: boolean,
  error: Error,
  more: Record<string, unknown> = {},
  notifyUser = true
) {
  if (logToConsole) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  if (shouldNotStore(error)) {
    return;
  }

  const errorLogObj = getErrorLogObject(error, more);
  await sendError(errorLogObj);

  if (notifyUser) {
    const toastProps = getToastProps(errorLogObj);
    const { showToast } = await import('src/utils/interactive');
    showToast(toastProps);
  }
}

export async function handleErrorWithDialog(
  error: unknown,
  doc?: Doc,
  reportError?: boolean,
  dontThrow?: boolean
) {
  if (!(error instanceof Error)) {
    return;
  }

  const errorMessage = getErrorMessage(error, doc);
  await handleError(false, error, { errorMessage, doc });

  const label = getErrorLabel(error);
  const options: DialogOptions = {
    title: label,
    detail: errorMessage,
    type: 'error',
  };

  if (reportError) {
    options.detail = truncate(String(options.detail), { length: 128 });
    options.buttons = [
      {
        label: t`Report`,
        action() {
          reportIssue(getErrorLogObject(error, { errorMessage }));
        },
        isPrimary: true,
      },
      {
        label: t`Cancel`,
        action() {
          return null;
        },
        isEscape: true,
      },
    ];
  }

  await showDialog(options);
  if (dontThrow) {
    if (fyo.store.isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
    return;
  }

  throw error;
}

export async function showErrorDialog(title?: string, content?: string) {
  // To be used for  show stopper errors
  title ??= t`Error`;
  content ??= t`Something has gone terribly wrong. Please check the console and raise an issue.`;
  await ipc.showError(title, content);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorHandled<T extends (...args: any[]) => Promise<any>>(
  func: T
) {
  type Return = ReturnType<T> extends Promise<infer P> ? P : true;
  return async function errorHandled(...args: Parameters<T>): Promise<Return> {
    try {
      return (await func(...args)) as Return;
    } catch (error) {
      await handleError(false, error as Error, {
        functionName: func.name,
        functionArgs: args,
      });

      throw error;
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorHandledSync<T extends (...args: any[]) => any>(
  func: T
) {
  type Return = ReturnType<T> extends Promise<infer P> ? P : ReturnType<T>;
  return function errorHandledSync(...args: Parameters<T>) {
    try {
      return func(...args) as Return;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      handleError(false, error as Error, {
        functionName: func.name,
        functionArgs: args,
      });
    }
  };
}

function getFeatureFlags(): string[] {
  const getBooleanFields = (docName: string) => {
    const doc = fyo.singles[docName];

    return Object.entries(doc as Doc).reduce((acc, [key, value]) => {
      const fieldsArray = fyo.schemaMap[docName]?.fields ?? [];
      const fieldsMap = new Map(fieldsArray.map((f) => [f.fieldname, f]));

      const field = fieldsMap.get(key);
      if (
        typeof value === 'boolean' &&
        !field?.hidden &&
        !key.startsWith('_')
      ) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, boolean>);
  };

  const sections = [
    {
      name: 'Accounting',
      flags: getBooleanFields(ModelNameEnum.AccountingSettings),
    },
    { name: 'POS', flags: getBooleanFields(ModelNameEnum.POSSettings) },
    {
      name: 'Inventory',
      flags: getBooleanFields(ModelNameEnum.InventorySettings),
    },
  ]

    .filter(({ flags }) => Object.keys(flags).length > 0)
    .flatMap(({ name, flags }) => [
      `**${name} Settings**:`,
      '```json',
      JSON.stringify(flags, null, 2),
      '```',
      '',
    ]);

  return sections.length
    ? [
        '<details>',
        '<summary><strong>Feature Flags</strong></summary>',
        '',
        ...sections,
        '</details>',
      ]
    : [];
}

function getIssueUrlQuery(errorLogObj?: ErrorLog): string {
  const baseUrl = 'https://github.com/frappe/books/issues/new?labels=bug';

  const body = [
    '<h2>Description</h2>',
    'Add some description...',
    '',
    '<h2>Steps to Reproduce</h2>',
    'Add steps to reproduce the error...',
    '',
    '<h2>Info</h2>',
    '',
  ];

  if (errorLogObj) {
    body.push(`**Error**: _${errorLogObj.name}: ${errorLogObj.message}_`, '');
  }

  if (errorLogObj?.stack) {
    body.push('**Stack**:', '```', errorLogObj.stack, '```', '');
  }

  body.push(`**Version**: \`${fyo.store.appVersion}\``);
  body.push(`**Platform**: \`${fyo.store.platform}\``);
  body.push(`**Path**: \`${router.currentRoute.value.fullPath}\``);

  body.push(`**Language**: \`${fyo.config.get('language') ?? '-'}\``);
  if (fyo.singles.SystemSettings?.countryCode) {
    body.push(`**Country**: \`${fyo.singles.SystemSettings.countryCode}\``);
  }
  body.push('', ...getFeatureFlags());

  const encodedBody = encodeURIComponent(body.join('\n'));
  return `${baseUrl}&body=${encodedBody}`;
}

export function reportIssue(errorLogObj?: ErrorLog) {
  const urlQuery = getIssueUrlQuery(errorLogObj);
  ipc.openExternalUrl(urlQuery);
}

function getErrorLabel(error: Error) {
  const name = error.name;
  if (!name) {
    return t`Error`;
  }

  if (name === 'BaseError') {
    return t`Error`;
  }

  if (name === 'ValidationError') {
    return t`Validation Error`;
  }

  if (name === 'NotFoundError') {
    return t`Not Found`;
  }

  if (name === 'ForbiddenError') {
    return t`Forbidden Error`;
  }

  if (name === 'DuplicateEntryError') {
    return t`Duplicate Entry`;
  }

  if (name === 'LinkValidationError') {
    return t`Link Validation Error`;
  }

  if (name === 'MandatoryError') {
    return t`Mandatory Error`;
  }

  if (name === 'DatabaseError') {
    return t`Database Error`;
  }

  if (name === 'CannotCommitError') {
    return t`Cannot Commit Error`;
  }

  if (name === 'NotImplemented') {
    return t`Error`;
  }

  if (name === 'ToDebugError') {
    return t`Error`;
  }

  return t`Error`;
}
