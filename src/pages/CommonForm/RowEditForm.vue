<template>
  <div
    class="border-s dark:border-gray-800 h-full overflow-auto w-quick-edit bg-white dark:bg-gray-890 custom-scroll custom-scroll-thumb2"
  >
    <!-- Row Edit Tool bar -->
    <div class="sticky top-0 border-b dark:border-gray-800 bg-white dark:bg-gray-890" style="z-index: 1">
      <div class="flex items-center justify-between px-4 h-row-largest">
        <!-- Close Button -->
        <Button :icon="true" @click="$emit('close')">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>

        <!-- Actions, Badge and Status Change Buttons -->
        <div class="flex items-stretch gap-2">
          <Button
            v-if="previous >= 0"
            :icon="true"
            @click="$emit('previous', previous)"
          >
            <feather-icon name="chevron-left" class="w-4 h-4" />
          </Button>
          <Button v-if="next >= 0" :icon="true" @click="$emit('next', next)">
            <feather-icon name="chevron-right" class="w-4 h-4" />
          </Button>
        </div>
      </div>
      <FormHeader
        class="border-t dark:border-gray-800"
        :form-title="t`Row ${index + 1}`"
        :form-sub-title="fieldlabel"
      />
    </div>
    <TwoColumnForm
      ref="form"
      class="w-full"
      :doc="row"
      :fields="fields"
      :column-ratio="[1.1, 2]"
    />
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { ValueError } from 'fyo/utils/errors';
import Button from 'src/components/Button.vue';
import FormHeader from 'src/components/FormHeader.vue';
import TwoColumnForm from 'src/components/TwoColumnForm.vue';
import { shortcutsKey } from 'src/utils/injectionKeys';
import { computed } from 'vue';
import { inject } from 'vue';
import { defineComponent } from 'vue';

const COMPONENT_NAME = 'RowEditForm';

export default defineComponent({
  components: { Button, TwoColumnForm, FormHeader },
  provide() {
    return {
      doc: computed(() => this.row),
    };
  },
  props: {
    doc: { type: Doc, required: true },
    index: { type: Number, required: true },
    fieldname: { type: String, required: true },
  },
  emits: ['next', 'previous', 'close'],
  setup() {
    return { shortcuts: inject(shortcutsKey) };
  },
  computed: {
    fieldlabel() {
      return (
        this.fyo.getField(this.doc.schemaName, this.fieldname)?.label ?? ''
      );
    },
    row() {
      const rows = this.doc.get(this.fieldname);
      if (Array.isArray(rows) && rows[this.index] instanceof Doc) {
        return rows[this.index];
      }

      const label = `${this.doc.name ?? '_name'}.${this.fieldname}[${
        this.index
      }]`;
      throw new ValueError(this.t`Invalid value found for ${label}`);
    },
    fields() {
      const fieldnames = this.row.schema.quickEditFields ?? [];
      return fieldnames.map((f) => this.fyo.getField(this.row.schemaName, f));
    },
    previous(): number {
      return this.index - 1;
    },
    next() {
      const rows = this.doc.get(this.fieldname);
      if (!Array.isArray(rows)) {
        return -1;
      }

      if (rows.length - 1 === this.index) {
        return -1;
      }

      return this.index + 1;
    },
  },
  mounted() {
    this.shortcuts?.set(COMPONENT_NAME, ['Escape'], () => this.$emit('close'));
  },
  unmounted() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
});
</script>
