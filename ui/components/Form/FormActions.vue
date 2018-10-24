<template>
  <div class="frappe-form-actions d-flex justify-content-between align-items-center">
    <h5 class="m-0">{{ title }}</h5>
    <div class="d-flex">
      <f-button primary v-if="showSave" :disabled="disableSave" @click="$emit('save')">{{ _('Save') }}</f-button>
      <f-button primary v-if="showSubmit" @click="$emit('submit')">{{ _('Submit') }}</f-button>
      <f-button secondary v-if="showRevert" @click="$emit('revert')">{{ _('Revert') }}</f-button>
      <div class="ml-2" v-if="showPrint">
        <f-button secondary v-if="showNextAction" @click="$emit('print')">{{ _('Print') }}</f-button>
      </div>
      <dropdown class="ml-2" v-if="showNextAction" :label="_('Actions')" :options="links"></dropdown>
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
      showSave: false,
      showSubmit: false,
      showRevert: false,
      showNextAction: false,
      showPrint: false,
      disableSave: false
    }
  },
  created() {
    this.doc.on('change', () => {
      this.updateShowSubmittable();
    });
    this.updateShowSubmittable();
  },
  methods: {
    updateShowSubmittable() {
      this.isDirty = this.doc._dirty;

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

      this.showNextAction = 1

      this.showNextAction =
        !this.doc._notInserted
        && this.links.length;

      this.showPrint =
        this.doc.submitted === 1
        && this.meta.print

      this.showSave =
        this.doc._notInserted ?
          true :
            this.meta.isSubmittable ?
              (this.isDirty ? true : false) :
              true;

      this.disableSave =
        this.doc._notInserted ? false : !this.isDirty;
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
