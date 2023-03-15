<template>
  <div class="text-sm border-t">
    <template v-for="df in formFields">
      <!-- Table Field Form (Eg: PaymentFor) -->
      <Table
        v-if="df.fieldtype === 'Table'"
        :key="`${df.fieldname}-table`"
        ref="controls"
        size="small"
        :df="df"
        :value="doc[df.fieldname]"
        @change="async (value) => await onChange(df, value)"
      />

      <!-- Regular Field Form -->
      <div
        v-else
        class="grid items-center border-b"
        :key="`${df.fieldname}-regular`"
        :style="{
          ...style,
          height: getFieldHeight(df),
        }"
      >
        <div class="ps-4 flex text-gray-600">
          {{ df.label }}
        </div>

        <div
          class="py-2 pe-4"
          :class="{
            'ps-2': df.fieldtype === 'AttachImage',
          }"
        >
          <FormControl
            ref="controls"
            size="small"
            :df="df"
            :value="doc[df.fieldname]"
            :class="{ 'p-2': df.fieldtype === 'Check' }"
            :text-end="false"
            @change="async (value) => await onChange(df, value)"
            @new-doc="async (newdoc) => await onChange(df, newdoc.name)"
          />
          <div
            class="text-sm text-red-600 mt-2 ps-2"
            v-if="errors[df.fieldname]"
          >
            {{ errors[df.fieldname] }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script>
import { Doc } from 'fyo/model/doc';
import FormControl from 'src/components/Controls/FormControl.vue';
import { fyo } from 'src/initFyo';
import { getErrorMessage } from 'src/utils';
import { evaluateHidden } from 'src/utils/doc';
import Table from './Controls/Table.vue';

export default {
  name: 'TwoColumnForm',
  props: {
    doc: Doc,
    fields: { type: Array, default: () => [] },
    columnRatio: {
      type: Array,
      default: () => [1, 1],
    },
  },
  watch: {
    doc() {
      this.setFormFields();
    },
  },
  data() {
    return {
      formFields: [],
      errors: {},
    };
  },
  provide() {
    return {
      schemaName: this.doc.schemaName,
      name: this.doc.name,
      doc: this.doc,
    };
  },
  components: {
    FormControl,
    Table,
  },
  mounted() {
    this.setFormFields();
    if (fyo.store.isDevelopment) {
      window.tcf = this;
    }
  },
  methods: {
    getFieldHeight(df) {
      if (['AttachImage', 'Text'].includes(df.fieldtype)) {
        return 'calc((var(--h-row-mid) + 1px) * 2)';
      }

      if (this.errors[df.fieldname]) {
        return 'calc((var(--h-row-mid) + 1px) * 2)';
      }

      return 'calc(var(--h-row-mid) + 1px)';
    },
    async onChange(field, value) {
      const { fieldname } = field;
      delete this.errors[fieldname];

      let isSet = false;
      try {
        isSet = await this.doc.set(fieldname, value);
      } catch (err) {
        if (!(err instanceof Error)) {
          return;
        }

        this.errors[fieldname] = getErrorMessage(err, this.doc);
      }

      if (isSet) {
        this.setFormFields();
      }
    },
    setFormFields() {
      let fieldList = this.fields;

      if (fieldList.length === 0) {
        fieldList = this.doc.quickEditFields;
      }

      if (fieldList.length === 0) {
        fieldList = this.doc.schema.fields.filter((f) => f.required);
      }

      this.formFields = fieldList.filter(
        (field) => field && !evaluateHidden(field, this.doc)
      );
    },
  },
  computed: {
    style() {
      let templateColumns = (this.columnRatio || [1, 1])
        .map((r) => `minmax(0, ${r}fr)`)
        .join(' ');
      return {
        'grid-template-columns': templateColumns,
      };
    },
  },
};
</script>
