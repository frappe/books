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
         <div v-else>{{ doc.bodyText }}</div> <!-- needs to be fixed shows '0' ^ -->

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
  async created() {
    this.doc = await frappe.getDoc(this.doctype, this.name);
    this.doc.read = 'Seen';
    this.doc.update();
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
      let doc = await frappe.getNewDoc(this.doctype);
      let emailFields = frappe.getMeta('Email').fields;

      emailFields[5].hidden = true;
      doc['fromEmailAddress'] = this.doc['toEmailAddress'];
      doc['toEmailAddress'] = this.doc['fromEmailAddress'];
      doc['subject'] = 'Re: ' + this.doc['subject'];
      doc['replyId'] = this.doc['name'];
      emailFields[6].disabled = true;

      // FROM EMAIL : Same
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