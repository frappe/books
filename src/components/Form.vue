<template>
    <div class="frappe-form">
        <form-actions
          v-if="shouldRenderForm"
          :doctype="doctype" :name="name"
          @save="save"
        />
        <form-layout
          v-if="shouldRenderForm"
          :doc="doc"
          :fields="meta.fields"
          :layout="meta.layout"
          :invalid="invalid"
        />
        <not-found v-if="notFound" />
    </div>
</template>
<script>
import frappe from 'frappejs';
import FormLayout from './FormLayout';
import FormActions from './FormActions';

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

        if (this.doc.name !== this.$route.params.name) {
          this.$router.push(`/edit/${this.doctype}/${this.doc.name}`);
          return;
        }
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
.frappe-form {
  height: calc(100vh - 50px);
}
</style>
