<template>
  <div v-if="filteredFields.length > 0">
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
      <FormControl
        v-for="field of filteredFields"
        class="mt-auto"
        :class="field.fieldtype === 'Table' ? 'col-span-2 text-base' : ''"
        :show-label="true"
        :border="true"
        :key="field.fieldname"
        :df="field"
        :value="doc[field.fieldname]"
        @editrow="(doc:Doc) => $emit('editrow', doc)"
        @change="async (value) => await doc.set(field.fieldname, value)"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import FormControl from 'src/components/Controls/FormControl.vue';
import { evaluateHidden } from 'src/utils/doc';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  emits: ['editrow'],
  props: {
    title: String,
    showTitle: Boolean,
    doc: { type: Object as PropType<Doc>, required: true },
    fields: Array as PropType<Field[]>,
  },
  data() {
    return { collapsed: false };
  },
  computed: {
    filteredFields(): Field[] {
      const fields: Field[] = [];
      for (const field of this.fields ?? []) {
        if (evaluateHidden(field, this.doc)) {
          continue;
        }

        if (field.meta) {
          continue;
        }

        fields.push(field);
      }
      return fields;
    },
  },
  components: { FormControl },
});
</script>
