<template>
  <div class="frappe-form-actions d-flex justify-content-between align-items-center p-3 border-bottom">
    <h5 class="m-0">{{ title }}</h5>
    <f-button primary :disabled="!isDirty" @click="$emit('save')">{{ _('Save') }}</f-button>
  </div>
</template>
<script>
import frappe from 'frappejs';

export default {
  props: ['doc'],
  data() {
    return {
      isDirty: false
    }
  },
  created() {
    this.doc.on('change', () => {
      this.isDirty = this.doc._dirty;
    });
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doc.doctype);
    },
    title() {
      const _ = this._;

      if (this.doc._notInserted) {
        return _('New {0}', _(this.doc.doctype));
      }

      const titleField = this.meta.titleField || 'name';
      return this.doc[titleField];
    }
  }
}
</script>
