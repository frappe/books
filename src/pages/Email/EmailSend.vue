<template>
    <div class="frappe-form">
        <form-actions
          v-if="shouldRenderForm"
          :doc="doc"
          @send="send"
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
import Form from 'frappejs/ui/components/Form/Form';
import FormActions from './EmailSendActions';
export default {
  name: 'Form',
  extends:Form,
  components: {
    FormActions
  },
  async created() {
    if (!this.name) return;
    try {
        this.doc = await frappe.getDoc(this.doctype, this.name);
        let emailFields = frappe.getMeta('Email').fields;
        emailFields[5].hidden = true;
        if (this.doc._notInserted && this.meta.fields.map(df => df.fieldname).includes('name')) {
            this.doc.set('name', '');
        }
        if (this.defaultValues) {
            for (let fieldname in this.defaultValues) {
            const value = this.defaultValues[fieldname];
            this.doc.set(fieldname, value);
            }
        }
        this.docLoaded = true;
    } catch(e) {
        this.notFound = true;
    }
  },
  methods: {
     async send(){
            this.doc = await frappe.getDoc(this.doctype, this.name)
            this.doc.name = "Sent: " +this.doc["fromEmailAddress"] + " "+ this.doc["subject"].slice(0,10);
            var response = await frappe.call({method: 'send-mail',args: this.doc.getValidDict()});
            console.log(response);
            if(response){
              let emailFields = frappe.getMeta('Email').fields;
              emailFields[5].hidden = true;
              this.save();
            }else{
              // Raise Error ;
              console.log("Email Not Found");
            }
      }
  }
};
</script>
<style>
</style>