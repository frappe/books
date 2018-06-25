<template>
    <div class="frappe-form">
        <form-actions
          v-if="shouldRenderForm"
          :doctype="doctype"
          :name="name"
          :title="formTitle"
          @save="save"
        />
        <div class="p-3">
          <form-layout
            v-if="shouldRenderForm"
            :doc="doc"
            :fields="meta.fields"
            :layout="meta.layout"
            :invalid="invalid"
          />
        </div>
        <not-found v-if="notFound" />
    </div>
</template>
<script>
import frappe from 'frappejs';
import FormLayout from './FormLayout';
import FormActions from './FormActions';
import { _ } from 'frappejs/utils';

export default {
  name: 'Form',
  props: ['doctype', 'name'],
  components: {
    FormActions,
    FormLayout
  },
  data() {
    return {
      docLoaded: false,
      notFound: false,
      invalid: false,
      invalidFields: []
    }
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    },
    shouldRenderForm() {
      return this.name && this.docLoaded;
    },
    formTitle() {
      if (this.doc._notInserted) {
        return _('New {0}', _(this.doctype));
      }
      return this.doc[this.meta.titleField];
    }
  },
  async created() {
    if (!this.name) return;
    try {
      this.doc = await frappe.getDoc(this.doctype, this.name);
      this.docLoaded = true;
    } catch(e) {
      this.notFound = true;
    }
  },
  methods: {
    async save() {
      this.setValidity();
      if (this.invalid) return;

      try {
        if (this.doc._notInserted) {
          await this.doc.insert();
        } else {
          await this.doc.update();
        }

        this.$emit('save', this.doc);

      } catch (e) {
        console.error(e);
        return;
      }
    },

    onValidate(fieldname, isValid) {
      if (!isValid && !this.invalidFields.includes(fieldname)) {
        this.invalidFields.push(fieldname);
      } else if (isValid) {
        this.invalidFields = this.invalidFields.filter(invalidField => invalidField !== fieldname)
      }
    },

    setValidity() {
      const form = this.$el.querySelector('form');
      let validity = form.checkValidity();
      this.invalid = !validity;
    },
  }
};
</script>
<style>
</style>
