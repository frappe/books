<template>
  <div class="flex">
    <div @click="close" class="w-3 h-3 rounded-full bg-red-500 hover:bg-red-700"></div>
    <div @click="minimize" class="ml-2 w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-700"></div>
    <div @click="maximize" class="ml-2 w-3 h-3 rounded-full bg-green-500 hover:bg-green-700"></div>
  </div>
</template>

<script>
import electron from 'electron'

export default {
  name: 'WindowControls',
  methods: {
    close() {
      let window = electron.remote.getCurrentWindow();
      window.close();
    },
    minimize() {
      let window = electron.remote.getCurrentWindow();
      window.minimize();
    },
    maximize() {
      let window = electron.remote.getCurrentWindow();
      window.maximize();
    },
  }
}
</script>
