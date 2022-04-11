import Avatar from '@/components/Avatar.vue';
import Toast from '@/components/Toast.vue';
import router from '@/router';
import { ipcRenderer } from 'electron';
import frappe, { t } from 'frappe';
import { isPesa } from 'frappe/utils';
import { DEFAULT_LANGUAGE } from 'frappe/utils/consts';
import { setLanguageMapOnTranslationString } from 'frappe/utils/translation';
import { IPC_ACTIONS, IPC_MESSAGES } from 'utils/messages';
import { createApp, h } from 'vue';
import config from './config';
import { handleErrorWithDialog } from './errorHandling';
import { languageCodeMap } from './languageCodeMap';

export async function showMessageDialog({
  message,
  description,
  buttons = [],
}) {
  const options = {
    message,
    detail: description,
    buttons: buttons.map((a) => a.label),
  };

  const { response } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_DIALOG_RESPONSE,
    options
  );

  let button = buttons[response];
  if (button && button.action) {
    button.action();
  }
}

export function deleteDocWithPrompt(doc) {
  return new Promise((resolve) => {
    showMessageDialog({
      message: t`Are you sure you want to delete ${doc.doctype} ${doc.name}?`,
      description: t`This action is permanent`,
      buttons: [
        {
          label: t`Delete`,
          action: () => {
            doc
              .delete()
              .then(() => resolve(true))
              .catch((e) => {
                handleErrorWithDialog(e, doc);
              });
          },
        },
        {
          label: t`Cancel`,
          action() {
            resolve(false);
          },
        },
      ],
    });
  });
}

export async function cancelDocWithPrompt(doc) {
  let description = t`This action is permanent`;
  if (['SalesInvoice', 'PurchaseInvoice'].includes(doc.doctype)) {
    const payments = (
      await frappe.db.getAll('Payment', {
        fields: ['name'],
        filters: { cancelled: false },
      })
    ).map(({ name }) => name);

    const query = (
      await frappe.db.getAll('PaymentFor', {
        fields: ['parent'],
        filters: {
          referenceName: doc.name,
        },
      })
    ).filter(({ parent }) => payments.includes(parent));

    const paymentList = [...new Set(query.map(({ parent }) => parent))];

    if (paymentList.length === 1) {
      description = t`This action is permanent and will cancel the following payment: ${paymentList[0]}`;
    } else if (paymentList.length > 1) {
      description = t`This action is permanent and will cancel the following payments: ${paymentList.join(
        ', '
      )}`;
    }
  }

  return new Promise((resolve) => {
    showMessageDialog({
      message: t`Are you sure you want to cancel ${doc.doctype} ${doc.name}?`,
      description,
      buttons: [
        {
          label: t`Yes`,
          async action() {
            const entryDoc = await frappe.doc.getDoc(doc.doctype, doc.name);
            entryDoc.cancelled = 1;
            await entryDoc.update();
            entryDoc
              .revert()
              .then(() => resolve(true))
              .catch((e) => {
                handleErrorWithDialog(e, doc);
              });
          },
        },
        {
          label: t`No`,
          action() {
            resolve(false);
          },
        },
      ],
    });
  });
}

export function partyWithAvatar(party) {
  return {
    data() {
      return {
        imageURL: null,
        label: null,
      };
    },
    components: {
      Avatar,
    },
    async mounted() {
      const p = await frappe.db.get('Party', party);
      this.imageURL = p.image;
      this.label = party;
    },
    template: `
      <div class="flex items-center" v-if="label">
        <Avatar class="flex-shrink-0" :imageURL="imageURL" :label="label" size="sm" />
        <span class="ml-2 truncate">{{ label }}</span>
      </div>
    `,
  };
}

function getShowFields(doctype) {
  if (doctype === 'Party') {
    return ['customer'];
  }
  return [];
}

export function openQuickEdit({
  doctype,
  name,
  hideFields,
  showFields,
  defaults = {},
}) {
  let currentRoute = router.currentRoute.value;
  let query = currentRoute.query;
  let method = 'push';
  if (query.edit && query.doctype === doctype) {
    // replace the current route if we are
    // editing another document of the same doctype
    method = 'replace';
  }
  if (query.name === name) return;

  if (defaults?.for?.[0] === 'not in') {
    const purpose = defaults.for?.[1]?.[0];
    defaults = Object.assign({
      for:
        purpose === 'sales'
          ? 'purchases'
          : purpose === 'purchases'
          ? 'sales'
          : 'both',
    });
  }

  if (defaults?.for?.[0] === 'not in' && defaults?.for?.[1] === 'sales') {
    defaults = Object.assign({ for: 'purchases' });
  }

  router[method]({
    query: {
      edit: 1,
      doctype,
      name,
      showFields: showFields ?? getShowFields(doctype),
      hideFields,
      valueJSON: stringifyCircular(defaults),
      lastRoute: currentRoute,
    },
  });
}

export async function makePDF(html, savePath) {
  await ipcRenderer.invoke(IPC_ACTIONS.SAVE_HTML_AS_PDF, html, savePath);
  showExportInFolder(frappe.t`Save as PDF Successful`, savePath);
}

export function showExportInFolder(message, filePath) {
  showToast({
    message,
    actionText: frappe.t`Open Folder`,
    type: 'success',
    action: async () => {
      await showItemInFolder(filePath);
    },
  });
}

export async function saveData(data, savePath) {
  await ipcRenderer.invoke(IPC_ACTIONS.SAVE_DATA, data, savePath);
}

export async function showItemInFolder(filePath) {
  await ipcRenderer.send(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, filePath);
}

export function getActionsForDocument(doc) {
  if (!doc) return [];

  let deleteAction = {
    component: {
      template: '<span class="text-red-700">{{ t`Delete` }}</span>',
    },
    condition: (doc) =>
      !doc.isNew() && !doc.submitted && !doc.meta.isSingle && !doc.cancelled,
    action: () =>
      deleteDocWithPrompt(doc).then((res) => {
        if (res) {
          routeTo(`/list/${doc.doctype}`);
        }
      }),
  };

  let cancelAction = {
    component: {
      template: '<span class="text-red-700">{{ t`Cancel` }}</span>',
    },
    condition: (doc) => doc.submitted && !doc.cancelled,
    action: () => {
      cancelDocWithPrompt(doc).then((res) => {
        if (res) {
          router.push(`/list/${doc.doctype}`);
        }
      });
    },
  };

  const isSubmittable = !!doc.meta.isSubmittable;
  const duplicateAction = {
    label: frappe.t`Duplicate`,
    condition: (doc) =>
      ((isSubmittable && doc && doc.submitted) || !isSubmittable) &&
      !doc._notInserted &&
      !(doc.cancelled || false),
    action: () => {
      showMessageDialog({
        message: t`Duplicate ${doc.doctype} ${doc.name}?`,
        buttons: [
          {
            label: t`Yes`,
            async action() {
              doc.duplicate();
            },
          },
          {
            label: t`No`,
            action() {
              resolve(false);
            },
          },
        ],
      });
    },
  };

  let actions = [
    ...(doc.meta.actions || []),
    duplicateAction,
    deleteAction,
    cancelAction,
  ]
    .filter((d) => (d.condition ? d.condition(doc) : true))
    .map((d) => {
      return {
        label: d.label,
        component: d.component,
        action: d.action.bind(this, doc, router),
      };
    });

  return actions;
}

export async function runWindowAction(name) {
  switch (name) {
    case 'close':
      ipcRenderer.send(IPC_MESSAGES.CLOSE_CURRENT_WINDOW);
      break;
    case 'minimize':
      ipcRenderer.send(IPC_MESSAGES.MINIMIZE_CURRENT_WINDOW);
      break;
    case 'maximize':
      const maximizing = await ipcRenderer.invoke(
        IPC_ACTIONS.TOGGLE_MAXIMIZE_CURRENT_WINDOW
      );
      name = maximizing ? name : 'unmaximize';
      break;
  }
  return name;
}

export function getInvoiceStatus(doc) {
  let status = `Unpaid`;
  if (!doc.submitted) {
    status = 'Draft';
  }
  if (doc.submitted === 1 && doc.outstandingAmount.isZero()) {
    status = 'Paid';
  }
  if (doc.cancelled === 1) {
    status = 'Cancelled';
  }
  return status;
}

export function routeTo(route) {
  let routeOptions = route;
  if (
    typeof route === 'string' &&
    route === router.currentRoute.value.fullPath
  ) {
    return;
  }

  if (typeof route === 'string') {
    routeOptions = { path: route };
  }

  router.push(routeOptions);
}

export function fuzzyMatch(keyword, candidate) {
  const keywordLetters = [...keyword];
  const candidateLetters = [...candidate];

  let keywordLetter = keywordLetters.shift();
  let candidateLetter = candidateLetters.shift();

  let isMatch = true;
  let distance = 0;

  while (keywordLetter && candidateLetter) {
    if (keywordLetter.toLowerCase() === candidateLetter.toLowerCase()) {
      keywordLetter = keywordLetters.shift();
    } else {
      distance += 1;
    }

    candidateLetter = candidateLetters.shift();
  }

  if (keywordLetter !== undefined) {
    distance = -1;
    isMatch = false;
  } else {
    distance += candidateLetters.length;
  }

  return { isMatch, distance };
}

export function openSettings(tab) {
  routeTo({ path: '/settings', query: { tab } });
}

export async function getSavePath(name, extention) {
  let { canceled, filePath } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_SAVE_FILEPATH,
    {
      title: t`Select Folder`,
      defaultPath: `${name}.${extention}`,
    }
  );

  if (filePath && !filePath.endsWith(extention)) {
    filePath = filePath + extention;
  }

  return { canceled, filePath };
}

function replaceAndAppendMount(app, replaceId) {
  const fragment = document.createDocumentFragment();
  const target = document.getElementById(replaceId);
  if (target === null) {
    return;
  }

  const parent = target.parentElement;
  const clone = target.cloneNode();

  app.mount(fragment);
  target.replaceWith(fragment);
  parent.append(clone);
}

export function showToast(props) {
  const toast = createApp({
    render() {
      return h(Toast, { ...props });
    },
  });
  replaceAndAppendMount(toast, 'toast-target');
}

export async function getIsSetupComplete() {
  try {
    const { setupComplete } = await frappe.getSingle('AccountingSettings');
    return !!setupComplete;
  } catch {
    return false;
  }
}

export async function getCurrency() {
  let currency = frappe?.AccountingSettings?.currency ?? undefined;

  if (!currency) {
    try {
      currency = (
        await frappe.db.getSingleValues({
          fieldname: 'currency',
          parent: 'AccountingSettings',
        })
      )[0].value;
    } catch (err) {
      currency = undefined;
    }
  }

  return currency;
}

export async function callInitializeMoneyMaker(currency, force = false) {
  currency ??= await getCurrency();
  if (!force && !currency && frappe.pesa) {
    return;
  }

  if (!force && currency && frappe.pesa().options.currency === currency) {
    return;
  }
  await frappe.initializeMoneyMaker(currency);
}

export function convertPesaValuesToFloat(obj) {
  Object.keys(obj).forEach((key) => {
    if (!isPesa(obj[key])) return;

    obj[key] = obj[key].float;
  });
}

export function formatXLabels(label) {
  // Format: Mmm YYYY -> Mm YY
  let [month, year] = label.split(' ');
  year = year.slice(2);

  return `${month} ${year}`;
}

export function stringifyCircular(
  obj,
  ignoreCircular = false,
  convertDocument = false
) {
  const cacheKey = [];
  const cacheValue = [];

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

    if (convertDocument && value instanceof frappe.Document) {
      return value.getValidDict();
    }

    return value;
  });
}

export async function checkForUpdates(force = false) {
  ipcRenderer.invoke(IPC_ACTIONS.CHECK_FOR_UPDATES, force);
  await setLanguageMap();
}

async function fetchAndSetLanguageMap(code) {
  const { success, message, languageMap } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_LANGUAGE_MAP,
    code
  );

  if (!success) {
    showToast({ type: 'error', message });
  } else {
    setLanguageMapOnTranslationString(languageMap);
  }

  return success;
}

export async function setLanguageMap(initLanguage, dontReload = false) {
  const oldLanguage = config.get('language');
  initLanguage ??= oldLanguage;
  const [code, language, usingDefault] = getLanguageCode(
    initLanguage,
    oldLanguage
  );

  let success = true;
  if (code === 'en') {
    setLanguageMapOnTranslationString(undefined);
  } else {
    success = await fetchAndSetLanguageMap(code);
  }

  if (success && !usingDefault) {
    config.set('language', language);
  }

  if (!dontReload && success && initLanguage !== oldLanguage) {
    await ipcRenderer.send(IPC_MESSAGES.RELOAD_MAIN_WINDOW);
  }
  return success;
}

function getLanguageCode(initLanguage, oldLanguage) {
  let language = initLanguage ?? oldLanguage;
  let usingDefault = false;

  if (!language) {
    language = DEFAULT_LANGUAGE;
    usingDefault = true;
  }
  const code = languageCodeMap[language] ?? 'en';
  return [code, language, usingDefault];
}

export function getCOAList() {
  if (!frappe.temp.coaList) {
    const coaList = [
      { name: t`Standard Chart of Accounts`, countryCode: '' },

      { countryCode: 'ae', name: 'U.A.E - Chart of Accounts' },
      {
        countryCode: 'ca',
        name: 'Canada - Plan comptable pour les provinces francophones',
      },
      { countryCode: 'gt', name: 'Guatemala - Cuentas' },
      { countryCode: 'hu', name: 'Hungary - Chart of Accounts' },
      { countryCode: 'id', name: 'Indonesia - Chart of Accounts' },
      { countryCode: 'in', name: 'India - Chart of Accounts' },
      { countryCode: 'mx', name: 'Mexico - Plan de Cuentas' },
      { countryCode: 'ni', name: 'Nicaragua - Catalogo de Cuentas' },
      { countryCode: 'nl', name: 'Netherlands - Grootboekschema' },
      { countryCode: 'sg', name: 'Singapore - Chart of Accounts' },
    ];
    frappe.temp.coaList = coaList;
  }
  return frappe.temp.coaList;
}

export function invertMap(map) {
  const keys = Object.keys(map);
  const inverted = {};
  for (const key of keys) {
    const val = map[key];
    inverted[val] = key;
  }

  return inverted;
}
