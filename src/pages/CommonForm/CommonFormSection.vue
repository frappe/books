<template>
  <div v-if="(fields ?? []).length > 0">
    <div
      v-if="showTitle && title"
      class="flex justify-between items-center select-none"
      :class="[collapsed ? '' : 'mb-4', collapsible ? 'cursor-pointer' : '']"
      @click="toggleCollapsed"
    >
      <h2 class="text-base text-gray-900 dark:text-gray-25 font-semibold">
        {{ title }}
      </h2>
      <feather-icon
        v-if="collapsible"
        :name="collapsed ? 'chevron-up' : 'chevron-down'"
        class="w-4 h-4 text-gray-600 dark:text-gray-400"
      />
    </div>
    <div v-if="!collapsed" class="grid gap-4 gap-x-8 grid-cols-2">
      <div
        v-for="field of fields"
        :key="field.fieldname"
        :class="[
          field.fieldtype === 'Table' ? 'col-span-2 text-base' : '',
          field.fieldtype === 'AttachImage' ? 'row-span-2' : '',
          field.fieldtype === 'Check' ? 'mt-auto' : 'mb-auto',
        ]"
      >
        <Table
          v-if="field.fieldtype === 'Table'"
          ref="fields"
          :show-label="true"
          :border="true"
          :df="field"
          :value="tableValue(doc[field.fieldname])"
          @editrow="(doc: Doc) => $emit('editrow', doc)"
          @change="(value: DocValue) => $emit('value-change', field, value)"
          @row-change="(field:Field, value:DocValue, parentfield:Field) => $emit('row-change',field, value, parentfield)"
        />
        <FormControl
          v-else
          :ref="field.fieldname === 'name' ? 'nameField' : 'fields'"
          :size="field.fieldtype === 'AttachImage' ? 'form' : undefined"
          :show-label="true"
          :border="true"
          :df="field"
          :value="doc[field.fieldname]"
          @editrow="(doc: Doc) => $emit('editrow', doc)"
          @change="(value: DocValue) => $emit('value-change', field, value)"
          @row-change="(field:Field, value:DocValue, parentfield:Field) => $emit('row-change',field, value, parentfield)"
        />
        <div v-if="errors?.[field.fieldname]" class="text-sm text-red-600 mt-1">
          {{ errors[field.fieldname] }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import FormControl from 'src/components/Controls/FormControl.vue';
import Table from 'src/components/Controls/Table.vue';
import { focusOrSelectFormControl } from 'src/utils/ui';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  components: { FormControl, Table },
  props: {
    title: { type: String, default: '' },
    errors: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
    showTitle: Boolean,
    doc: { type: Object as PropType<Doc>, required: true },
    collapsible: { type: Boolean, default: true },
    fields: { type: Array as PropType<Field[]>, required: true },
  },
  emits: ['editrow', 'value-change', 'row-change'],
  data() {
    return { collapsed: false } as {
      collapsed: boolean;
    };
  },
  mounted() {
    focusOrSelectFormControl(this.doc, this.$refs.nameField);
  },
  methods: {
    tableValue(value: unknown): unknown[] {
      if (Array.isArray(value)) {
        return value;
      }

      return [];
    },
    toggleCollapsed() {
      if (!this.collapsible) {
        return;
      }

      this.collapsed = !this.collapsed;
    },
  },
});
</script>
