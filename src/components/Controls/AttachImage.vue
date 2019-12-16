<template>
  <div
    class="relative bg-white border rounded-full flex-center overflow-hidden cursor-pointer"
    :class="{ 'w-20 h-20': size !== 'small', 'w-16 h-16': size === 'small' }"
    @mouseover="showEdit = true"
    @mouseleave="showEdit = false"
    @click="openFileSelector"
  >
    <template v-if="!value">
      <div
        v-if="letterPlaceholder"
        class="bg-gray-500 flex h-full items-center justify-center text-white w-full text-4xl"
      >
        {{ letterPlaceholder }}
      </div>
      <svg
        v-else
        class="w-8 h-8 text-gray-500"
        viewBox="0 0 24 21"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 3h-4l-2-3H9L7 3H3a3 3 0 00-3 3v12a3 3 0 003 3h18a3 3 0 003-3V6a3 3 0 00-3-3zm-9 14a5 5 0 110-10 5 5 0 010 10z"
          fill="currentColor"
          fill-rule="nonzero"
        />
      </svg>
    </template>
    <div v-else>
      <img :src="value" />
    </div>
    <div
      v-show="showEdit"
      class="absolute inset-x-0 bottom-0 text-white text-center text-xs pt-3 pb-1"
      style="background-image: linear-gradient(-180deg, rgba(0,0,0,0.00) 0%, #a6a6a6 100%);"
    >
      {{ _('Edit') }}
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import { remote } from 'electron';
import Base from './Base';

export default {
  name: 'AttachImage',
  extends: Base,
  props: ['letterPlaceholder'],
  data() {
    return {
      showEdit: false
    };
  },
  methods: {
    openFileSelector() {
      remote.dialog.showOpenDialog(
        remote.getCurrentWindow(),
        {
          title: frappe._('Select Image'),
          properties: ['openFile'],
          filters: [
            { name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
          ]
        },
        async files => {
          if (files && files[0]) {
            let dataURL = await this.getDataURL(files[0]);
            this.triggerChange(dataURL);
          }
        }
      );
    },
    getDataURL(filePath) {
      let fs = require('fs');
      let path = require('path');
      let typedArray = fs.readFileSync(filePath);
      let extension = path.extname(filePath).slice(1);
      let blob = new Blob([typedArray.buffer], { type: 'image/' + extension });
      return new Promise(resolve => {
        let fr = new FileReader();
        fr.addEventListener('loadend', () => {
          resolve(fr.result);
        });
        fr.readAsDataURL(blob);
      });
    }
  }
};
</script>
