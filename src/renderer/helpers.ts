import { Directive } from 'vue';

type OutsideClickCallback = (e: Event) => void;
const instanceMap: Map<HTMLElement, OutsideClickCallback> = new Map();

export const outsideClickDirective: Directive<
  HTMLElement,
  OutsideClickCallback
> = {
  beforeMount(el, binding) {
    const clickHandler = function (e: Event) {
      onDocumentClick(e, el, binding.value);
    };

    removeHandlerIfPresent(el);
    instanceMap.set(el, clickHandler);
    document.addEventListener('click', clickHandler);
  },
  unmounted(el) {
    removeHandlerIfPresent(el);
  },
};

function onDocumentClick(e: Event, el: HTMLElement, fn: OutsideClickCallback) {
  const target = e.target as Node;
  if (el !== target && !el.contains(target)) {
    fn?.(e);
  }
}

function removeHandlerIfPresent(el: HTMLElement) {
  const clickHandler = instanceMap.get(el);
  if (!clickHandler) {
    return;
  }

  instanceMap.delete(el);
  document.removeEventListener('click', clickHandler);
}
