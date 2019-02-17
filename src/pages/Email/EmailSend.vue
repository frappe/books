<template>
  <div class="frappe-form">
    <form-actions v-if="shouldRenderForm" :doc="doc" @send="send"/>
    <div class="p-3">
      <form-layout
        v-if="shouldRenderForm"
        :doc="doc"
        :fields="meta.fields"
        :layout="meta.layout"
        :invalid="invalid"
      />
    </div>
    <not-found v-if="notFound"/>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Form from 'frappejs/ui/components/Form/Form';
import FormActions from './EmailSendActions';

export default {
  name: 'Form',
  extends: Form,
  components: {
    FormActions
  },
  methods: {
    async send() {
      this.doc = await frappe.getDoc(this.doctype, this.name);
      var response = await frappe.call({
        method: 'send-mail',
        args: this.doc.getValidDict()
      });
      if (response) {
        let emailFields = frappe.getMeta('Email').fields;
        // this.doc['name'] = this.name;
        this.save();
      } else {
        // Raise Error
        console.log('Email Not Found');
      }
    }
  }
};
</script>
<style>
</style>