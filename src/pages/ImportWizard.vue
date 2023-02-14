<template>
  <div class="flex flex-col overflow-hidden w-full">
    <!-- Header -->
    <PageHeader :title="t`Import Wizard`">
      <DropdownWithActions
        :actions="actions"
        v-if="hasImporter && !complete"
        :title="t`More`"
      />
      <Button
        v-if="hasImporter && !complete"
        :title="t`Add Row`"
        @click="
          () => {
            importer.addRow();
            canReset = true;
          }
        "
        :icon="true"
      >
        <feather-icon name="plus" class="w-4 h-4" />
      </Button>
      <Button
        v-if="hasImporter && !complete"
        :title="t`Save Template`"
        @click="saveTemplate"
        :icon="true"
      >
        <feather-icon name="download" class="w-4 h-4" />
      </Button>
      <Button
        v-if="canImportData"
        :title="t`Import Data`"
        type="primary"
        @click="importData"
        :disabled="errorMessage.length > 0"
      >
        {{ t`Import Data` }}
      </Button>
      <Button
        v-if="importType && !canImportData"
        :title="t`Select File`"
        type="primary"
        @click="selectFile"
      >
        {{ t`Select File` }}
      </Button>
    </PageHeader>

    <!-- Main Body of the Wizard -->
    <div class="flex text-base w-full flex-col" v-if="!complete">
      <!-- Select Import Type -->
      <div
        class="
          h-row-largest
          flex flex-row
          justify-start
          items-center
          w-full
          gap-2
          border-b
          p-4
        "
      >
        <AutoComplete
          :df="{
            fieldname: 'importType',
            label: t`Import Type`,
            fieldtype: 'AutoComplete',
            options: importableSchemaNames.map((value) => ({
              value,
              label: fyo.schemaMap[value]?.label ?? value,
            })),
          }"
          input-class="bg-transparent text-gray-900 text-base"
          class="w-40"
          :border="true"
          :value="importType"
          size="small"
          @change="setImportType"
        />

        <p v-if="errorMessage.length > 0" class="text-base ms-2 text-red-500">
          {{ errorMessage }}
        </p>
        <p
          v-else
          class="text-base ms-2"
          :class="fileName ? 'text-gray-900 font-semibold' : 'text-gray-700'"
        >
          <span v-if="fileName" class="font-normal"
            >{{ t`Selected file` }}
          </span>
          {{ helperMessage }}{{ fileName ? ',' : '' }}
          <span v-if="fileName" class="font-normal">
            {{ t`verify the imported data and click on` }} </span
          >{{ ' ' }}<span v-if="fileName">{{ t`Import Data` }}</span>
        </p>
      </div>

      <!-- Bulk Entries Grid -->
      <div v-if="hasImporter">
        <div
          class="flex justify-start"
          style="max-height: calc(100vh - (2 * var(--h-row-largest)) - 2px)"
        >
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
            <div class="flex items-center h-7 flex-shrink-0">#</div>
            <div
              v-for="(_, i) of importer.valueMatrix"
              :key="i"
              class="flex items-center group h-7 flex-shrink-0"
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
            class="overflow-auto gap-4 p-4 grid"
            :style="`grid-template-columns: repeat(${columnCount}, 10rem)`"
          >
            <!-- Grid Title Row Cells, Allow Column Selection -->
            <AutoComplete
              v-for="index in columnIterator"
              class="flex-shrink-0"
              size="small"
              :border="true"
              :key="index"
              :df="gridColumnTitleDf"
              :value="importer.assignedTemplateFields[index]"
              @change="(value: string | null) => importer.setTemplateField(index, value)"
            />

            <!-- Grid Value Row Cells, Allow Editing Values -->
            <template v-for="(row, ridx) of importer.valueMatrix">
              <template
                v-for="(val, cidx) of row.slice(0, columnCount)"
                :key="`cell-${ridx}-${cidx}`"
              >
                <!-- Raw Data Field if Column is Not Assigned -->
                <Data
                  v-if="!importer.assignedTemplateFields[cidx]"
                  :title="getFieldTitle(val)"
                  :df="{
                    fieldname: 'tempField',
                    label: t`Temporary`,
                    placeholder: t`Select column`,
                  }"
                  size="small"
                  :border="true"
                  :value="
                    val.value != null
                      ? String(val.value)
                      : val.rawValue != null
                      ? String(val.rawValue)
                      : ''
                  "
                  :read-only="true"
                />

                <!-- FormControl Field if Column is Assigned -->
                <FormControl
                  v-else
                  :class="val.error ? 'border border-red-300 rounded-md' : ''"
                  :title="getFieldTitle(val)"
                  :df="
                    importer.templateFieldsMap.get(
                      importer.assignedTemplateFields[cidx]!
                    )
                  "
                  size="small"
                  :rows="1"
                  :border="true"
                  :value="val.error ? null : val.value"
                  @change="(value: DocValue)=> {
                    importer.valueMatrix[ridx][cidx]!.error = false
                    importer.valueMatrix[ridx][cidx]!.value = value
                  }"
                />
              </template>
            </template>
          </div>
        </div>
        <hr />
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
          {{
            t`Successfully created the following ${succeeded.length} entries:`
          }}
        </p>
        <div class="max-h-96 overflow-y-auto">
          <div
            v-for="(n, i) in succeeded"
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

    <!-- How to Use Link -->
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

    <!-- Loading Bar when Saving Docs -->
    <Loading
      v-if="isMakingEntries"
      :open="isMakingEntries"
      :percent="percentLoading"
      :message="messageLoading"
    />

    <!-- Pick Column Modal -->
    <Modal
      :open-modal="showColumnPicker"
      @closemodal="showColumnPicker = false"
    >
      <div class="w-form">
        <!-- Pick Column Header -->
        <FormHeader :form-title="t`Pick Import Columns`" />
        <hr />

        <!-- Pick Column Checkboxes -->
        <div
          class="p-4 max-h-80 overflow-auto custom-scroll"
          v-for="[key, value] of columnPickerFieldsMap.entries()"
          :key="key"
        >
          <h2 class="text-sm font-semibold text-gray-800">
            {{ key }}
          </h2>
          <div class="grid grid-cols-3 border rounded mt-1">
            <div
              v-for="tf of value"
              :key="tf.fieldKey"
              class="flex items-center"
            >
              <Check
                :df="{
                  fieldname: tf.fieldname,
                  label: tf.label,
                }"
                :show-label="true"
                :read-only="tf.required"
                :value="importer.templateFieldsPicked.get(tf.fieldKey)"
                @change="(value:boolean) => pickColumn(tf.fieldKey, value)"
              />
              <p v-if="tf.required" class="w-0 text-red-600 -ml-4">*</p>
            </div>
          </div>
        </div>

        <!-- Pick Column Footer -->
        <hr />
        <div class="p-4 flex justify-between items-center">
          <p class="text-sm text-gray-600">
            {{ t`${numColumnsPicked} fields selected` }}
          </p>
          <Button type="primary" @click="showColumnPicker = false">{{
            t`Done`
          }}</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script lang="ts">
import { DocValue } from 'fyo/core/types';
import { RawValue } from 'schemas/types';
import { Action as BaseAction } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { OptionField, SelectOption } from 'schemas/types';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import Check from 'src/components/Controls/Check.vue';
import Data from 'src/components/Controls/Data.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import FormHeader from 'src/components/FormHeader.vue';
import HowTo from 'src/components/HowTo.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { getColumnLabel, Importer, TemplateField } from 'src/importer';
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

type ImportWizardData = {
  showColumnPicker: boolean;
  canReset: boolean;
  complete: boolean;
  succeeded: string[];
  failed: { name: string; error: Error }[];
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
    Data,
    Modal,
    FormHeader,
    Check,
  },
  data() {
    return {
      showColumnPicker: false,
      canReset: false,
      complete: false,
      succeeded: [],
      failed: [],
      file: null,
      nullOrImporter: null,
      importType: '',
      isMakingEntries: false,
      percentLoading: 0,
      messageLoading: '',
    } as ImportWizardData;
  },
  mounted() {
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.iw = this;
      this.setImportType('Item');
    }
  },
  computed: {
    duplicates(): string[] {
      if (!this.hasImporter) {
        return [];
      }

      const dupes = new Set<string>();
      const assignedSet = new Set<string>();

      for (const key of this.importer.assignedTemplateFields) {
        if (!key) {
          continue;
        }

        const tf = this.importer.templateFieldsMap.get(key);
        if (assignedSet.has(key) && tf) {
          dupes.add(getColumnLabel(tf));
        }

        assignedSet.add(key);
      }

      return Array.from(dupes);
    },
    requiredNotSelected(): string[] {
      if (!this.hasImporter) {
        return [];
      }

      const assigned = new Set(this.importer.assignedTemplateFields);
      return [...this.importer.templateFieldsMap.values()]
        .filter((f) => f.required && !assigned.has(f.fieldKey))
        .map((f) => getColumnLabel(f));
    },
    errorMessage(): string {
      if (this.duplicates.length) {
        return this.t`Duplicate columns found: ${this.duplicates.join(', ')}`;
      }

      if (this.requiredNotSelected.length) {
        return this
          .t`Required fields not selected: ${this.requiredNotSelected.join(
          ', '
        )}`;
      }

      return '';
    },
    canImportData(): boolean {
      if (!this.hasImporter) {
        return false;
      }

      return this.importer.valueMatrix.length > 0;
    },
    canSelectFile(): boolean {
      return !this.file;
    },
    columnCount(): number {
      let vmColumnCount = 0;
      if (this.importer.valueMatrix.length) {
        vmColumnCount = this.importer.valueMatrix[0].length;
      }

      if (!this.file) {
        return this.numColumnsPicked;
      }

      return Math.max(this.numColumnsPicked, vmColumnCount);
    },
    columnIterator(): number[] {
      return Array(this.columnCount)
        .fill(null)
        .map((_, i) => i);
    },
    hasImporter(): boolean {
      return !!this.nullOrImporter;
    },
    numColumnsPicked(): number {
      return [...this.importer.templateFieldsPicked.values()].filter(Boolean)
        .length;
    },
    columnPickerFieldsMap(): Map<string, TemplateField[]> {
      const map: Map<string, TemplateField[]> = new Map();

      for (const value of this.importer.templateFieldsMap.values()) {
        let label = value.schemaLabel;
        if (value.parentSchemaChildField) {
          label = `${value.parentSchemaChildField.label} (${value.schemaLabel})`;
        }

        if (!map.has(label)) {
          map.set(label, []);
        }

        map.get(label)!.push(value);
      }

      return map;
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
    actions(): Action[] {
      const actions: Action[] = [];

      let selectFileLabel = this.t`Select File`;
      if (this.file) {
        selectFileLabel = this.t`Change File`;
      }

      if (this.canImportData) {
        actions.push({
          component: {
            template: `<span>{{ "${selectFileLabel}" }}</span>`,
          },
          action: this.selectFile,
        });
      }

      const pickColumnsAction = {
        component: {
          template: '<span>{{ t`Pick Import Columns` }}</span>',
        },
        action: () => (this.showColumnPicker = true),
      };

      const cancelAction = {
        component: {
          template: '<span class="text-red-700" >{{ t`Cancel` }}</span>',
        },
        action: this.clear,
      };
      actions.push(pickColumnsAction, cancelAction);

      return actions;
    },
    fileName(): string {
      if (!this.file) {
        return '';
      }

      return this.file.name;
    },
    helperMessage(): string {
      if (!this.importType) {
        return this.t`Set an Import Type`;
      } else if (!this.fileName) {
        return this.t`Select a file or add rows`;
      }

      return this.fileName;
    },
    isSubmittable(): boolean {
      const schemaName = this.importer.schemaName;
      return fyo.schemaMap[schemaName]?.isSubmittable ?? false;
    },
    gridColumnTitleDf(): OptionField {
      const options: SelectOption[] = [];
      for (const field of this.importer.templateFieldsMap.values()) {
        const value = field.fieldKey;
        if (!this.importer.templateFieldsPicked.get(value)) {
          continue;
        }

        const label = getColumnLabel(field);

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
        .filter(([_, picked]) => picked)
        .map(([key, _]) => key);
    },
  },
  activated(): void {
    docsPathRef.value = docsPathMap.ImportWizard ?? '';
  },
  deactivated(): void {
    docsPathRef.value = '';
    if (!this.complete) {
      return;
    }

    this.clear();
  },
  methods: {
    getFieldTitle(vmi: {
      value?: DocValue;
      rawValue?: RawValue;
      error?: boolean;
    }): string {
      const title: string[] = [];
      if (vmi.value != null) {
        title.push(this.t`Value: ${String(vmi.value)}`);
      }

      if (vmi.rawValue != null) {
        title.push(this.t`Raw Value: ${String(vmi.rawValue)}`);
      }

      if (vmi.error) {
        title.push(this.t`Conversion Error`);
      }

      if (!title.length) {
        return this.t`No Value`;
      }

      return title.join(', ');
    },
    pickColumn(fieldKey: string, value: boolean): void {
      this.importer.templateFieldsPicked.set(fieldKey, value);
      if (value) {
        return;
      }

      const idx = this.importer.assignedTemplateFields.findIndex(
        (f) => f === fieldKey
      );

      if (idx >= 0) {
        this.importer.assignedTemplateFields[idx] = null;
        this.reassignTemplateFields();
      }
    },
    reassignTemplateFields(): void {
      if (this.importer.valueMatrix.length) {
        return;
      }

      for (const idx in this.importer.assignedTemplateFields) {
        this.importer.assignedTemplateFields[idx] = null;
      }

      let idx = 0;
      for (const [fieldKey, value] of this.importer.templateFieldsPicked) {
        if (!value) {
          continue;
        }

        this.importer.assignedTemplateFields[idx] = fieldKey;
        idx += 1;
      }
    },
    showMe(): void {
      const schemaName = this.importer.schemaName;
      this.clear();
      this.$router.push(`/list/${schemaName}`);
    },
    clear(): void {
      this.file = null;
      this.succeeded = [];
      this.failed = [];
      this.nullOrImporter = null;
      this.importType = '';
      this.complete = false;
      this.canReset = false;
      this.isMakingEntries = false;
      this.percentLoading = 0;
      this.messageLoading = '';
    },
    async saveTemplate(): Promise<void> {
      const template = this.importer.getCSVTemplate();
      const templateName = this.importType + ' ' + this.t`Template`;
      const { canceled, filePath } = await getSavePath(templateName, 'csv');

      if (canceled || !filePath) {
        return;
      }

      await saveData(template, filePath);
    },
    async preImportValidations(): Promise<boolean> {
      const message = this.t`Cannot Import`;
      if (this.errorMessage.length) {
        await showMessageDialog({
          message,
          detail: this.errorMessage,
        });
        return false;
      }

      const cellErrors = this.importer.checkCellErrors();
      if (cellErrors.length) {
        await showMessageDialog({
          message,
          detail: this.t`Following cells have errors: ${cellErrors.join(', ')}`,
        });
        return false;
      }

      const absentLinks = await this.importer.checkLinks();
      if (absentLinks.length) {
        await showMessageDialog({
          message,
          detail: this.t`Following links do not exist: ${absentLinks
            .map((l) => `(${l.schemaLabel}, ${l.name})`)
            .join(', ')}`,
        });
        return false;
      }

      return true;
    },
    async importData(): Promise<void> {
      const isValid = await this.preImportValidations();
      if (!isValid || this.isMakingEntries || this.complete) {
        return;
      }

      this.importer.populateDocs();

      let doneCount = 0;
      for (const doc of this.importer.docs) {
        this.setLoadingStatus(doneCount, this.importer.docs.length);
        try {
          await doc.sync();
          doneCount += 1;

          this.succeeded.push(doc.name!);
        } catch (error) {
          if (error instanceof Error) {
            this.failed.push({ name: doc.name!, error });
          }
        }
      }

      this.isMakingEntries = false;
      this.complete = true;
    },
    setImportType(importType: string): void {
      this.clear();
      if (!importType) {
        return;
      }

      this.importType = importType;
      this.nullOrImporter = new Importer(importType, fyo);
    },
    setLoadingStatus(entriesMade: number, totalEntries: number): void {
      this.percentLoading = entriesMade / totalEntries;
      this.messageLoading = this.isMakingEntries
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
</script>
