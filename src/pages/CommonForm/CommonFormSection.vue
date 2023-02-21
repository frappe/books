<template>
  <div v-if="(fields ?? []).length > 0">
    <div
      v-if="showTitle && title"
      class="flex justify-between items-center cursor-pointer select-none"
      :class="collapsed ? '' : 'mb-4'"
      @click="collapsed = !collapsed"
    >
      <h2 class="text-base text-gray-900 font-semibold">
        {{ title }}
      </h2>
      <feather-icon
        :name="collapsed ? 'chevron-up' : 'chevron-down'"
        class="w-4 h-4 text-gray-600"
      />
    </div>
    <div class="grid gap-4 gap-x-8 grid-cols-2" v-if="!collapsed">
      <div
        v-for="field of fields"
        :key="field.fieldname"
        :class="field.fieldtype === 'Table' ? 'col-span-2 text-base' : ''"
        class="mb-auto"
      >
        <FormControl
          :ref="field.fieldname === 'name' ? 'nameField' : 'fields'"
          :show-label="true"
          :border="true"
          :df="field"
          :value="doc[field.fieldname]"
          @editrow="(doc: Doc) => $emit('editrow', doc)"
          @change="(value: DocValue) => $emit('value-change', field, value)"
        />
        <div v-if="errors?.[field.fieldname]" class="text-sm text-red-600 mt-1">
          {{ errors[field.fieldname] }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import FormControl from 'src/components/Controls/FormControl.vue';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  emits: ['editrow', 'value-change'],
  props: {
    title: String,
    errors: Object as PropType<Record<string, string>>,
    showTitle: Boolean,
    doc: { type: Object as PropType<Doc>, required: true },
    fields: Array as PropType<Field[]>,
  },
  data() {
    return { collapsed: false } as {
      collapsed: boolean;
    };
  },
  mounted() {
    this.focusOnNameField();
  },
  methods: {
    focusOnNameField() {
      const naming = this.fyo.schemaMap[this.doc.schemaName]?.naming;
      if (naming !== 'manual') {
        return;
      }

      const nameField = (this.$refs.nameField as { focus: Function }[])?.[0];
      if (!nameField) {
        return;
      }

      nameField.focus();
    },
  },
  components: { FormControl },
});
</script>
