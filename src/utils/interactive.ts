import { t } from 'fyo';
import Dialog from 'src/components/Dialog.vue';
import Toast from 'src/components/Toast.vue';
import { App, createApp, h } from 'vue';
import { getColorClass } from './colors';
import { DialogButton, DialogOptions, ToastOptions, ToastType } from './types';

export async function showDialog<DO extends DialogOptions>(options: DO) {
  const preWrappedButtons: DialogButton[] = options.buttons ?? [
    { label: t`Okay`, action: () => null, isEscape: true },
  ];

  const resultPromise = new Promise((resolve, reject) => {
    const buttons = preWrappedButtons.map((config) => {
      return {
        ...config,
        action: async () => {
          try {
            resolve(await config.action());
          } catch (error) {
            reject(error);
          }
        },
      };
    });

    const dialogApp = createApp({
      render() {
        return h(Dialog, { ...options, buttons });
      },
    });

    fragmentMountComponent(dialogApp);
  });

  return await resultPromise;
}

export function showToast(options: ToastOptions) {
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

export function getIconConfig(type: ToastType) {
  let iconName = 'alert-circle';
  if (type === 'warning') {
    iconName = 'alert-triangle';
  } else if (type === 'success') {
    iconName = 'check-circle';
  }

  const color = {
    info: 'blue',
    warning: 'orange',
    error: 'red',
    success: 'green',
  }[type];

  const iconColor = getColorClass(color ?? 'gray', 'text', 400);

  return { iconName, color, iconColor };
}
