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
          v-if="(canCancel || importType) && !complete"
        />
        <Button
          v-if="importType && !complete"
          type="primary"
          class="text-sm ml-2"
          @click="handlePrimaryClick"
          >{{ primaryLabel }}</Button
        >
      </template>
    </PageHeader>
    <div
      class="flex px-8 mt-2 text-base w-full flex-col gap-8"
      v-if="!complete"
    >
      <!-- Type selector -->
      <div class="flex flex-row justify-start items-center w-full gap-2">
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

      <!-- Settings -->
      <div v-if="fileName" class="">
        <h2 class="text-lg font-semibold">{{ t`Importer Settings` }}</h2>
        <div class="mt-4 flex gap-2">
          <div
            v-if="file && isSubmittable"
            class="
              justify-center
              items-center
              gap-2
              flex
              justify-between
              items-center
              bg-gray-100
              px-2
              rounded
              text-gray-900
              w-40
            "
          >
            <p>{{ frappe.t`Submit on Import` }}</p>
            <FormControl
              size="small"
              input-class="bg-gray-100"
              :df="{
                fieldname: 'shouldSubmit',
                fieldtype: 'Check',
              }"
              :value="Number(importer.shouldSubmit)"
              @change="(value) => (importer.shouldSubmit = !!value)"
            />
          </div>
          <div
            class="
              flex flex-row
              justify-center
              items-center
              justify-center
              items-center
              gap-2
              flex
              justify-between
              items-center
              bg-gray-100
              pl-2
              rounded
              text-gray-900
              w-40
            "
          >
            <p class="text-gray-900">{{ t`Label Index` }}</p>
            <input
              type="number"
              class="
                bg-gray-100
                outline-none
                focus:bg-gray-200
                px-2
                py-1
                rounded-md
                w-10
                text-right
              "
              min="1"
              :max="importer.csv.length - 1"
              :value="labelIndex + 1"
              @change="setLabelIndex"
            />
          </div>
          <button
            class="w-28 bg-gray-100 focus:bg-gray-200 rounded-md"
            v-if="canReset"
            @click="
              () => {
                importer.initialize(0, true);
                canReset = false;
              }
            "
          >
            <span class="text-gray-900">
              {{ t`Reset` }}
            </span>
          </button>
        </div>
      </div>

      <!-- Label Assigner -->
      <div v-if="fileName" class="pb-4">
        <h2 class="text-lg font-semibold">{{ t`Assign Imported Labels` }}</h2>
        <div
          class="gap-2 mt-4 grid grid-flow-col overflow-x-scroll no-scrollbar"
        >
          <div
            v-for="(f, k) in importer.assignableLabels"
            :key="'assigner-' + f + '-' + k"
          >
            <p class="text-gray-600 text-sm mb-1">
              {{ f }}
              <span
                v-if="importer.requiredMap[f] && !importer.assignedMap[f]"
                class="text-red-400"
                >*</span
              >
            </p>
            <FormControl
              size="small"
              class="w-28"
              input-class="bg-gray-100"
              :df="getAssignerField(f)"
              :value="importer.assignedMap[f] ?? ''"
              @change="(v) => onAssignedChange(f, v)"
            />
          </div>
        </div>
        <p
          class="text-red-400 text-sm mt-1 -mb-1 p-0 h-0"
          v-if="isRequiredUnassigned"
        >
          {{ t`* required fields` }}
        </p>
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
            style="max-height: 400px"
          >
            <div
              class="grid grid-flow-col mt-4 pb-4 border-b gap-2 items-center"
              style="width: fit-content"
              v-for="(r, i) in assignedMatrix"
              :key="'matrix-row-' + i"
            >
              <button
                class="w-4 h-4 text-gray-600 hover:text-gray-900 cursor-pointer outline-none"
                @click="
                  () => {
                    importer.dropRow(i);
                    canReset = true;
                  }
                "
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
                @change="
                  (e) => {
                    onValueChange(e, i, j);
                    canReset = true;
                  }
                "
                :key="'matrix-cell-' + i + '-' + j"
                :value="c"
              />
            </div>
            <button
              class="
                text-gray-600
                hover:text-gray-900
                flex flex-row
                w-full
                mt-4
                outline-none
              "
              @click="
                () => {
                  importer.addRow();
                  canReset = true;
                }
              "
            >
              <FeatherIcon name="plus" class="w-4 h-4" />
              <p class="pl-4">
                {{ t`Add Row` }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="complete" class="flex justify-center h-full items-center">
      <div
        class="
          flex flex-col
          justify-center
          items-center
          gap-8
          rounded-lg
          shadow-md
          p-6
        "
        style="width: 450px"
      >
        <h2 class="text-xl font-semibold mt-4">{{ t`Import Success` }} 🎉</h2>
        <p class="text-lg text-center">
          {{ t`Successfully created the following ${names.length} entries:` }}
        </p>
        <div class="max-h-96 overflow-y-scroll">
          <div
            v-for="(n, i) in names"
            :key="'name-' + i"
            class="grid grid-cols-2 gap-2 border-b pb-2 mb-2 pr-4 text-lg w-60"
            style="grid-template-columns: 2rem auto"
          >
            <p class="text-right">{{ i + 1 }}.</p>
            <p>
              {{ n }}
            </p>
          </div>
        </div>
        <Button type="primary" class="text-sm w-28" @click="showMe">{{
          t`Show Me`
        }}</Button>
      </div>
    </div>
    <div
      v-if="!importType"
      class="flex justify-center h-full items-center mb-16"
    >
      <HowTo link="https://youtu.be/ukHAgcnVxTQ">
        {{ t`How to Use Data Import?` }}
      </HowTo>
    </div>
  </div>
</template>
<script>
import Button from '@/components/Button.vue';
import FormControl from '@/components/Controls/FormControl';
import DropdownWithActions from '@/components/DropdownWithActions.vue';
import FeatherIcon from '@/components/FeatherIcon.vue';
import HowTo from '@/components/HowTo.vue';
import PageHeader from '@/components/PageHeader.vue';
import { importable, Importer } from '@/dataImport';
import { IPC_ACTIONS } from '@/messages';
import { getSavePath, saveData, showMessageDialog } from '@/utils';
import { ipcRenderer } from 'electron';
import frappe from 'frappe';
export default {
  components: {
    PageHeader,
    FormControl,
    Button,
    DropdownWithActions,
    FeatherIcon,
    HowTo,
  },
  data() {
    return {
      canReset: false,
      complete: false,
      names: ['Bat', 'Baseball', 'Other Shit'],
      file: null,
      importer: null,
      importType: '',
    };
  },
  computed: {
    labelIndex() {
      return this.importer.labelIndex;
    },
    requiredUnassigned() {
      return this.importer.assignableLabels.filter(
        (k) => this.importer.requiredMap[k] && !this.importer.assignedMap[k]
      );
    },
    isRequiredUnassigned() {
      return this.requiredUnassigned.length > 0;
    },
    assignedMatrix() {
      return this.importer.assignedMatrix;
    },
    actions() {
      const actions = [];

      const secondaryAction = {
        component: {
          template: '<span>{{ t`Save Template` }}</span>',
        },
        condition: () => true,
        action: this.handleSecondaryClick,
      };
      actions.push(secondaryAction);

      if (this.file) {
        actions.push({
          component: {
            template: '<span>{{ t`Change File` }}</span>',
          },
          condition: () => true,
          action: this.selectFile,
        });
      }

      const cancelAction = {
        component: {
          template: '<span class="text-red-700" >{{ t`Cancel` }}</span>',
        },
        condition: () => true,
        action: this.clear,
      };
      actions.push(cancelAction);

      return actions;
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
    isSubmittable() {
      const doctype = this.importer?.doctype;
      if (doctype) {
        return frappe.models[doctype].isSubmittable ?? false;
      }
      return false;
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
  deactivated() {
    if (!this.complete) {
      return;
    }
    
    this.clear();
  },
  methods: {
    showMe() {
      const doctype = this.importer.doctype;
      this.clear();
      this.$router.push(`/list/${doctype}`);
    },
    clear() {
      this.file = null;
      this.names = [];
      this.importer = null;
      this.importType = '';
      this.complete = false;
      this.canReset = false;
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
    setLabelIndex(e) {
      const labelIndex = (e.target.value ?? 1) - 1;
      this.importer.initialize(labelIndex);
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
    async importData() {
      if (this.isRequiredUnassigned) {
        showMessageDialog({
          message: this.t`Required Fields not Assigned`,
          description: this
            .t`Please assign the following fields ${this.requiredUnassigned.join(
            ', '
          )}`,
        });
        return;
      }

      if (this.importer.assignedMatrix.length === 0) {
        showMessageDialog({
          message: this.t`No Data to Import`,
          description: this.t`Please select a file with data to import.`,
        });
        return;
      }

      const { success, names, message } = await this.importer.importData();
      if (!success) {
        showMessageDialog({
          message: this.t`Import Failed`,
          description: message,
        });
        return;
      }

      this.names = names;
      this.complete = true;
    },
    setImportType(importType) {
      if (this.importType) {
        this.clear();
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
        showMessageDialog({ message: this.t`File selection failed.` });
      }

      if (!success || canceled) {
        return;
      }

      const text = new TextDecoder().decode(data);
      const isValid = this.importer.selectFile(text);
      if (!isValid) {
        showMessageDialog({
          message: this.t`Bad import data.`,
          description: this.t`Could not select file.`,
        });
        return;
      }

      this.file = {
        name,
        filePath,
        text,
      };
    },
  },
};
</script>
