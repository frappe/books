import Dialog from 'src/components/Dialog.vue';
import Toast from 'src/components/Toast.vue';
import { t } from 'fyo';
import { App, createApp, h } from 'vue';
import { DialogButton, DialogOptions, ToastOptions } from './types';

type DialogReturn<DO extends DialogOptions> = DO['buttons'] extends {
  handler: () => Promise<infer O> | infer O;
}[]
  ? O
  : void;

export async function showDialog<DO extends DialogOptions>(options: DO) {
  const { title, description } = options;

  const preWrappedButtons: DialogButton[] = options.buttons ?? [
    { label: t`Okay`, handler: () => {} },
  ];

  return new Promise(async (resolve) => {
    const buttons = preWrappedButtons!.map(({ label, handler, isPrimary }) => {
      return {
        label,
        handler: async () => {
          resolve(await handler());
        },
        isPrimary,
      };
    });

    const dialogApp = createApp({
      render() {
        return h(Dialog, { title, description, buttons });
      },
    });

    const fragment = document.createDocumentFragment();

    // @ts-ignore
    dialogApp.mount(fragment);
    document.body.append(fragment);
  }) as DialogReturn<DO>;
}

export async function showToast(options: ToastOptions) {
  const toastApp = createApp({
    render() {
      return h(Toast, { ...options });
    },
  });

  replaceAndAppendMount(toastApp, 'toast-target');
}

function replaceAndAppendMount(app: App<Element>, replaceId: string) {
  const fragment = document.createDocumentFragment();
  const target = document.getElementById(replaceId);
  if (target === null) {
    return;
  }

  const parent = target.parentElement;
  const clone = target.cloneNode();

  // @ts-ignore
  app.mount(fragment);
  target.replaceWith(fragment);
  parent!.append(clone);
}

// @ts-ignore
window.st = () => showToast({ message: 'peace' });

// @ts-ignore
window.sd = async function () {
  const options = {
    title: 'Do This?',
    description: 'Give me confirmation, should I do this?',
    buttons: [
      { label: 'Yes', handler: () => 'do it', isPrimary: true },
      { label: 'No', handler: () => 'dont do it' },
    ],
  };

  const ret = await showDialog(options);
  console.log(ret);
  return ret;
};
