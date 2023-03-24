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

    fragmentMountComponent(dialogApp);
  }) as DialogReturn<DO>;
}

export async function showToast(options: ToastOptions) {
  const toastApp = createApp({
    render() {
      return h(Toast, { ...options });
    },
  });

  fragmentMountComponent(toastApp);
}

function fragmentMountComponent(app: App<Element>) {
  const fragment = document.createDocumentFragment();

  // @ts-ignore
  app.mount(fragment);
  document.body.append(fragment);
}
