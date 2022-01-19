import frappe from 'frappejs';
import { MandatoryError, ValidationError } from 'frappejs/common/errors';

function shouldNotStore(error) {
  return [MandatoryError, ValidationError].some(
    (errorClass) => error instanceof errorClass
  );
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

  // Do something cool
}

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
