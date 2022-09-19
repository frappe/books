<template>
  <div
    class="relative bg-white border rounded-full flex-center overflow-hidden"
    :class="{
      'w-20 h-20': size !== 'small',
      'w-12 h-12': size === 'small',
      'cursor-pointer': !isReadOnly,
    }"
    @mouseover="showEdit = true"
    @mouseleave="showEdit = false"
    @click="openFileSelector"
  >
    <template v-if="!value">
      <div
        v-if="letterPlaceholder"
        class="
          bg-gray-500
          flex
          h-full
          items-center
          justify-center
          text-white
          w-full
          text-4xl
        "
      >
        {{ letterPlaceholder }}
      </div>
      <svg
        v-else
        class="w-6 h-6 text-gray-300"
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
      class="
        absolute
        bottom-0
        text-gray-500 text-center text-xs
        pt-3
        pb-1
        select-none
      "
    >
      {{ !isReadOnly ? t`Edit` : '' }}
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { fyo } from 'src/initFyo';
import { IPC_ACTIONS } from 'utils/messages';
import Base from './Base';

export default {
  name: 'AttachImage',
  extends: Base,
  props: ['letterPlaceholder'],
  data() {
    return {
      showEdit: false,
    };
  },
  methods: {
    async openFileSelector() {
      if (this.isReadOnly) {
        return;
      }

      const options = {
        title: fyo.t`Select Image`,
        properties: ['openFile'],
        filters: [
          { name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
        ],
      };

      const { name, success, data } = await ipcRenderer.invoke(
        IPC_ACTIONS.GET_FILE,
        options
      );

      if (!success) {
        return;
      }

      const dataURL = await this.getDataURL(name, data);
      this.triggerChange(dataURL);
    },
    getDataURL(name, data) {
      const extension = name.split('.').at(-1);
      const blob = new Blob([data], { type: 'image/' + extension });

      return new Promise((resolve) => {
        const fr = new FileReader();
        fr.addEventListener('loadend', () => {
          resolve(fr.result);
        });

        fr.readAsDataURL(blob);
      });
    },
  },
};
</script>
