<template>
  <div class="flex flex-col overflow-hidden">
    <PageHeader>
      <template #title>
        <h1 class="text-2xl font-bold">
          {{ t`Data Import` }}
        </h1>
      </template>
      <template #actions>
        <DropdownWithActions
          class="ml-2"
          :actions="actions"
          v-if="canCancel || importType"
        />
        <Button
          v-if="importType"
          type="primary"
          class="text-sm ml-2"
          @click="handlePrimaryClick"
          >{{ primaryLabel }}</Button
        >
      </template>
    </PageHeader>
    <div class="flex px-8 mt-2 text-base w-full flex-col gap-8">
      <!-- Type selector -->
      <div class="flex flex-row justify-start items-center w-full">
        <FormControl
          :df="importableDf"
          input-class="bg-gray-100 text-gray-900 text-base"
          class="w-40"
          :value="importType"
          size="small"
          @change="setImportType"
        />
        <p
          class="text-base text-base ml-2"
          :class="fileName ? 'text-gray-900 font-semibold' : 'text-gray-700'"
        >
          <span v-if="fileName" class="font-normal"
            >{{ t`Selected file` }}
          </span>
          {{ helperText }}{{ fileName ? ',' : '' }}
          <span v-if="fileName" class="font-normal">
            {{ t`verify the imported data and click on` }} </span
          >{{ ' ' }}<span v-if="fileName">{{ t`Import Data` }}</span>
        </p>
      </div>

      <!-- Label Assigner -->
      <div v-if="fileName">
        <h2 class="text-lg font-semibold">{{ t`Assign Imported Labels` }}</h2>
        <div class="gap-2 mt-4 grid grid-flow-col overflow-x-scroll pb-4">
          <FormControl
            :show-label="true"
            size="small"
            class="w-28"
            input-class="bg-gray-100"
            v-for="(f, k) in importer.assignableLabels"
            :df="getAssignerField(f)"
            :value="importer.assignedMap[f] ?? ''"
            @change="(v) => onAssignedChange(f, v)"
            :key="f + '-' + k"
          />
        </div>
      </div>

      <!-- Data Verifier -->
      <div v-if="fileName">
        <h2 class="-mt-4 text-lg font-semibold pb-1">
          {{ t`Verify Imported Data` }}
        </h2>

        <div class="overflow-scroll mt-4 pb-4">
          <!-- Column Name Rows  -->
          <div
            class="grid grid-flow-col pb-4 border-b gap-2 sticky top-0 bg-white"
            style="width: fit-content"
            v-if="importer.columnLabels.length > 0"
          >
            <div class="w-4 h-4" />
            <p
              v-for="(c, i) in importer.columnLabels"
              class="px-2 w-28 font-semibold text-gray-600"
              :key="'column-' + i"
            >
              {{ c }}
            </p>
          </div>
          <div v-else>
            <p class="text-gray-600">
              {{ t`No labels have been assigned.` }}
            </p>
          </div>

          <!-- Data Rows -->
          <div
            v-if="importer.columnLabels.length > 0"
            style="max-height: 500px"
          >
            <div
              class="grid grid-flow-col mt-4 pb-4 border-b gap-2 items-center"
              style="width: fit-content"
              v-for="(r, i) in assignedMatrix"
              :key="'matrix-row-' + i"
            >
              <button
                class="w-4 h-4 text-gray-600 hover:text-gray-900 cursor-pointer"
                @click="importer.dropRow(i)"
              >
                <FeatherIcon name="x" />
              </button>
              <input
                v-for="(c, j) in r"
                type="text"
                class="
                  w-28
                  text-gray-900
                  px-2
                  py-1
                  outline-none
                  rounded
                  focus:bg-gray-200
                "
                @change="(e) => onValueChange(e, i, j)"
                :key="'matrix-cell-' + i + '-' + j"
                :value="c"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import FormControl from '@/components/Controls/FormControl';
import PageHeader from '@/components/PageHeader.vue';
import { importable, Importer } from '@/dataImport';
import frappe from 'frappe';
import Button from '@/components/Button.vue';
import { ipcRenderer } from 'electron';
import { IPC_ACTIONS } from '@/messages';
import { getSavePath, saveData, showToast } from '@/utils';
import DropdownWithActions from '@/components/DropdownWithActions.vue';
import FeatherIcon from '@/components/FeatherIcon.vue';
export default {
  components: {
    PageHeader,
    FormControl,
    Button,
    DropdownWithActions,
    FeatherIcon,
  },
  data() {
    return {
      file: null,
      importer: null,
      importType: '',
    };
  },
  computed: {
    assignedMatrix() {
      return this.importer.assignedMatrix;
    },
    actions() {
      const cancelAction = {
        component: {
          template: '<span class="text-red-700" >{{ t`Cancel` }}</span>',
        },
        condition: () => true,
        action: this.cancel,
      };

      const secondaryAction = {
        component: {
          template: '<span>{{ t`Save Template` }}</span>',
        },
        condition: () => true,
        action: this.handleSecondaryClick,
      };
      return [secondaryAction, cancelAction];
    },

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
      this.importer = null;
      this.importType = '';
    },
    handlePrimaryClick() {
      if (!this.file) {
        this.selectFile();
        return;
      }

      this.importData();
    },
    handleSecondaryClick() {
      if (!this.importer) {
        return;
      }

      this.saveTemplate();
    },
    async saveTemplate() {
      const template = this.importer.template;
      const templateName = this.importType + ' ' + this.t`Template`;
      const { cancelled, filePath } = await getSavePath(templateName, 'csv');

      if (cancelled || filePath === '') {
        return;
      }
      await saveData(template, filePath);
    },
    getAssignerField(targetLabel) {
      const assigned = this.importer.assignedMap[targetLabel];
      return {
        fieldname: 'assignerField',
        label: targetLabel,
        placeholder: `Select Label`,
        fieldtype: 'Select',
        options: [
          '',
          ...(assigned ? [assigned] : []),
          ...this.importer.unassignedLabels,
        ],
        default: assigned ?? '',
      };
    },
    onAssignedChange(target, value) {
      this.importer.assignedMap[target] = value;
    },
    onValueChange(event, i, j) {
      this.importer.updateValue(event.target.value, i, j);
    },
    importData() {},
    setImportType(importType) {
      if (this.importType) {
        this.cancel();
      }
      this.importType = importType;
      this.importer = new Importer(this.labelDoctypeMap[this.importType]);
    },
    async selectFile() {
      const options = {
        title: this.t`Select File`,
        properties: ['openFile'],
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      };

      const { success, canceled, filePath, data, name } =
        await ipcRenderer.invoke(IPC_ACTIONS.GET_FILE, options);

      if (!success && !canceled) {
        showToast({ message: this.t`File selection failed.`, type: 'error' });
      }

      if (!success || canceled) {
        return;
      }

      const text = new TextDecoder().decode(data);
      const isValid = this.importer.selectFile(text);
      if (!isValid) {
        showToast({
          message: this.t`Bad import data. Could not select file.`,
          type: 'error',
        });
        return;
      }

      this.file = {
        name,
        filePath,
        text,
      };

      window.i = this.importer;
    },
  },
};
</script>
