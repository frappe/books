const csv2json = require('csvjson-csv2json');
const frappe = require('frappejs');
import Vue from 'vue';

export const fileImportHandler = (file, report) => {
  const reader = new FileReader();
  reader.onload = () => {
    const csv = reader.result;
    const json = csvToJsonHandler(csv);
    findMatchingReferences(json, report);
  };
  reader.readAsBinaryString(file);
};

export const csvToJsonHandler = csv => {
  const json = csv2json(csv, { parseNumbers: true });
  return json;
};

export const findMatchingReferences = async (json, report) => {
  const referenceField = Object.keys(json[0]).filter(field => {
    return field.toLowerCase().indexOf('ref') > -1 ? true : false;
  });
  const clearanceDateField = Object.keys(json[0]).filter(field => {
    return field.toLowerCase().indexOf('date') > -1 ? true : false;
  });
  const debitField = Object.keys(json[0]).filter(field => {
    return field.toLowerCase().indexOf('debit') > -1 ||
      field.toLowerCase().indexOf('deposit') > -1
      ? true
      : false;
  });
  const creditField = Object.keys(json[0]).filter(field => {
    return field.toLowerCase().indexOf('credit') > -1 ||
      field.toLowerCase().indexOf('withdraw') > -1
      ? true
      : false;
  });
  const balanceField = Object.keys(json[0]).filter(field => {
    return field.toLowerCase().indexOf('balance') > -1 ? true : false;
  });
  const references = json.map(row => {
    return row[referenceField];
  });
  const payments = await frappe.db.getAll({
    doctype: 'Payment',
    fields: ['*'],
    filters: {
      referenceId: ['in', references],
      paymentAccount: report.currentFilters.paymentAccount,
      clearanceDate: ['in', [null, undefined, '']]
    }
  });
  if (payments.length) {
    const entries = payments.map(payment => {
      const jsonEntry = json.filter(row => {
        return row[referenceField] === payment.referenceId;
      });
      return Object.assign(payment, jsonEntry[0]);
    });
    const normalizedEntries = entries.map(entry => {
      return {
        'Posting Date': frappe.format(entry.date, 'Date'),
        'Payment Entry': entry.name,
        'Ref/Cheq. ID': entry[referenceField],
        'Cr/Dr':
          frappe.parseNumber(entry[debitField]) > 0
            ? entry[debitField] + ' Dr.'
            : entry[creditField] + ' Cr.',
        'Clearance Date': entry[clearanceDateField]
      };
    });
    report.$modal.show({
      modalProps: {
        title: `Validate Matching Entries`,
        noFooter: true
      },
      component: require('../../src/components/ReconciliationValidation')
        .default,
      props: {
        entries: normalizedEntries,
        afterReconcile: async () => {
          await report.getReportData(report.currentFilters);
        }
      }
    });
  } else {
    frappe.call({
      method: 'show-dialog',
      args: {
        title: 'Message',
        message: 'No entries found with matching Ref / Cheque ID'
      }
    });
  }
};
