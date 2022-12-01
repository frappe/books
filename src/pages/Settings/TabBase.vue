<template>
  <div>
    <TwoColumnForm
      v-if="doc"
      :doc="doc"
      :fields="fields"
      :autosave="true"
      :emit-change="true"
      @change="(...args:unknown[])=>$emit('change', ...args)"
    />
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import TwoColumnForm from 'src/components/TwoColumnForm.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TabGeneral',
  emits: ['change'],
  props: { schemaName: String },
  components: {
    TwoColumnForm,
  },
  async mounted() {
    await this.setDoc();
  },
  watch: {
    async schemaName() {
      await this.setDoc();
    },
  },
  methods: {
    async setDoc() {
      if (this.doc && this.schemaName === this.doc.schemaName) {
        return;
      }

      if (!this.schemaName) {
        return;
      }

      this.doc = await this.fyo.doc.getDoc(this.schemaName, this.schemaName, {
        skipDocumentCache: true,
      });
    },
  },
  data() {
    return {
      doc: undefined,
    } as { doc?: Doc };
  },
  computed: {
    fields() {
      return this.doc?.schema.fields;
    },
  },
});
</script>
