import { ipcRenderer } from 'electron';
import frappe, { t } from 'frappe';
import {
  DuplicateEntryError,
  LinkValidationError,
  MandatoryError,
  ValidationError,
} from 'frappe/common/errors';
import BaseDocument from 'frappe/model/document';
import { IPC_ACTIONS, IPC_MESSAGES } from './messages';
import { showMessageDialog, showToast } from './utils';

interface ErrorLog {
  name: string;
  message: string;
  stack?: string;
  more?: object;
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
  await ipcRenderer.invoke(IPC_ACTIONS.SEND_ERROR, JSON.stringify(body));
  cb?.();
}

function getToastProps(errorLogObj: ErrorLog, cb?: Function) {
  const props = {
    message: t`Error: ` + errorLogObj.name,
    type: 'error',
  };

  // @ts-ignore
  if (!frappe.SystemSettings?.autoReportErrors) {
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

export function getErrorLogObject(error: Error, more: object = {}): ErrorLog {
  const { name, stack, message } = error;
  const errorLogObj = { name, stack, message, more };

  // @ts-ignore
  frappe.errorLog.push(errorLogObj);

  return errorLogObj;
}

export function handleError(
  shouldLog: boolean,
  error: Error,
  more: object = {},
  cb?: Function
) {
  if (shouldLog) {
    console.error(error);
  }

  if (shouldNotStore(error)) {
    return;
  }

  const errorLogObj = getErrorLogObject(error, more);

  // @ts-ignore
  if (frappe.SystemSettings?.autoReportErrors) {
    reportError(errorLogObj, cb);
  } else {
    showToast(getToastProps(errorLogObj, cb));
  }
}

export function getErrorMessage(e: Error, doc?: BaseDocument): string {
  let errorMessage = e.message || t`An error occurred.`;

  const { doctype, name }: { doctype?: unknown; name?: unknown } = doc ?? {};
  const canElaborate = !!(doctype && name);

  if (e instanceof LinkValidationError && canElaborate) {
    errorMessage = t`${doctype} ${name} is linked with existing records.`;
  } else if (e instanceof DuplicateEntryError && canElaborate) {
    errorMessage = t`${doctype} ${name} already exists.`;
  }

  return errorMessage;
}

export function handleErrorWithDialog(error: Error, doc?: BaseDocument) {
  const errorMessage = getErrorMessage(error, doc);
  handleError(false, error, { errorMessage, doc });

  showMessageDialog({ message: error.name, description: errorMessage });
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
