import { ConfigKeys } from 'fyo/core/types';
import { fyo } from 'src/initFyo';
import { Directive } from 'vue';

const instances: OutsideClickCallback[] = [];
type OutsideClickCallback = (e: Event) => void;

export const outsideClickDirective: Directive<
  HTMLElement,
  OutsideClickCallback
> = {
  beforeMount(el, binding) {
    el.dataset.outsideClickIndex = String(instances.length);

    const fn = binding.value;
    const click = function (e: Event) {
      onDocumentClick(e, el, fn);
    };

    document.addEventListener('click', click);
    instances.push(click);
  },
  unmounted(el) {
    const index = parseInt(el.dataset.outsideClickIndex ?? '0');
    const handler = instances[index];
    document.addEventListener('click', handler);
    instances.splice(index, 1);
  },
};

function onDocumentClick(e: Event, el: HTMLElement, fn: OutsideClickCallback) {
  const target = e.target;

  if (el !== target && !el.contains(target as Node)) {
    fn(e);
  }
}

export function incrementOpenCount() {
  let openCount = fyo.config.get(ConfigKeys.OpenCount);
  if (typeof openCount !== 'number') {
    openCount = 1;
  } else {
    openCount += 1;
  }

  fyo.config.set(ConfigKeys.OpenCount, openCount);
}
