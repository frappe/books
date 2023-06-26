import { reactive, ref } from 'vue';
import type { HistoryState } from 'vue-router';

export const showSidebar = ref(true);
export const docsPathRef = ref<string>('');
export const systemLanguageRef = ref<string>('');
export const historyState = reactive({
  forward: !!(history.state as HistoryState)?.forward,
  back: !!(history.state as HistoryState)?.back,
});
