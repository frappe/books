import { ipcRenderer } from 'electron';
import frappe, { t } from 'frappe';
import { MandatoryError, ValidationError } from 'frappe/common/errors';
import { IPC_ACTIONS } from './messages';
import { showMessageDialog, showToast } from './utils';

function shouldNotStore(error) {
  return [MandatoryError, ValidationError].some(
    (errorClass) => error instanceof errorClass
  );
}

function reportError(errorLogObj) {
  // push errorlog to frappebooks.com
  console.log(errorLogObj);
}

function getToastProps(errorLogObj) {
  const props = {
    message: t`Error: ` + errorLogObj.name,
    type: 'error',
  };

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

export function handleError(shouldLog, error, more = {}) {
  if (shouldLog) {
    console.error(error);
  }

  if (shouldNotStore(error)) {
    return;
  }

  const { name, stack, message } = error;
  const errorLogObj = { name, stack, message, more };

  frappe.errorLog.push(errorLogObj);

  showToast(getToastProps(errorLogObj));
  if (frappe.SystemSettings.autoReportErrors) {
    reportError(errorLogObj);
  }
}

export function getErrorMessage(e, doc) {
  let errorMessage = e.message || t`An error occurred.`;
  const { doctype, name } = doc;
  const canElaborate = doctype && name;
  if (e.type === frappe.errors.LinkValidationError && canElaborate) {
    errorMessage = t`${doctype} ${name} is linked with existing records.`;
  } else if (e.type === frappe.errors.DuplicateEntryError && canElaborate) {
    errorMessage = t`${doctype} ${name} already exists.`;
  }
  return errorMessage;
}

export function handleErrorWithDialog(error, doc = {}) {
  let errorMessage = getErrorMessage(error, doc);
  handleError(false, error, { errorMessage, doc });

  showMessageDialog({ message: errorMessage });
  throw error;
}

export async function showErrorDialog({ title, content }) {
  // To be used for  show stopper errors
  title ??= t`Error`;
  content ??= t`Something has gone terribly wrong. Please check the console and raise an issue.`;

  await ipcRenderer.invoke(IPC_ACTIONS.SHOW_ERROR, { title, content });
}

// Wrapper Functions

export function getErrorHandled(func) {
  return async function errorHandled(...args) {
    try {
      return await func(...args);
    } catch (error) {
      handleError(false, error, {
        functionName: func.name,
        functionArgs: args,
      });

      throw error;
    }
  };
}

export function getErrorHandledSync(func) {
  return function errorHandledSync(...args) {
    try {
      return func(...args);
    } catch (error) {
      handleError(false, error, {
        functionName: func.name,
        functionArgs: args,
      });

      throw error;
    }
  };
}
