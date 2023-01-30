import { reactive, ref } from 'vue';
import { FocusedDocContextSet } from './misc';

export const docsPathRef = ref<string>('');
export const systemLanguageRef = ref<string>('');
export const focusedDocsRef = reactive<FocusedDocContextSet>(
  new FocusedDocContextSet()
);
