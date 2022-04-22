<template>
  <div
    class="py-10 flex-1 bg-white flex justify-center items-center"
    :class="{
      'pointer-events-none': loadingDatabase,
      'window-drag': platform !== 'Windows',
    }"
  >
    <div
      class="w-full w-600 shadow rounded-lg border relative"
      style="height: 700px"
    >
      <div class="px-6 py-8">
        <h1 class="text-2xl font-semibold">
          {{ t`Welcome to Frappe Books` }}
        </h1>
        <p class="text-gray-600 text-base" v-if="!showFiles">
          {{
            t`Create a new file or select an existing one from your computer`
          }}
        </p>
        <p class="text-gray-600 text-base" v-if="showFiles">
          {{ t`Select a file to load the company transactions` }}
        </p>
      </div>
      <div class="px-12 mt-6 window-no-drag" v-if="!showFiles">
        <div class="flex">
          <div
            @click="newDatabase"
            class="
              w-1/2
              border
              rounded-xl
              flex flex-col
              items-center
              py-8
              px-5
              cursor-pointer
              hover:shadow
            "
          >
            <div
              class="w-14 h-14 rounded-full bg-blue-200 relative flex-center"
            >
              <div
                class="w-12 h-12 absolute rounded-full bg-blue-500 flex-center"
              >
                <feather-icon name="plus" class="text-white w-5 h-5" />
              </div>
            </div>
            <div class="mt-5 font-medium">
              <template
                v-if="loadingDatabase && fileSelectedFrom === 'New File'"
              >
                {{ t`Loading...` }}
              </template>
              <template v-else>
                {{ t`New File` }}
              </template>
            </div>
            <div class="mt-2 text-sm text-gray-600 text-center">
              {{ t`Create a new file and store it in your computer.` }}
            </div>
          </div>
          <div
            @click="existingDatabase"
            class="
              ml-6
              w-1/2
              border
              rounded-xl
              flex flex-col
              items-center
              py-8
              px-5
              cursor-pointer
              hover:shadow
            "
          >
            <div
              class="w-14 h-14 rounded-full bg-green-200 relative flex-center"
            >
              <div class="w-12 h-12 rounded-full bg-green-500 flex-center">
                <feather-icon name="upload" class="w-4 h-4 text-white" />
              </div>
            </div>
            <div class="mt-5 font-medium">
              <template
                v-if="loadingDatabase && fileSelectedFrom === 'Existing File'"
              >
                {{ t`Loading...` }}
              </template>
              <template v-else>
                {{ t`Existing File` }}
              </template>
            </div>
            <div class="mt-2 text-sm text-gray-600 text-center">
              {{ t`Load an existing .db file from your computer.` }}
            </div>
          </div>
        </div>
        <a
          v-if="files.length > 0"
          class="text-brand text-sm mt-4 inline-block cursor-pointer"
          @click="showFiles = true"
        >
          {{ t`Select from existing files` }}
        </a>
      </div>

      <div v-if="showFiles">
        <div class="px-12 mt-6">
          <div
            class="
              py-2
              px-4
              text-sm
              flex
              justify-between
              items-center
              hover:bg-gray-100
              cursor-pointer
              border-b
            "
            :class="{ 'border-t': i === 0 }"
            v-for="(file, i) in files"
            :key="file.filePath"
            @click="selectFile(file)"
          >
            <div class="flex items-baseline">
              <span>
                <template v-if="loadingDatabase && fileSelectedFrom === file">
                  {{ t`Loading...` }}
                </template>
                <template v-else>
                  {{ file.companyName }}
                </template>
              </span>
            </div>
            <div class="text-gray-700">
              {{ file.modified }}
            </div>
          </div>
        </div>
        <div class="px-12 mt-4">
          <a
            class="text-brand text-sm cursor-pointer"
            @click="showFiles = false"
          >
            {{ t`Select file manually` }}
          </a>
        </div>
      </div>
      <div
        class="w-full flex justify-end absolute px-6 py-6"
        style="top: 100%; transform: translateY(-100%)"
      >
        <LanguageSelector class="w-40" />
      </div>
    </div>
  </div>
</template>
<script>
import { ipcRenderer } from 'electron';
import fs from 'fs';
import { cloneDeep } from 'lodash';
import { DateTime } from 'luxon';
import LanguageSelector from 'src/components/Controls/LanguageSelector.vue';
import { fyo } from 'src/initFyo';
import { getSavePath } from 'src/utils/ipcCalls';
import { IPC_ACTIONS } from 'utils/messages';

export default {
  name: 'DatabaseSelector',
  emits: ['file-selected'],
  data() {
    return {
      loadingDatabase: false,
      fileSelectedFrom: null,
      showFiles: false,
      files: [],
    };
  },
  mounted() {
    this.setFiles();
    this.showFiles = this.files.length > 0;
  },
  watch: {
    showFiles() {
      this.setFiles();
    },
  },
  methods: {
    setFiles() {
      this.files = cloneDeep(fyo.config.get('files', [])).filter(
        ({ filePath }) => fs.existsSync(filePath)
      );

      for (const file of this.files) {
        const stats = fs.statSync(file.filePath);
        file.modified = DateTime.fromJSDate(stats.mtime).toRelative();
      }
    },
    async newDatabase() {
      this.fileSelectedFrom = 'New File';
      const { filePath, canceled } = await getSavePath('books', 'db');
      if (canceled || !filePath) {
        return;
      }

      this.connectToDatabase(filePath, true);
    },
    async existingDatabase() {
      this.fileSelectedFrom = 'Existing File';
      const filePath = (
        await ipcRenderer.invoke(IPC_ACTIONS.GET_OPEN_FILEPATH, {
          title: this.t`Select file`,
          properties: ['openFile'],
          filters: [{ name: 'SQLite DB File', extensions: ['db'] }],
        })
      )?.filePaths?.[0];
      this.connectToDatabase(filePath);
    },
    async selectFile(file) {
      this.fileSelectedFrom = file;
      await this.connectToDatabase(file.filePath);
    },
    async connectToDatabase(filePath, isNew) {
      if (!filePath) {
        return;
      }

      if (isNew) {
        this.$emit('file-selected', filePath, isNew);
        return;
      }

      this.$emit('file-selected', filePath, !!isNew);
    },
  },
  components: { LanguageSelector },
};
</script>
