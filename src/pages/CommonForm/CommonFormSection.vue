<template>
  <div class="grid gap-4 gap-x-8 grid-cols-2">
    <FormControl
      v-for="field of filteredFields"
      :class="field.fieldtype === 'Table' ? 'col-span-2' : ''"
      :show-label="true"
      :border="true"
      :key="field.fieldname"
      :df="field"
      :value="getRegularValue(field)"
      @change="async (value) => await doc.set(field.fieldname, value)"
    />
  </div>
</template>
<script lang="ts">
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import FormControl from 'src/components/Controls/FormControl.vue';
import { evaluateHidden } from 'src/utils/doc';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    title: String,
    showTitle: Boolean,
    doc: { type: Object as PropType<Doc>, required: true },
    fields: Array as PropType<Field[]>,
  },
  computed: {
    filteredFields(): Field[] {
      return (this.fields ?? []).filter((f) => !evaluateHidden(f, this.doc));
    },
  },
  methods: {
    getRegularValue(field: Field): DocValue | Doc[] {
      return this.doc.get(field.fieldname);
    },
  },
  components: { FormControl },
});
</script>
