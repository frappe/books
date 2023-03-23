import { Keys } from 'utils/types';
import {
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from 'vue';
import { getIsMac } from './misc';
import { Shortcuts } from './shortcuts';
import { DocRef } from './types';
import {
  commonDocCancel,
  commonDocSubmit,
  commonDocSync,
  commongDocDelete,
  showCannotCancelOrDeleteToast,
  showCannotSaveOrSubmitToast,
} from './ui';

export function useKeys() {
  const isMac = getIsMac();
  const keys: Keys = reactive({
    pressed: new Set<string>(),
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
    repeat: false,
  });

  const keydownListener = (e: KeyboardEvent) => {
    keys.alt = e.altKey;
    keys.ctrl = e.ctrlKey;
    keys.meta = e.metaKey;
    keys.shift = e.shiftKey;
    keys.repeat = e.repeat;

    const { code } = e;
    if (
      code.startsWith('Alt') ||
      code.startsWith('Control') ||
      code.startsWith('Meta') ||
      code.startsWith('Shift')
    ) {
      return;
    }

    keys.pressed.add(code);
  };

  const keyupListener = (e: KeyboardEvent) => {
    const { code } = e;
    if (code.startsWith('Meta') && isMac) {
      return keys.pressed.clear();
    }

    keys.pressed.delete(code);
  };

  onMounted(() => {
    window.addEventListener('keydown', keydownListener);
    window.addEventListener('keyup', keyupListener);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', keydownListener);
    window.removeEventListener('keyup', keyupListener);
  });

  return keys;
}

export function useMouseLocation() {
  const loc = ref({ clientX: 0, clientY: 0 });

  const mousemoveListener = (e: MouseEvent) => {
    loc.value.clientX = e.clientX;
    loc.value.clientY = e.clientY;
  };

  onMounted(() => {
    window.addEventListener('mousemove', mousemoveListener);
  });
  onUnmounted(() => {
    window.removeEventListener('mousemove', mousemoveListener);
  });

  return loc;
}

export function useDocShortcuts(
  shortcuts: Shortcuts,
  docRef: DocRef,
  name: string,
  isMultiple: boolean = true
) {
  let context = name;
  if (isMultiple) {
    context = name + '-' + Math.random().toString(36).slice(2, 6);
  }

  const syncOrSubmitCallback = () => {
    const doc = docRef.value;
    if (!doc) {
      return;
    }

    if (doc.canSave) {
      return commonDocSync(doc, true);
    }

    if (doc.canSubmit) {
      return commonDocSubmit(doc);
    }

    showCannotSaveOrSubmitToast(doc);
  };

  const cancelOrDeleteCallback = () => {
    const doc = docRef.value;
    if (!doc) {
      return;
    }

    if (doc.canCancel) {
      return commonDocCancel(doc);
    }

    if (doc.canDelete) {
      return commongDocDelete(doc);
    }

    showCannotCancelOrDeleteToast(doc);
  };

  onActivated(() => {
    shortcuts.pmod.set(context, ['KeyS'], syncOrSubmitCallback, false);
    shortcuts.pmod.set(context, ['Backspace'], cancelOrDeleteCallback, false);
  });

  onDeactivated(() => {
    shortcuts.delete(context);
  });

  return context;
}
