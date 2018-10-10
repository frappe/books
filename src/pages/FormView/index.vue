<template>
  <div class="bg-light">
    <page-header :title="name" />
    <div class="form-container col-8 bg-white mt-4 ml-auto mr-auto border px-4 py-3">
      <form-layout
        class="p-3"
        v-if="shouldRenderForm"
        :doc="doc"
        :fields="meta.fields"
        :layout="meta.layout"
        :invalid="invalid"
      />
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import FormLayout from 'frappejs/ui/components/Form/FormLayout';
import PageHeader from '@/components/PageHeader';

export default {
  name: 'FormView',
  props: ['doctype', 'name'],
  components: {
    PageHeader,
    FormLayout
  },
  data() {
    return {
      doc: null
    }
  },
  computed: {
    shouldRenderForm() {
      return this.name && this.doc;
    },
    meta() {
      return frappe.getMeta(this.doctype);
    }
  },
  async mounted() {
    this.doc = await frappe.getDoc(this.doctype, this.name);
  }
}
</script>
<style>
.form-container {

}
</style>
