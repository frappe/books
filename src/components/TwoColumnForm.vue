<template>
  <div class="text-sm">
    <template v-for="df in formFields">
      <!-- Table Field Form (Eg: PaymentFor) -->
      <Table
        v-if="df.fieldtype === 'Table'"
        :key="`${df.fieldname}-table`"
        ref="controls"
        size="small"
        :df="df"
        :value="(doc[df.fieldname] ?? []) as unknown[]"
        @change="async (value) => await onChange(df, value)"
      />

      <!-- Regular Field Form -->
      <div
        v-else
        :key="`${df.fieldname}-regular`"
        class="grid items-center border-b dark:border-gray-800"
        :style="{
          ...style,
          height: getFieldHeight(df),
        }"
      >
        <div class="ps-4 flex text-gray-600 dark:text-gray-400">
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
          />
          <div
            v-if="errors[df.fieldname]"
            class="text-sm text-red-600 mt-2 ps-2"
          >
            {{ errors[df.fieldname] }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import FormControl from 'src/components/Controls/FormControl.vue';
import { fyo } from 'src/initFyo';
import { getErrorMessage } from 'src/utils';
import { evaluateHidden } from 'src/utils/doc';
import Table from './Controls/Table.vue';
import { defineComponent } from 'vue';
import { Field } from 'schemas/types';
import { PropType } from 'vue';
import { DocValue } from 'fyo/core/types';

export default defineComponent({
  name: 'TwoColumnForm',
  components: {
    FormControl,
    Table,
  },
  props: {
    doc: { type: Doc, required: true },
    fields: { type: Array as PropType<Field[]>, default: () => [] },
    columnRatio: {
      type: Array as PropType<number[]>,
      default: () => [1, 1],
    },
  },
  data() {
    return {
      formFields: [],
      errors: {},
    } as { formFields: Field[]; errors: Record<string, string> };
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
  watch: {
    doc() {
      this.setFormFields();
    },
  },
  mounted() {
    this.setFormFields();
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.tcf = this;
    }
  },
  methods: {
    getFieldHeight(field: Field) {
      if (['AttachImage', 'Text'].includes(field.fieldtype)) {
        return 'calc((var(--h-row-mid) + 1px) * 2)';
      }

      if (this.errors[field.fieldname]) {
        return 'calc((var(--h-row-mid) + 1px) * 2)';
      }

      return 'calc(var(--h-row-mid) + 1px)';
    },
    async onChange(field: Field, value: DocValue) {
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
});
</script>
