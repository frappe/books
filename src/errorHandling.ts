import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import { ConfigKeys } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { BaseError } from 'fyo/utils/errors';
import { ErrorLog } from 'fyo/utils/types';
import { truncate } from 'lodash';
import { showDialog } from 'src/utils/interactive';
import { IPC_ACTIONS, IPC_MESSAGES } from 'utils/messages';
import { fyo } from './initFyo';
import router from './router';
import { getErrorMessage, stringifyCircular } from './utils';
import { DialogOptions, ToastOptions } from './utils/types';

function shouldNotStore(error: Error) {
  const shouldLog = (error as BaseError).shouldStore ?? true;
  return !shouldLog;
}

export async function sendError(errorLogObj: ErrorLog) {
  if (!errorLogObj.stack) {
    return;
  }

  errorLogObj.more ??= {};
  errorLogObj.more!.path ??= router.currentRoute.value.fullPath;

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
    more: stringifyCircular(errorLogObj.more!),
  };

  if (fyo.store.isDevelopment) {
    console.log('sendError', body);
  }

  await ipcRenderer.invoke(IPC_ACTIONS.SEND_ERROR, JSON.stringify(body));
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
  notifyUser: boolean = true
) {
  if (logToConsole) {
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
    await showToast(toastProps);
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
    options.detail = truncate(options.detail, { length: 128 });
    options.buttons = [
      {
        label: t`Report`,
        action() {
          reportIssue(getErrorLogObject(error, { errorMessage }));
        },
        isPrimary: true,
      },
      { label: t`Cancel`, action() {}, isEscape: true },
    ];
  }

  await showDialog(options);
  if (dontThrow) {
    if (fyo.store.isDevelopment) {
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

  await ipcRenderer.invoke(IPC_ACTIONS.SHOW_ERROR, { title, content });
}

// Wrapper Functions

export function getErrorHandled(func: Function) {
  return async function errorHandled(...args: unknown[]) {
    try {
      return await func(...args);
    } catch (error) {
      await handleError(false, error as Error, {
        functionName: func.name,
        functionArgs: args,
      });

      throw error;
    }
  };
}

export function getErrorHandledSync(func: Function) {
  return function errorHandledSync(...args: unknown[]) {
    try {
      return func(...args);
    } catch (error) {
      handleError(false, error as Error, {
        functionName: func.name,
        functionArgs: args,
      }).then(() => {
        throw error;
      });
    }
  };
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

  body.push(`**Language**: \`${fyo.config.get(ConfigKeys.Language)}\``);
  if (fyo.singles.SystemSettings?.countryCode) {
    body.push(`**Country**: \`${fyo.singles.SystemSettings.countryCode}\``);
  }

  const url = [baseUrl, `body=${body.join('\n')}`].join('&');
  return encodeURI(url);
}

export function reportIssue(errorLogObj?: ErrorLog) {
  const urlQuery = getIssueUrlQuery(errorLogObj);
  ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, urlQuery);
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
