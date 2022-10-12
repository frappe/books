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
import { Field } from 'schemas/types';
import TwoColumnForm from 'src/components/TwoColumnForm.vue';

export default {
  name: 'TabGeneral',
  emits: ['change'],
  components: {
    TwoColumnForm,
  },
  data() {
    return {
      doc: undefined,
    } as { doc?: Doc };
  },
  computed: {
    fields() {
      return [] as Field[];
    },
  },
};
</script>
