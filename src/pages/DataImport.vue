<template>
  <div class="flex flex-col overflow-hidden w-full">
    <!-- Header -->
    <PageHeader :title="t`Data Import`">
      <DropdownWithActions
        :actions="actions"
        v-if="(canCancel || importType) && !complete"
      />
      <Button
        v-if="(canCancel || importType) && !complete && hasImporter"
        class="text-sm"
        @click="saveTemplate"
        >{{ t`Save Template` }}</Button
      >
      <Button
        v-if="importType && !complete"
        type="primary"
        class="text-sm"
        @click="handlePrimaryClick"
        >{{ primaryLabel }}</Button
      >
    </PageHeader>

    <div class="flex text-base w-full flex-col" v-if="!complete">
      <!-- Type selector -->
      <div
        class="
          flex flex-row
          justify-start
          items-center
          w-full
          gap-2
          border-b
          p-4
        "
      >
        <FormControl
          :df="importableDf"
          input-class="bg-transparent text-gray-900 text-base"
          class="w-40 bg-gray-100 rounded"
          :value="importType"
          size="small"
          @change="setImportType"
        />

        <p
          class="text-base ms-2"
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
      <div v-if="fileName && hasImporter" class="border-b p-4">
        <h2 class="text-lg font-semibold">{{ t`Importer Settings` }}</h2>
        <div class="mt-2 flex gap-2">
          <div
            v-if="file && isSubmittable"
            class="
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
            <p>{{ t`Submit on Import` }}</p>
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
              gap-2
              bg-gray-100
              ps-2
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
                text-end
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
      <div v-if="fileName && hasImporter" class="p-4 border-b">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold">{{ t`Assign Imported Labels` }}</h2>
          <p class="text-red-400 text-sm" v-if="isRequiredUnassigned">
            {{ t`* required fields` }}
          </p>
        </div>
        <div class="gap-2 mt-4 grid grid-flow-col overflow-x-auto no-scrollbar">
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
      </div>

      <!-- Data Verifier -->
      <div v-if="fileName && hasImporter">
        <div class="overflow-auto border-b">
          <!-- Column Name Rows  -->
          <div
            class="
              grid grid-flow-col
              border-b
              gap-2
              sticky
              top-0
              bg-white
              px-4
              h-row-mid
              items-center
            "
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
              class="
                grid grid-flow-col
                border-b
                gap-2
                items-center
                px-4
                h-row-mid
              "
              style="width: fit-content"
              v-for="(r, i) in assignedMatrix"
              :key="'matrix-row-' + i"
            >
              <button
                class="
                  w-4
                  h-4
                  text-gray-600
                  hover:text-gray-900
                  cursor-pointer
                  outline-none
                "
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

            <!-- Add Row button -->
            <button
              class="
                text-gray-600
                hover:bg-gray-50
                flex flex-row
                w-full
                px-4
                h-row-mid
                border-b
                items-center
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
              <p class="ps-4">
                {{ t`Add Row` }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Post Complete Success -->
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
        <div class="max-h-96 overflow-y-auto">
          <div
            v-for="(n, i) in names"
            :key="'name-' + i"
            class="grid grid-cols-2 gap-2 border-b pb-2 mb-2 pe-4 text-lg w-60"
            style="grid-template-columns: 2rem auto"
          >
            <p class="text-end">{{ i + 1 }}.</p>
            <p>
              {{ n }}
            </p>
          </div>
        </div>
        <div class="flex w-full justify-between">
          <Button type="secondary" class="text-sm w-32" @click="clear">{{
            t`Import More`
          }}</Button>
          <Button type="primary" class="text-sm w-32" @click="showMe">{{
            t`Show Me`
          }}</Button>
        </div>
      </div>
    </div>
    <div
      v-if="!importType"
      class="flex justify-center h-full w-full items-center mb-16"
    >
      <HowTo
        link="https://youtu.be/ukHAgcnVxTQ"
        class="text-gray-900 rounded-lg text-base border px-3 py-2"
      >
        {{ t`How to Use Data Import` }}
      </HowTo>
    </div>
    <Loading
      v-if="isMakingEntries"
      :open="isMakingEntries"
      :percent="percentLoading"
      :message="messageLoading"
    />
  </div>
</template>
<script lang="ts">
import { Action as BaseAction } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { FieldTypeEnum, OptionField } from 'schemas/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import HowTo from 'src/components/HowTo.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { Importer } from 'src/dataImport';
import { fyo } from 'src/initFyo';
import { getSavePath, saveData, selectFile } from 'src/utils/ipcCalls';
import { docsPathMap } from 'src/utils/misc';
import { docsPathRef } from 'src/utils/refs';
import { showMessageDialog } from 'src/utils/ui';
import { defineComponent } from 'vue';
import Loading from '../components/Loading.vue';

type Action = Pick<BaseAction, 'condition' | 'component'> & {
  action: Function;
};

type DataImportData = {
  canReset: boolean;
  complete: boolean;
  names: string[];
  file: null | { name: string; filePath: string; text: string };
  nullOrImporter: null | Importer;
  importType: string;
  isMakingEntries: boolean;
  percentLoading: number;
  messageLoading: string;
};

export default defineComponent({
  components: {
    PageHeader,
    FormControl,
    Button,
    DropdownWithActions,
    FeatherIcon,
    HowTo,
    Loading,
  },
  data() {
    return {
      canReset: false,
      complete: false,
      names: ['Bat', 'Baseball', 'Other Shit'],
      file: null,
      nullOrImporter: null,
      importType: '',
      isMakingEntries: false,
      percentLoading: 0,
      messageLoading: '',
    } as DataImportData;
  },
  mounted() {
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.di = this;
    }
  },
  computed: {
    hasImporter(): boolean {
      return !!this.nullOrImporter;
    },
    importer(): Importer {
      if (!this.nullOrImporter) {
        throw new ValidationError(this.t`Importer not set, reload tool`, false);
      }

      return this.nullOrImporter as Importer;
    },
    importables(): ModelNameEnum[] {
      const importables = [
        ModelNameEnum.SalesInvoice,
        ModelNameEnum.PurchaseInvoice,
        ModelNameEnum.Payment,
        ModelNameEnum.Party,
        ModelNameEnum.Item,
        ModelNameEnum.JournalEntry,
      ];

      const hasInventory = fyo.doc.singles.AccountingSettings?.enableInventory;
      if (hasInventory) {
        importables.push(
          ModelNameEnum.StockMovement,
          ModelNameEnum.Shipment,
          ModelNameEnum.PurchaseReceipt
        );
      }

      return importables;
    },
    labelIndex(): number {
      return this.importer.labelIndex ?? 0;
    },
    requiredUnassigned(): string[] {
      return this.importer.assignableLabels.filter(
        (k) => this.importer.requiredMap[k] && !this.importer.assignedMap[k]
      );
    },
    isRequiredUnassigned(): boolean {
      return this.requiredUnassigned.length > 0;
    },
    assignedMatrix(): string[][] {
      return this.nullOrImporter?.assignedMatrix ?? [];
    },
    actions(): Action[] {
      const actions: Action[] = [];

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

    fileName(): string {
      if (!this.file) {
        return '';
      }
      return this.file.name;
    },
    helperText(): string {
      if (!this.importType) {
        return this.t`Set an Import Type`;
      } else if (!this.fileName) {
        return this.t`Select a file for import`;
      }
      return this.fileName;
    },
    primaryLabel(): string {
      return this.file ? this.t`Import Data` : this.t`Select File`;
    },
    isSubmittable(): boolean {
      const schemaName = this.importer.schemaName;
      return fyo.schemaMap[schemaName]?.isSubmittable ?? false;
    },
    importableDf(): OptionField {
      return {
        fieldname: 'importType',
        label: this.t`Import Type`,
        fieldtype: FieldTypeEnum.AutoComplete,
        placeholder: this.t`Import Type`,
        options: Object.keys(this.labelSchemaNameMap).map((k) => ({
          value: k,
          label: k,
        })),
      };
    },
    labelSchemaNameMap(): Record<string, string> {
      return this.importables
        .map((i) => ({
          name: i,
          label: fyo.schemaMap[i]?.label ?? i,
        }))
        .reduce((acc, { name, label }) => {
          acc[label] = name;
          return acc;
        }, {} as Record<string, string>);
    },
    canCancel(): boolean {
      return !!(this.file || this.importType);
    },
  },
  activated(): void {
    docsPathRef.value = docsPathMap.DataImport ?? '';
  },
  deactivated(): void {
    docsPathRef.value = '';
    if (!this.complete) {
      return;
    }

    this.clear();
  },
  methods: {
    showMe(): void {
      const schemaName = this.importer.schemaName;
      this.clear();
      this.$router.push(`/list/${schemaName}`);
    },
    clear(): void {
      this.file = null;
      this.names = [];
      this.nullOrImporter = null;
      this.importType = '';
      this.complete = false;
      this.canReset = false;
      this.isMakingEntries = false;
      this.percentLoading = 0;
      this.messageLoading = '';
    },
    async handlePrimaryClick(): Promise<void> {
      if (!this.file) {
        await this.selectFile();
        return;
      }

      await this.importData();
    },
    setLabelIndex(e: Event): void {
      const target = e.target as HTMLInputElement;
      const labelIndex = Number(target?.value ?? '1') - 1;
      this.nullOrImporter?.initialize(labelIndex);
    },
    async saveTemplate(): Promise<void> {
      const template = this.importer.template;
      const templateName = this.importType + ' ' + this.t`Template`;
      const { canceled, filePath } = await getSavePath(templateName, 'csv');

      if (canceled || !filePath) {
        return;
      }

      await saveData(template, filePath);
    },
    getAssignerField(targetLabel: string): OptionField {
      const assigned = this.importer.assignedMap[targetLabel];
      return {
        fieldname: 'assignerField',
        label: targetLabel,
        placeholder: `Select Label`,
        fieldtype: FieldTypeEnum.Select,
        options: [
          '',
          ...(assigned ? [assigned] : []),
          ...this.importer.unassignedLabels,
        ].map((i) => ({ value: i, label: i })),
        default: assigned ?? '',
      };
    },
    onAssignedChange(target: string, value: string): void {
      this.importer.assignedMap[target] = value;
    },
    onValueChange(event: Event, i: number, j: number): void {
      this.importer.updateValue((event.target as HTMLInputElement).value, i, j);
    },
    async importData(): Promise<unknown> {
      if (this.isMakingEntries || this.complete) {
        return;
      }

      if (this.isRequiredUnassigned) {
        return await showMessageDialog({
          message: this.t`Required Fields not Assigned`,
          detail: this
            .t`Please assign the following fields ${this.requiredUnassigned.join(
            ', '
          )}`,
        });
      }

      if (this.importer.assignedMatrix.length === 0) {
        return await showMessageDialog({
          message: this.t`No Data to Import`,
          detail: this.t`Please select a file with data to import.`,
        });
      }

      const { success, names, message } = await this.importer.importData(
        this.setLoadingStatus
      );
      if (!success) {
        return await showMessageDialog({
          message: this.t`Import Failed`,
          detail: message,
        });
      }

      this.names = names;
      this.complete = true;
    },
    setImportType(importType: string): void {
      if (this.importType) {
        this.clear();
      }
      this.importType = importType;
      this.nullOrImporter = new Importer(
        this.labelSchemaNameMap[this.importType],
        fyo
      );
    },
    setLoadingStatus(
      isMakingEntries: boolean,
      entriesMade: number,
      totalEntries: number
    ): void {
      this.isMakingEntries = isMakingEntries;
      this.percentLoading = entriesMade / totalEntries;
      this.messageLoading = isMakingEntries
        ? `${entriesMade} entries made out of ${totalEntries}...`
        : '';
    },
    async selectFile(): Promise<unknown> {
      const options = {
        title: this.t`Select File`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      };

      const { success, canceled, filePath, data, name } = await selectFile(
        options
      );

      if (!success && !canceled) {
        return await showMessageDialog({
          message: this.t`File selection failed.`,
        });
      }

      if (!success || canceled) {
        return;
      }

      const text = new TextDecoder().decode(data);
      const isValid = this.importer.selectFile(text);
      if (!isValid) {
        return await showMessageDialog({
          message: this.t`Bad import data.`,
          detail: this.t`Could not select file.`,
        });
      }

      this.file = {
        name,
        filePath,
        text,
      };
    },
  },
});
</script>
