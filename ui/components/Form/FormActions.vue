<template>
  <div class="frappe-form-actions d-flex justify-content-between align-items-center p-3 border-bottom">
    <h5 class="m-0">{{ title }}</h5>
    <div class="d-flex">
      <f-button primary v-if="isDirty" @click="$emit('save')">{{ _('Save') }}</f-button>
      <f-button primary v-if="showSubmit" @click="$emit('submit')">{{ _('Submit') }}</f-button>
      <f-button secondary v-if="showRevert" @click="$emit('revert')">{{ _('Revert') }}</f-button>
      <dropdown class="ml-2" v-if="links.length" :label="'Next Action'" :options="links"></dropdown>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Dropdown from '../Dropdown';

export default {
  props: ['doc', 'links'],
  components: {
    Dropdown
  },
  data() {
    return {
      isDirty: false,
      showSubmit: false,
      showRevert: false
    }
  },
  created() {
    this.doc.on('change', () => {
      this.isDirty = this.doc._dirty;
      this.updateShowSubmittable();
    });
    this.updateShowSubmittable();
  },
  methods: {
    updateShowSubmittable() {
      this.showSubmit =
        this.meta.isSubmittable
        && !this.isDirty
        && !this.doc._notInserted
        && this.doc.submitted === 0;

      this.showRevert =
        this.meta.isSubmittable
        && !this.isDirty
        && !this.doc._notInserted
        && this.doc.submitted === 1;
    }
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
