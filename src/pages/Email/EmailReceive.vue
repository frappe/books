<template>
    <div class="frappe-form">
        <form-actions
          v-if="shouldRenderForm"
          :doc="doc"
          :doctype="doctype"
          :name="name"
          :title="formTitle"
          @reply="openReply"
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
import EmailSend from './EmailSend';

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
    async openReply() {
      //console.log("HEY open");
      let doc = await frappe.getNewDoc(this.doctype);
      let emailFields = frappe.getMeta('Email').fields;

      emailFields[5].hidden = true;
      doc['fromEmailAddress'] = this.selectedId;

      this.$modal.show({
        component: EmailSend,
        props: {
          doctype: doc.doctype,
          name: doc.name
        }
      });
      doc.on('afterInsert', data => {
        this.$modal.hide();
      });
    }
  }
};
</script>
<style>
</style>