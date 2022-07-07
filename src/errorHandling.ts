import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import {
  MandatoryError,
  NotFoundError,
  ValidationError,
} from 'fyo/utils/errors';
import { ErrorLog } from 'fyo/utils/types';
import { truncate } from 'lodash';
import { IPC_ACTIONS, IPC_MESSAGES } from 'utils/messages';
import { fyo } from './initFyo';
import router from './router';
import { getErrorMessage, stringifyCircular } from './utils';
import { MessageDialogOptions, ToastOptions } from './utils/types';
import { showMessageDialog, showToast } from './utils/ui';

function shouldNotStore(error: Error) {
  return [MandatoryError, ValidationError, NotFoundError].some(
    (errorClass) => error instanceof errorClass
  );
}

async function reportError(errorLogObj: ErrorLog) {
  if (!errorLogObj.stack) {
    return;
  }

  const body = {
    error_name: errorLogObj.name,
    message: errorLogObj.message,
    stack: errorLogObj.stack,
    more: stringifyCircular(errorLogObj.more ?? {}),
  };

  if (fyo.store.isDevelopment) {
    console.log(body);
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
  const { name, stack, message } = error;
  const errorLogObj = { name, stack, message, more };

  // @ts-ignore
  fyo.errorLog.push(errorLogObj);

  return errorLogObj;
}

export async function handleError(
  shouldLog: boolean,
  error: Error,
  more?: Record<string, unknown>
) {
  if (shouldLog) {
    console.error(error);
  }

  if (shouldNotStore(error)) {
    return;
  }

  const errorLogObj = getErrorLogObject(error, more ?? {});

  await reportError(errorLogObj);
  const toastProps = getToastProps(errorLogObj);
  await showToast(toastProps);
}

export async function handleErrorWithDialog(
  error: Error,
  doc?: Doc,
  reportError?: false,
  dontThrow?: false
) {
  const errorMessage = getErrorMessage(error, doc);
  await handleError(false, error, { errorMessage, doc });

  const name = error.name ?? t`Error`;
  const options: MessageDialogOptions = { message: name, detail: errorMessage };

  if (reportError) {
    options.detail = truncate(options.detail, { length: 128 });
    options.buttons = [
      {
        label: t`Report`,
        action() {
          reportIssue(getErrorLogObject(error, { errorMessage }));
        },
      },
      { label: t`OK`, action() {} },
    ];
  }

  await showMessageDialog(options);
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

  body.push(`**Version**: \`${fyo.store.appVersion}\``);
  body.push(`**Platform**: \`${fyo.store.platform}\``);
  body.push(`**Path**: \`${router.currentRoute.value.fullPath}\``);

  const url = [baseUrl, `body=${body.join('\n')}`].join('&');
  return encodeURI(url);
}

export function reportIssue(errorLogObj?: ErrorLog) {
  const urlQuery = getIssueUrlQuery(errorLogObj);
  ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, urlQuery);
}
