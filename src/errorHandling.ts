import { ipcRenderer } from 'electron';
import frappe, { t } from 'frappe';
import {
  DuplicateEntryError,
  LinkValidationError,
  MandatoryError,
  ValidationError,
} from 'frappe/common/errors';
import BaseDocument from 'frappe/model/document';
import { IPC_ACTIONS } from './messages';
import { showMessageDialog, showToast } from './utils';

interface ErrorLog {
  name: string;
  message: string;
  stack?: string;
  more?: Object;
}

function shouldNotStore(error: Error) {
  return [MandatoryError, ValidationError].some(
    (errorClass) => error instanceof errorClass
  );
}

function reportError(errorLogObj: ErrorLog) {
  // push errorlog to frappebooks.com
  console.log(errorLogObj);
}

function getToastProps(errorLogObj: ErrorLog) {
  const props = {
    message: t`Error: ` + errorLogObj.name,
    type: 'error',
  };

  // @ts-ignore
  if (!frappe.SystemSettings.autoReportErrors) {
    Object.assign(props, {
      actionText: t`Report Error`,
      action: () => {
        reportError(errorLogObj);
      },
    });
  }

  return props;
}

export function handleError(
  shouldLog: boolean,
  error: Error,
  more: object = {}
) {
  if (shouldLog) {
    console.error(error);
  }

  if (shouldNotStore(error)) {
    return;
  }

  const { name, stack, message } = error;
  const errorLogObj: ErrorLog = { name, stack, message, more };

  // @ts-ignore
  frappe.errorLog.push(errorLogObj);

  showToast(getToastProps(errorLogObj));
  // @ts-ignore
  if (frappe.SystemSettings.autoReportErrors) {
    reportError(errorLogObj);
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
