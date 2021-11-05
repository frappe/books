<template>
  <div class="flex">
    <div
      @click="action('close')"
      class="w-3 h-3 rounded-full"
      :class="getColorClasses('close')"
    ></div>
    <div
      @click="action('minimize')"
      class="ml-2 w-3 h-3 rounded-full"
      :class="getColorClasses('minimize')"
    ></div>
    <div
      @click="action('maximize')"
      class="ml-2 w-3 h-3 rounded-full"
      :class="getColorClasses('maximize')"
    ></div>
  </div>
</template>

<script>
import { runWindowAction } from '@/utils';
import { ipcRenderer } from 'electron';

export default {
  name: 'WindowControls',
  props: {
    buttons: {
      type: Array,
      default: () => ['close', 'minimize', 'maximize'],
    },
  },
  methods: {
    async action(name) {
      if (this.buttons.includes(name)) {
        const actionRan = await runWindowAction(name);
        this.$emit(actionRan);
      }
    },
    getColorClasses(name) {
      let classes = {
        close: 'bg-red-500 hover:bg-red-700',
        minimize: 'bg-yellow-500 hover:bg-yellow-700',
        maximize: 'bg-green-500 hover:bg-green-700',
      }[name];

      if (this.buttons.includes(name)) {
        return classes;
      }

      return 'bg-gray-500';
    },
  },
};
</script>
