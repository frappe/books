<template>
  <keep-alive>
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
          @field-change="updateDoc"
        />
        <not-found v-if="notFound" />
    </div>
  </keep-alive>
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
      doc: null,
      notFound: false,
      invalid: false
    }
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    },
    shouldRenderForm() {
      return this.name && this.doc;
    }
  },
  async created() {
    if (!this.name) return;
    try {
      this.doc = await frappe.getDoc(this.doctype, this.name);
    } catch(e) {
      this.notFound = true;
    }
  },
  methods: {
    async save() {
      if (!this.checkValidity()) {
        this.invalid = true;
        return;
      }
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
        // frappe.ui.showAlert({ message: frappe._('Failed'), color: 'red' });
        return;
      }
    },

    updateDoc(fieldname, value) {
      this.$data[fieldname] = value;
      this.doc.set(fieldname, value);
    },

    checkValidity() {
      return true;
    },
  }
};
</script>
<style>
.frappe-form {
  height: calc(100vh - 50px);
}
</style>
