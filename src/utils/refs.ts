import { reactive, ref } from 'vue';

export const showSidebar = ref(true);
export const docsPathRef = ref<string>('');
export const systemLanguageRef = ref<string>('');
export const historyState = reactive({
  forward: !!history.state?.forward,
  back: !!history.state?.back,
});
