import router from 'src/router';
import { Shortcuts } from './vueUtils';

export function setGlobalShortcuts(shortcuts: Shortcuts) {
  /**
   * PMod              : if macOS then Meta (⌘) else Ctrl, both Left and Right
   *
   * Backspace         : Go to the previous page
   */
  shortcuts.set(window, ['Backspace'], async () => {
    if (document.body !== document.activeElement) {
      return;
    }

    router.back();
  });
}
