import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import { ConfigKeys } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { TelemetrySetting } from 'fyo/telemetry/types';
import { BaseError, MandatoryError, ValidationError } from 'fyo/utils/errors';
import { ErrorLog } from 'fyo/utils/types';
import { IPC_ACTIONS, IPC_MESSAGES } from 'utils/messages';
import { fyo } from './initFyo';
import { getErrorMessage } from './utils';
import { ToastOptions } from './utils/types';
import { showMessageDialog, showToast } from './utils/ui';

function getCanLog(): boolean {
  const telemetrySetting = fyo.config.get(ConfigKeys.Telemetry);
  return telemetrySetting !== TelemetrySetting.dontLogAnything;
}

function shouldNotStore(error: Error) {
  return [MandatoryError, ValidationError].some(
    (errorClass) => error instanceof errorClass
  );
}

async function reportError(errorLogObj: ErrorLog, cb?: Function) {
  if (!errorLogObj.stack) {
    return;
  }

  const body = {
    error_name: errorLogObj.name,
    message: errorLogObj.message,
    stack: errorLogObj.stack,
    more: JSON.stringify(errorLogObj.more ?? {}),
  };

  if (fyo.store.isDevelopment) {
    console.log('errorHandling');
    console.log(body);
  }

  await ipcRenderer.invoke(IPC_ACTIONS.SEND_ERROR, JSON.stringify(body));
  cb?.();
}

function getToastProps(errorLogObj: ErrorLog, canLog: boolean, cb?: Function) {
  const props: ToastOptions = {
    message: t`Error: ` + errorLogObj.name,
    type: 'error',
  };

  // @ts-ignore
  if (!canLog) {
    Object.assign(props, {
      actionText: t`Report Error`,
      action: () => {
        reportIssue(errorLogObj);
        reportError(errorLogObj, cb);
      },
    });
  }

  return props;
}

export function getErrorLogObject(
  error: Error,
  more: Record<string, unknown>
): ErrorLog {
  const { name, stack, message } = error;
  const errorLogObj = { name, stack, message, more };

  // @ts-ignore
  fyo.errorLog.push(errorLogObj);

  return errorLogObj;
}

export function handleError(
  shouldLog: boolean,
  error: Error,
  more?: Record<string, unknown>,
  cb?: Function
) {
  fyo.telemetry.error(error.name);
  if (shouldLog) {
    console.error(error);
  }

  if (shouldNotStore(error)) {
    return;
  }

  const errorLogObj = getErrorLogObject(error, more ?? {});

  // @ts-ignore
  const canLog = getCanLog();
  if (canLog) {
    reportError(errorLogObj, cb);
  } else {
    showToast(getToastProps(errorLogObj, canLog, cb));
  }
}

export async function handleErrorWithDialog(error: Error, doc?: Doc) {
  const errorMessage = getErrorMessage(error, doc);
  handleError(false, error, { errorMessage, doc });

  const name = (error as BaseError).label ?? error.name;
  await showMessageDialog({ message: name, detail: errorMessage });
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
      handleError(false, error as Error, {
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
      });

      throw error;
    }
  };
}

function getIssueUrlQuery(errorLogObj?: ErrorLog): string {
  const baseUrl = 'https://github.com/frappe/books/issues/new?labels=bug';

  const body = ['<h2>Description</h2>', 'Add some description...', ''];

  if (errorLogObj) {
    body.push(
      '<h2>Error Info</h2>',
      '',
      `**Error**: _${errorLogObj.name}: ${errorLogObj.message}_`,
      ''
    );
  }

  if (errorLogObj?.stack) {
    body.push('**Stack**:', '```', errorLogObj.stack, '```', '');
  }

  const { fullPath } = (errorLogObj?.more as { fullPath?: string }) ?? {};
  if (fullPath) {
    body.push(`**Path**: \`${fullPath}\``);
  }

  const url = [baseUrl, `body=${body.join('\n')}`].join('&');
  return encodeURI(url);
}

export function reportIssue(errorLogObj?: ErrorLog) {
  const urlQuery = getIssueUrlQuery(errorLogObj);
  ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, urlQuery);
}
