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
import electron from 'electron';

export default {
  name: 'WindowControls',
  props: {
    buttons: {
      type: Array,
      default: () => ['close', 'minimize', 'maximize']
    }
  },
  methods: {
    action(name) {
      if (this.buttons.includes(name)) {
        let window = electron.remote.getCurrentWindow();
        if (name === 'maximize' && window.isMaximized()) {
          name = 'unmaximize';
        }
        this.$emit(name);
        window[name]();
      }
    },
    getColorClasses(name) {
      let classes = {
        close: 'bg-red-500 hover:bg-red-700',
        minimize: 'bg-yellow-500 hover:bg-yellow-700',
        maximize: 'bg-green-500 hover:bg-green-700'
      }[name];

      if (this.buttons.includes(name)) {
        return classes;
      }

      return 'bg-gray-500';
    }
  }
};
</script>
