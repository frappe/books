<template>
  <div class="form-group">
    <model-table
      :doctype="docfield.childtype"
      :rows="value"
      @update:rows="emitChange"
    />
  </div>
</template>

<script>
import ModelTable from '../ModelTable';
import Base from './Base';

export default {
  extends: Base,
  components: {
    ModelTable
  },
  methods: {
    emitChange(rows, rowDoc) {
      this.$emit('change', rows, rowDoc);
    }
  }
}
</script>
