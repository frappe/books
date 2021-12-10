<template>
  <div
    class="py-10 flex-1 bg-white"
    :class="{
      'pointer-events-none': loadingDatabase,
      'window-drag': platform !== 'Windows',
    }"
  >
    <div class="w-full">
      <div class="px-12">
        <h1 class="text-2xl font-semibold">
          {{ _('Welcome to Frappe Books') }}
        </h1>
        <p class="text-gray-600 text-base" v-if="!showFiles">
          {{
            _('Create a new file or select an existing one from your computer')
          }}
        </p>
        <p class="text-gray-600 text-base" v-if="showFiles">
          {{ _('Select a file to load the company transactions') }}
        </p>
      </div>
      <div class="px-12 mt-10 window-no-drag" v-if="!showFiles">
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
                {{ _('Loading...') }}
              </template>
              <template v-else>
                {{ _('New File') }}
              </template>
            </div>
            <div class="mt-2 text-sm text-gray-600 text-center">
              {{ _('Create a new file and store it in your computer.') }}
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
                {{ _('Loading...') }}
              </template>
              <template v-else>
                {{ _('Existing File') }}
              </template>
            </div>
            <div class="mt-2 text-sm text-gray-600 text-center">
              {{ _('Load an existing .db file from your computer.') }}
            </div>
          </div>
        </div>
        <a
          v-if="files.length > 0"
          class="text-brand text-sm mt-4 inline-block cursor-pointer"
          @click="showFiles = true"
        >
          Select from existing files
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
                  {{ _('Loading...') }}
                </template>
                <template v-else>
                  {{ file.companyName }}
                </template>
              </span>
            </div>
            <div class="text-gray-700">
              {{ getFileLastModified(file.filePath) }}
            </div>
          </div>
        </div>
        <div class="px-12 mt-4">
          <a
            class="text-brand text-sm cursor-pointer"
            @click="showFiles = false"
          >
            Select file manually
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import fs from 'fs';
import config from '@/config';
import { DateTime } from 'luxon';
import { ipcRenderer } from 'electron';
import { DB_CONN_FAILURE, IPC_ACTIONS } from '../messages';

import { createNewDatabase, connectToLocalDatabase } from '@/initialization';
import { showErrorDialog } from '../utils';

export default {
  name: 'DatabaseSelector',
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
      this.files = config
        .get('files', [])
        .filter(({ filePath }) => fs.existsSync(filePath));
    },
    async newDatabase() {
      this.fileSelectedFrom = 'New File';
      let filePath = await createNewDatabase();
      this.connectToDatabase(filePath);
    },
    async existingDatabase() {
      this.fileSelectedFrom = 'Existing File';
      const filePath = (
        await ipcRenderer.invoke(IPC_ACTIONS.GET_OPEN_FILEPATH, {
          title: this._('Select file'),
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
    async connectToDatabase(filePath) {
      if (!filePath) {
        return;
      }

      this.loadingDatabase = true;
      const { connectionSuccess, reason } = await connectToLocalDatabase(
        filePath
      );
      this.loadingDatabase = false;

      const title = 'DB Connection Error';

      if (connectionSuccess) {
        this.$emit('database-connect');
      } else if (reason === DB_CONN_FAILURE.CANT_OPEN) {
        await showErrorDialog({
          title,
          content: `Can't open database file: ${filePath}, please create a new file.`,
        });
      } else {
        await showErrorDialog({
          title,
          content: `Please select an existing database or create a new one. reason: ${reason}, filePath: ${filePath}`,
        });
      }
    },
    getFileLastModified(filePath) {
      let stats = fs.statSync(filePath);
      return DateTime.fromJSDate(stats.mtime).toRelative();
    },
  },
};
</script>
