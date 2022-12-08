import { onMounted, onUnmounted, Ref, ref, watch } from 'vue';

interface Keys {
  pressed: Set<string>;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  repeat: boolean;
}

export class Shortcuts {
  keys: Ref<Keys>;
  shortcuts: Map<string, Function>;

  constructor(keys?: Ref<Keys>) {
    this.keys = keys ?? useKeys();
    this.shortcuts = new Map();

    watch(this.keys, (keys) => {
      this.#trigger(keys);
    });
  }

  #trigger(keys: Keys) {
    const key = Array.from(keys.pressed).sort().join('+');
    this.shortcuts.get(key)?.();
  }

  has(shortcut: string[]) {
    const key = shortcut.sort().join('+');
    return this.shortcuts.has(key);
  }

  set(shortcut: string[], callback: Function, removeIfSet: boolean = true) {
    const key = shortcut.sort().join('+');
    if (removeIfSet) {
      this.shortcuts.delete(key);
    }

    if (this.shortcuts.has(key)) {
      throw new Error(`Shortcut ${key} already exists.`);
    }

    this.shortcuts.set(key, callback);
  }

  delete(shortcut: string[]) {
    const key = shortcut.sort().join('+');
    this.shortcuts.delete(key);
  }
}

export function useKeys() {
  const keys: Ref<Keys> = ref({
    pressed: new Set<string>(),
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
    repeat: false,
  });

  const keydownListener = (e: KeyboardEvent) => {
    keys.value.pressed.add(e.code);
    keys.value.alt = e.altKey;
    keys.value.ctrl = e.ctrlKey;
    keys.value.meta = e.metaKey;
    keys.value.shift = e.shiftKey;
    keys.value.repeat = e.repeat;
  };

  const keyupListener = (e: KeyboardEvent) => {
    keys.value.pressed.delete(e.code);

    // Key up won't trigger on macOS for other keys.
    if (e.code === 'MetaLeft') {
      keys.value.pressed.clear();
    }
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

export function getModKeyCode(platform: 'Windows' | 'Linux' | 'Mac') {
  if (platform === 'Mac') {
    return 'MetaLeft';
  }

  return 'CtrlLeft';
}
