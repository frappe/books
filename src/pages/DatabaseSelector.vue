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
      <!-- Welcome to Frappe Books -->
      <div class="px-6 py-10">
        <h1 class="text-2xl font-semibold select-none">
          {{ t`Welcome to Frappe Books` }}
        </h1>
        <p class="text-gray-600 text-base select-none">
          {{
            t`Create a new file or select an existing one from your computer`
          }}
        </p>
      </div>

      <hr />

      <!-- New File (Blue Icon) -->
      <div
        @click="newDatabase"
        class="
          px-6
          h-18
          flex flex-row
          items-center
          cursor-pointer
          gap-4
          p-2
          hover:bg-gray-100
        "
      >
        <div class="w-8 h-8 rounded-full bg-blue-500 relative flex-center">
          <feather-icon name="plus" class="text-white w-5 h-5" />
        </div>

        <div>
          <p class="font-medium">
            {{ t`New File` }}
          </p>
          <p class="text-sm text-gray-600">
            {{ t`Create a new file and store it in your computer.` }}
          </p>
        </div>
      </div>

      <!-- Existing File (Green Icon) -->
      <div
        @click="existingDatabase"
        class="
          px-6
          h-18
          flex flex-row
          items-center
          cursor-pointer
          gap-4
          p-2
          hover:bg-gray-100
        "
      >
        <div class="w-8 h-8 rounded-full bg-green-500 relative flex-center">
          <feather-icon name="upload" class="w-4 h-4 text-white" />
        </div>
        <div>
          <p class="font-medium">
            {{ t`Existing File` }}
          </p>
          <p class="text-sm text-gray-600">
            {{ t`Load an existing .db file from your computer.` }}
          </p>
        </div>
      </div>
      <hr />

      <!-- File List -->
      <div class="overflow-scroll" style="max-height: 340px">
        <div
          class="
            h-18
            px-6
            flex
            gap-4
            items-center
            hover:bg-gray-100
            cursor-pointer
          "
          v-for="(file, i) in files"
          :key="file.dbPath"
          @click="selectFile(file)"
        >
          <div
            class="
              w-8
              h-8
              rounded-full
              flex
              justify-center
              items-center
              bg-gray-200
              text-gray-500
              font-semibold
              text-base
            "
          >
            {{ i + 1 }}
          </div>
          <div>
            <p class="font-medium">
              {{ file.companyName }}
            </p>
            <p class="text-sm text-gray-600">
              {{ file.modified }}
            </p>
          </div>
        </div>
      </div>
      <hr v-if="files?.length" />

      <!-- Language Selector -->
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
      files: [],
    };
  },
  mounted() {
    this.setFiles();
    window.ds = this;
  },
  methods: {
    setFiles() {
      const files = cloneDeep(fyo.config.get('files', []));
      this.files = files.filter(({ dbPath }) => fs.existsSync(dbPath));

      for (const file of this.files) {
        const stats = fs.statSync(file.dbPath);
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
      await this.connectToDatabase(file.dbPath);
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
