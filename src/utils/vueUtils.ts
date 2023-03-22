import { Keys } from 'utils/types';
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { getIsMac } from './misc';

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
