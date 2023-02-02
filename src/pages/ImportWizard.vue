<template>
  <div class="flex flex-col overflow-hidden w-full">
    <!-- Header -->
    <PageHeader :title="t`Import Wizard`">
      <DropdownWithActions :actions="actions" v-if="hasImporter && !complete" />
      <Button
        v-if="hasImporter && !complete"
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

    <!-- Main Body of the Wizard -->
    <div class="flex text-base w-full flex-col" v-if="!complete">
      <!-- Select Import Type -->
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

      <!-- Bulk Entries Grid -->
      <div v-if="hasImporter">
        <div class="flex justify-start">
          <!-- Index Column -->
          <div
            class="
              w-12
              p-4
              border-e
              flex-shrink-0
              text-gray-600
              grid grid-cols-1
              items-center
              justify-items-center
              gap-4
            "
          >
            <div class="h-6">#</div>
            <div
              v-for="(_, i) of importer.valueMatrix"
              :key="i"
              class="flex items-center group h-6"
            >
              <span class="hidden group-hover:inline-block">
                <feather-icon
                  name="x"
                  class="w-4 h-4 -ms-1 cursor-pointer"
                  :button="true"
                  @click="importer.removeRow(i)"
                />
              </span>
              <span class="group-hover:hidden">
                {{ i + 1 }}
              </span>
            </div>
          </div>

          <!-- Grid -->
          <div
            class="overflow-x-scroll gap-4 p-4 grid"
            :style="`grid-template-columns: repeat(${pickedArray.length}, 10rem)`"
          >
            <!-- Grid Title Row Cells, Allow Column Selection -->
            <AutoComplete
              class="flex-shrink-0"
              v-for="(_, index) in pickedArray"
              size="small"
              :border="true"
              :key="index"
              :df="gridColumnTitleDf"
              :value="importer.assignedTemplateFields[index]"
              @change="(v:string) => importer.assignedTemplateFields[index] = v"
            />

            <!-- Grid Value Row Cells, Allow Editing Values -->
            <template v-for="(row, ridx) of importer.valueMatrix">
              <template
                v-for="(val, cidx) of row"
                :key="`cell-${ridx}-${cidx}`"
              >
                <div v-if="!importer.assignedTemplateFields[cidx]">
                  {{ val.value }}
                </div>
                <FormControl
                  v-else
                  :df="
                    importer.templateFieldsMap.get(
                      importer.assignedTemplateFields[cidx]
                    )
                  "
                  size="small"
                  :rows="1"
                  :border="true"
                  :value="val.value"
                  @change="(value: DocValue)=> {
                    importer.valueMatrix[ridx][cidx]!.value = value
                  }"
                />
              </template>
            </template>
          </div>
        </div>
        <hr />

        <!-- Add Row Button -->
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
        {{ t`How to Use the Import Wizard` }}
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
import { log } from 'console';
import { DocValue } from 'fyo/core/types';
import { Action as BaseAction } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { FieldTypeEnum, OptionField, SelectOption } from 'schemas/types';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import HowTo from 'src/components/HowTo.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { Importer } from 'src/importer';
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
    HowTo,
    Loading,
    AutoComplete,
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
      window.bew = this;
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
    importableSchemaNames(): ModelNameEnum[] {
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
          ModelNameEnum.PurchaseReceipt,
          ModelNameEnum.Location
        );
      }

      return importables;
    },
    /*
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
    */
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
        options: Object.keys(this.labelSchemaNameMap).map((k) => ({
          value: k,
          label: k,
        })),
      };
    },
    labelSchemaNameMap(): Record<string, string> {
      return this.importableSchemaNames
        .map((i) => ({
          name: i,
          label: fyo.schemaMap[i]?.label ?? i,
        }))
        .reduce((acc, { name, label }) => {
          acc[label] = name;
          return acc;
        }, {} as Record<string, string>);
    },
    gridColumnTitleDf(): OptionField {
      const options: SelectOption[] = [];
      for (const field of this.importer.templateFieldsMap.values()) {
        const value = field.fieldKey;

        let label = field.label;
        if (field.parentSchemaChildField) {
          label = `${label} (${field.parentSchemaChildField.label})`;
        }

        options.push({ value, label });
      }

      return {
        fieldname: 'col',
        fieldtype: 'AutoComplete',
        options,
      } as OptionField;
    },
    pickedArray(): string[] {
      return [...this.importer.templateFieldsPicked.entries()]
        .filter(([key, picked]) => picked)
        .map(([key, _]) => key);
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
    log: console.log,
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
        return await this.selectFile();
      }

      await this.importData();
    },
    /*
    setLabelIndex(e: Event): void {
      const target = e.target as HTMLInputElement;
      const labelIndex = Number(target?.value ?? '1') - 1;
      this.nullOrImporter?.initialize(labelIndex);
    },
    */
    async saveTemplate(): Promise<void> {
      const template = this.importer.getCSVTemplate();
      const templateName = this.importType + ' ' + this.t`Template`;
      const { canceled, filePath } = await getSavePath(templateName, 'csv');

      if (canceled || !filePath) {
        return;
      }

      await saveData(template, filePath);
    },
    /*
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
    */
    async importData(): Promise<void> {
      /*
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
    */
    },
    setImportType(importType: string): void {
      this.clear();
      if (!importType) {
        return;
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
    async selectFile(): Promise<void> {
      const options = {
        title: this.t`Select File`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      };

      const { success, canceled, filePath, data, name } = await selectFile(
        options
      );

      if (!success && !canceled) {
        await showMessageDialog({
          message: this.t`File selection failed.`,
        });
        return;
      }

      if (!success || canceled) {
        return;
      }

      const text = new TextDecoder().decode(data);
      const isValid = this.importer.selectFile(text);
      if (!isValid) {
        await showMessageDialog({
          message: this.t`Bad import data`,
          detail: this.t`Could not read file`,
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
});

/**
 * TODO: Add Pick Modal
 * TODO: Build Grid Body
 * TODO: View raw values
 * TODO: If field not assigned to column show raw value
 * TODO: If field assigned to column show respective FormControl
 * TODO: If error in parsing the value, mark as error and call
 *  - for editing value
 * TODO: View parsed values (after columns have been assigned)
 */
</script>
