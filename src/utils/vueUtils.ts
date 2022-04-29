import { onMounted, onUnmounted, Ref, ref } from 'vue';

export function useKeys(callback?: (keys: Set<string>) => void) {
  const keys: Ref<Set<string>> = ref(new Set());

  const keydownListener = (e: KeyboardEvent) => {
    keys.value.add(e.code);
    callback?.(keys.value);
  };

  const keyupListener = (e: KeyboardEvent) => {
    keys.value.delete(e.code);

    // Key up won't trigger on macOS for other keys.
    if (e.code === 'MetaLeft') {
      keys.value.clear();
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
