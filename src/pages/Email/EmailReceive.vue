<template>
    <div class="frappe-form">
        <form-actions
          v-if="shouldRenderForm"
          :doc="doc"
          :doctype="doctype"
          :name="name"
          :title="formTitle"
        />
        <!-- Show From to subject etc -->
         <div v-if="doc.bodyHtml" v-html="doc.bodyHtml"></div>
         <div v-else>{{ doc.bodyText }}</div> <!-- needs to be fixed -->

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
      return this.doc.subject;
    }
  },
  methods: {
    // Validation
  }
};
</script>
<style>
</style>