<template>
  <div class="flex flex-col overflow-hidden">
    <PageHeader>
      <template #title>
        <h1 class="text-2xl font-bold">
          {{ t`Data Import` }}
        </h1>
      </template>
      <template #actions>
        <Button
          v-if="canCancel"
          type="secondary"
          class="text-white text-xs ml-2"
          @click="cancel"
        >
          {{ t`Cancel` }}
        </Button>
      </template>
    </PageHeader>
    <div class="flex justify-center flex-1 mb-8 mt-2">
      <div
        class="
          border
          rounded-lg
          shadow
          h-full
          flex flex-col
          justify-between
          p-6
        "
        style="width: 600px"
      >
        <div>
          <div class="flex flex-row justify-between items-center">
            <FormControl
              :df="importableDf"
              input-class="bg-gray-100 text-gray-900 text-base"
              class="w-1/4"
              :value="importType"
              @change="
                (v) => {
                  importType = v;
                }
              "
            />
            <p
              class="text-base text-base"
              :class="fileName ? 'text-gray-900' : 'text-gray-700'"
            >
              {{ helperText }}
            </p>
          </div>
          <hr class="mt-6" />
        </div>
        <div v-if="importType">
          <hr class="mb-6" />
          <div class="flex flex-row justify-between text-base">
            <Button class="w-1/4" :padding="false">{{ secondaryLabel }}</Button>
            <Button class="w-1/4" type="primary" @click="getFile">{{
              primaryLabel
            }}</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import FormControl from '@/components/Controls/FormControl';
import PageHeader from '@/components/PageHeader.vue';
import { importable } from '@/dataImport';
import frappe from 'frappe';
import Button from '@/components/Button.vue';
import { ipcRenderer } from 'electron';
import { IPC_ACTIONS } from '@/messages';
import { showToast } from '@/utils';
export default {
  components: { PageHeader, FormControl, Button },
  data() {
    return {
      file: null,
      importType: '',
    };
  },
  computed: {
    fileName() {
      if (!this.file) {
        return '';
      }
      return this.file.name;
    },
    helperText() {
      if (!this.importType) {
        return this.t`Set an Import Type`;
      } else if (!this.fileName) {
        return this.t`Select a file for import`;
      }
      return this.fileName;
    },
    secondaryLabel() {
      return this.file ? this.t`Toggle View` : this.t`Save Template`;
    },
    primaryLabel() {
      return this.file ? this.t`Import Data` : this.t`Select File`;
    },
    importableDf() {
      return {
        fieldname: 'importType',
        label: this.t`Import Type`,
        fieldtype: 'AutoComplete',
        placeholder: 'Import Type',
        getList: () => importable.map((i) => frappe.models[i].label),
      };
    },
    labelDoctypeMap() {
      return importable
        .map((i) => ({
          name: i,
          label: frappe.models[i].label,
        }))
        .reduce((acc, { name, label }) => {
          acc[label] = name;
          return acc;
        }, {});
    },
    canCancel() {
      return !!(this.file || this.importType);
    },
  },
  methods: {
    cancel() {
      this.file = null;
      this.importType = '';
    },
    handlePrimaryClick() {},
    handleSecondaryClick() {},
    saveTemplate() {},
    getImportData() {},
    async getFile() {
      const options = {
        title: this.t`Select File`,
        properties: ['openFile'],
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      };

      const { success, canceled, filePath, data, name } =
        await ipcRenderer.invoke(IPC_ACTIONS.GET_FILE, options);

      if (!success) {
        showToast({ message: this.t`File selection failed.`, type: 'error' });
      }

      if (!success || canceled) {
        return;
      }

      this.file = {
        name,
        filePath,
        data: new TextDecoder().decode(data),
      };
    },
  },
};
</script>
