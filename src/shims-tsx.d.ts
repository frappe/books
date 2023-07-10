import type { IPC } from 'main/preload';
import Vue, { VNode } from 'vue';

declare const ipc: IPC;
declare global {
  namespace JSX {
    type Element = VNode;
    type ElementClass = Vue;
    interface IntrinsicElements {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [elem: string]: any;
    }
  }

  interface Window {
    ipc: IPC;
  }
}
