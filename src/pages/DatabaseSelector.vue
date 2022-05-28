<template>
  <div
    class="py-10 flex-1 bg-white flex justify-center items-center"
    :class="{
      'pointer-events-none': loadingDatabase,
      'window-drag': platform !== 'Windows',
    }"
  >
    <div
      class="w-full w-form shadow rounded-lg border relative"
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
        class="px-6 h-18 flex flex-row items-center gap-4 p-2"
        :class="creatingDemo ? '' : 'hover:bg-gray-100 cursor-pointer'"
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
        class="px-6 h-18 flex flex-row items-center gap-4 p-2"
        :class="creatingDemo ? '' : 'hover:bg-gray-100 cursor-pointer'"
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
          class="h-18 px-6 flex gap-4 items-center"
          :class="creatingDemo ? '' : 'hover:bg-gray-100 cursor-pointer'"
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
              {{ formatDate(file.modified) }}
            </p>
          </div>
          <button
            class="
              ml-auto
              p-2
              hover:bg-red-200
              rounded-full
              w-8
              h-8
              text-gray-600
              hover:text-red-400
            "
            @click.stop="() => deleteDb(i)"
          >
            <feather-icon name="x" class="w-4 h-4" />
          </button>
        </div>
      </div>
      <hr v-if="files?.length" />

      <!-- Language Selector -->
      <div
        class="
          w-full
          flex
          justify-between
          items-center
          absolute
          px-6
          py-6
          text-gray-900
        "
        style="top: 100%; transform: translateY(-100%)"
      >
        <LanguageSelector
          v-show="!creatingDemo"
          class="text-sm w-28 bg-gray-100 rounded-md"
          input-class="py-1.5 bg-transparent"
        />
        <button
          class="
            text-sm
            bg-gray-100
            hover:bg-gray-200
            rounded-md
            px-4
            py-1.5
            w-28
            h-8
          "
          @click="createDemo"
          :disabled="creatingDemo"
        >
          {{ creatingDemo ? t`Please Wait` : t`Create Demo` }}
        </button>
      </div>
    </div>
    <Loading
      v-if="creatingDemo"
      :open="creatingDemo"
      :show-x="false"
      :full-width="true"
      :percent="creationPercent"
      :message="creationMessage"
    />
  </div>
</template>
<script>
import { setupDummyInstance } from 'dummy';
import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import { ConfigKeys } from 'fyo/core/types';
import { addNewConfigFile } from 'fyo/telemetry/helpers';
import { DateTime } from 'luxon';
import LanguageSelector from 'src/components/Controls/LanguageSelector.vue';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import Loading from 'src/components/Loading.vue';
import { fyo } from 'src/initFyo';
import { deleteDb, getSavePath } from 'src/utils/ipcCalls';
import { showMessageDialog } from 'src/utils/ui';
import { IPC_ACTIONS } from 'utils/messages';

export default {
  name: 'DatabaseSelector',
  emits: ['file-selected'],
  data() {
    return {
      creationMessage: '',
      creationPercent: 0,
      creatingDemo: false,
      loadingDatabase: false,
      files: [],
    };
  },
  async mounted() {
    await this.setFiles();

    if (fyo.store.isDevelopment) {
      window.ds = this;
    }
  },
  methods: {
    formatDate(isoDate) {
      return DateTime.fromISO(isoDate).toRelative();
    },
    async deleteDb(i) {
      const file = this.files[i];
      const vm = this;

      await showMessageDialog({
        message: t`Delete ${file.companyName}?`,
        detail: t`Database file: ${file.dbPath}`,
        buttons: [
          {
            label: this.t`Yes`,
            async action() {
              await deleteDb(file.dbPath);
              await vm.setFiles();
            },
          },
          {
            label: this.t`No`,
            action() {},
          },
        ],
      });
    },
    async createDemo() {
      const { filePath, canceled } = await getSavePath('demo', 'db');
      if (canceled || !filePath) {
        return;
      }

      this.creatingDemo = true;
      const baseCount = fyo.store.isDevelopment ? 1000 : 100;

      const { companyName, instanceId } = await setupDummyInstance(
        filePath,
        fyo,
        1,
        baseCount,
        (message, percent) => {
          this.creationMessage = message;
          this.creationPercent = percent;
        }
      );

      addNewConfigFile(
        companyName,
        filePath,
        instanceId,
        fyo.config.get(ConfigKeys.Files),
        fyo
      );

      fyo.purgeCache();
      await this.setFiles();

      this.creatingDemo = false;
    },
    async setFiles() {
      this.files = await ipcRenderer.invoke(IPC_ACTIONS.GET_DB_LIST);
    },
    async newDatabase() {
      if (this.creatingDemo) {
        return;
      }

      const { filePath, canceled } = await getSavePath('books', 'db');
      if (canceled || !filePath) {
        return;
      }

      this.connectToDatabase(filePath, true);
    },
    async existingDatabase() {
      if (this.creatingDemo) {
        return;
      }

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
      if (this.creatingDemo) {
        return;
      }

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
  components: {
    LanguageSelector,
    Loading,
    FeatherIcon,
  },
};
</script>
