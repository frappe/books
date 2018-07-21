<template>
    <div class="frappe-form">
        <form-actions
          v-if="shouldRenderForm"
          :doctype="doctype"
          :name="name"
          :title="formTitle"
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
import { _ } from 'frappejs/utils';
import frappe from 'frappejs';
import Form from 'frappejs/ui/components/Form/Form';
import FormActions from './EmailReceiveActions';

export default {
  name: 'EmailReceiveForm',
  extends: Form,
  components: {
    FormActions
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    },
    shouldRenderForm() {
      return this.name && this.docLoaded;
    },
    formTitle() {
      return this.doc[this.meta.titleField];
    }
  },
  methods: {
    // Validation
  }
};
</script>
<style>
</style>