import { Keys } from 'utils/types';
import { watch } from 'vue';
import { getIsMac } from './misc';
import { useKeys } from './vueUtils';

interface ModMap {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  repeat: boolean;
}

type Mod = keyof ModMap;
type Context = unknown;
type ShortcutFunction = () => void;
type ShortcutConfig = {
  callback: ShortcutFunction;
  propagate: boolean;
};

type ShortcutMap = Map<Context, Map<string, ShortcutConfig>>;

const mods: Readonly<Mod[]> = ['alt', 'ctrl', 'meta', 'repeat', 'shift'];

export class Shortcuts {
  keys: Keys;
  isMac: boolean;
  contextStack: Context[];
  shortcuts: ShortcutMap;
  modMap: Partial<Record<Mod, boolean>>;

  constructor(keys?: Keys) {
    this.contextStack = [];
    this.modMap = {};
    this.keys = keys ?? useKeys();
    this.shortcuts = new Map();
    this.isMac = getIsMac();

    watch(this.keys, (keys) => {
      this.#trigger(keys);
    });
  }

  #trigger(keys: Keys) {
    const key = this.getKey(Array.from(keys.pressed), keys);
    for (const context of this.contextStack.reverse()) {
      const obj = this.shortcuts.get(context)?.get(key);
      if (!obj) {
        continue;
      }

      obj.callback();
      if (!obj.propagate) {
        break;
      }
    }
  }

  /**
   * Check if a context is present or if a shortcut
   * is present in a context.
   *
   *
   * @param context context in which the shortcut is to be checked
   * @param shortcut shortcut that is to be checked
   * @returns
   */
  has(context: Context, shortcut?: string[]) {
    if (!shortcut) {
      return this.shortcuts.has(context);
    }

    const contextualShortcuts = this.shortcuts.get(context);
    if (!contextualShortcuts) {
      return false;
    }

    const key = this.getKey(shortcut);
    return contextualShortcuts.has(key);
  }

  /**
   * Assign a function to a shortcut in a given context.
   *
   * @param context context object to which the shortcut belongs
   * @param shortcut keyboard event codes used as shortcut chord
   * @param callback function to be called when the shortcut is pressed
   * @param propagate whether to check and executs shortcuts in parent contexts
   * @param removeIfSet whether to delete the set shortcut
   */
  set(
    context: Context,
    shortcut: string[],
    callback: ShortcutFunction,
    propagate: boolean = false,
    removeIfSet: boolean = true
  ) {
    if (!this.shortcuts.has(context)) {
      this.shortcuts.set(context, new Map());
    }
    const contextualShortcuts = this.shortcuts.get(context)!;

    const key = this.getKey(shortcut);
    if (removeIfSet) {
      contextualShortcuts.delete(key);
    }

    if (contextualShortcuts.has(key)) {
      throw new Error(`Shortcut ${key} already exists.`);
    }

    this.#pushContext(context);
    contextualShortcuts.set(key, { callback, propagate });
  }

  /**
   * Either delete a single shortcut or all the shortcuts in
   * a given context.
   *
   * @param context context from which the shortcut is to be removed
   * @param shortcut shortcut that is to be deleted
   * @returns boolean indicating success
   */
  delete(context: Context, shortcut?: string[]): boolean {
    if (!shortcut) {
      this.#removeContext(context);
      return this.shortcuts.delete(context);
    }

    const contextualShortcuts = this.shortcuts.get(context);
    if (!contextualShortcuts) {
      return false;
    }

    const key = this.getKey(shortcut);
    return contextualShortcuts.delete(key);
  }

  /**
   * Converts shortcuts list and modMap to a string to be
   * used as a shortcut key.
   *
   * @param shortcut array of shortcut keys
   * @param modMap boolean map of mod keys to be used
   * @returns string to be used as the shortcut Map key
   */
  getKey(shortcut: string[], modMap?: Partial<ModMap>): string {
    const _modMap = modMap || this.modMap;
    this.modMap = {};

    const shortcutString = shortcut.sort().join('+');
    const modString = mods.filter((k) => _modMap[k]).join('+');
    if (shortcutString && modString) {
      return modString + '+' + shortcutString;
    }

    if (!modString) {
      return shortcutString;
    }

    if (!shortcutString) {
      return modString;
    }

    return '';
  }

  #pushContext(context: Context) {
    this.#removeContext(context);
    this.contextStack.push(context);
  }

  #removeContext(context: Context) {
    const index = this.contextStack.indexOf(context);
    if (index === -1) {
      return;
    }

    this.contextStack = [
      this.contextStack.slice(0, index),
      this.contextStack.slice(index + 1),
    ].flat();
  }

  /**
   * Shortcut Modifiers
   */
  get alt() {
    this.modMap['alt'] = true;
    return this;
  }

  get ctrl() {
    this.modMap['ctrl'] = true;
    return this;
  }

  get meta() {
    this.modMap['meta'] = true;
    return this;
  }

  get shift() {
    this.modMap['shift'] = true;
    return this;
  }

  get repeat() {
    this.modMap['repeat'] = true;
    return this;
  }

  get pmod() {
    if (this.isMac) {
      return this.meta;
    }

    return this.ctrl;
  }
}
