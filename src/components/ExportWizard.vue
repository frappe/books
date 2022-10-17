<template>
  <div>
    <!-- Export Wizard Header -->
    <FormHeader :form-title="label" :form-sub-title="t`Export Wizard`" />
    <hr />

    <!-- Export Config -->
    <div class="grid grid-cols-3 p-4 gap-4">
      <Check
        v-if="configFields.useListFilters"
        :df="configFields.useListFilters"
        :space-between="true"
        :show-label="true"
        :label-right="false"
        :value="useListFilters"
        :border="true"
        @change="(value: boolean) => (useListFilters = value)"
      />
      <Select
        v-if="configFields.exportFormat"
        :df="configFields.exportFormat"
        :value="exportFormat"
        :border="true"
        @change="(value: ExportFormat) => (exportFormat = value)"
      />
    </div>
    <hr />

    <!-- Fields Selection -->
    <div>
      <!-- Field Selection Header -->
      <button
        class="flex justify-between items-center text-gray-600 p-4 w-full"
        @click="showFieldSelection = !showFieldSelection"
      >
        <p class="text-sm">
          {{ t`${numSelected} fields selected` }}
        </p>
        <feather-icon
          :name="showFieldSelection ? 'chevron-down' : 'chevron-up'"
          class="w-4 h-4"
        />
      </button>

      <!-- Field Selection Body -->
      <hr v-if="showFieldSelection" />
      <div
        v-if="showFieldSelection"
        class="max-h-96 overflow-auto custom-scroll"
      >
        <!-- Main Fields -->
        <div class="p-4">
          <h2 class="text-sm font-semibold text-gray-800">
            {{ fyo.schemaMap[schemaName]?.label ?? schemaName }}
          </h2>
          <div class="grid grid-cols-3 border rounded-md mt-1">
            <Check
              v-for="ef of fields"
              :label-class="
                ef.fieldtype === 'Table'
                  ? 'text-sm text-gray-600 font-semibold'
                  : 'text-sm text-gray-600'
              "
              :key="ef.fieldname"
              :df="getField(ef)"
              :show-label="true"
              :value="ef.export"
              @change="(value: boolean) => setExportFieldValue(ef, value)"
            />
          </div>
        </div>

        <!-- Table Fields -->
        <div
          class="p-4"
          v-for="efs of filteredTableFields"
          :key="efs.fieldname"
        >
          <h2 class="text-sm font-semibold text-gray-800">
            {{ fyo.schemaMap[efs.target]?.label ?? schemaName }}
          </h2>
          <div class="grid grid-cols-3 border rounded-md mt-1">
            <Check
              v-for="ef of efs.fields"
              :key="ef.fieldname"
              :df="getField(ef)"
              :show-label="true"
              :value="ef.export"
              @change="(value: boolean) => setExportFieldValue(ef, value, efs.target)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Export Button -->
    <hr />
    <div class="p-4 flex justify-between items-center">
      <p class="text-gray-600 text-sm">{{ t`${numEntries} entries` }}</p>
      <Button type="primary" @click="exportData">{{ t`Export` }}</Button>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { Field, FieldTypeEnum, TargetField } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import Button from './Button.vue';
import Check from './Controls/Check.vue';
import Select from './Controls/Select.vue';
import FormHeader from './FormHeader.vue';

interface ExportField {
  fieldname: string;
  fieldtype: FieldTypeEnum;
  label: string;
  export: boolean;
}

interface ExportTableField {
  fieldname: string;
  label: string;
  target: string;
  fields: ExportField[];
}

type ExportFormat = 'csv' | 'json';
interface ExportWizardData {
  numEntries: number;
  useListFilters: boolean;
  exportFormat: ExportFormat;
  showFieldSelection: boolean;
  fields: ExportField[];
  tableFields: ExportTableField[];
}

const excludedFieldTypes = [
  FieldTypeEnum.AttachImage,
  FieldTypeEnum.Attachment,
];

export default defineComponent({
  props: {
    schemaName: { type: String, required: true },
    pageTitle: String,
  },
  data() {
    const fields = fyo.schemaMap[this.schemaName]?.fields ?? [];
    const exportFields = getExportFields(fields);
    const exportTableFields = getExportTableFields(fields);

    return {
      numEntries: 0,
      useListFilters: true,
      exportFormat: 'csv',
      fields: exportFields,
      tableFields: exportTableFields,
      showFieldSelection: !false,
    } as ExportWizardData;
  },
  methods: {
    getField(ef: ExportField): Field {
      return {
        fieldtype: 'Check',
        label: ef.label,
        fieldname: ef.fieldname,
      };
    },
    getExportField(
      fieldname: string,
      target?: string
    ): ExportField | undefined {
      let fields: ExportField[] | undefined;

      if (!target) {
        fields = this.fields;
      } else {
        fields = this.tableFields.find((f) => f.target === target)?.fields;
      }

      if (!fields) {
        return undefined;
      }

      return fields.find((f) => f.fieldname === fieldname);
    },
    setExportFieldValue(ef: ExportField, value: boolean, target?: string) {
      const field = this.getExportField(ef.fieldname, target);
      if (!field) {
        return;
      }

      field.export = value;
    },
    exportData() {
      console.log('export clicked');
    },
  },
  computed: {
    label() {
      if (this.pageTitle) {
        return this.pageTitle;
      }

      return fyo.schemaMap?.[this.schemaName]?.label ?? '';
    },
    filteredTableFields() {
      return this.tableFields.filter((f) => {
        const ef = this.getExportField(f.fieldname);
        return !!ef?.export;
      });
    },
    numSelected() {
      return (
        this.filteredTableFields.reduce(
          (acc, f) => f.fields.filter((f) => f.export).length + acc,
          0
        ) +
        this.fields.filter(
          (f) => f.fieldtype !== FieldTypeEnum.Table && f.export
        ).length
      );
    },
    configFields() {
      return {
        useListFilters: {
          fieldtype: 'Check',
          label: t`Use List Filters`,
          fieldname: 'useListFilters',
        },
        exportFormat: {
          fieldtype: 'Select',
          label: t`Export Format`,
          fieldname: 'exportFormat',
          options: [
            { value: 'json', label: 'JSON' },
            { value: 'csv', label: 'CSV' },
          ],
        },
      };
    },
  },
  components: { FormHeader, Check, Select, Button },
});

function getExportFields(fields: Field[]): ExportField[] {
  return fields
    .filter((f) => !f.computed && f.label)
    .map((field) => {
      const { fieldname, label } = field;
      const fieldtype = field.fieldtype as FieldTypeEnum;
      return {
        fieldname,
        fieldtype,
        label,
        export: !excludedFieldTypes.includes(fieldtype),
      };
    });
}

function getExportTableFields(fields: Field[]): ExportTableField[] {
  return fields
    .filter((f) => f.fieldtype === FieldTypeEnum.Table)
    .map((f) => {
      const target = (f as TargetField).target;
      const tableFields = fyo.schemaMap[target]?.fields ?? [];
      const exportTableFields = getExportFields(tableFields);

      return {
        fieldname: f.fieldname,
        label: f.label,
        target,
        fields: exportTableFields,
      };
    })
    .filter((f) => !!f.fields.length);
}
</script>
