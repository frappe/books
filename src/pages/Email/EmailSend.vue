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
  computed:{
    
  },
  async created() {
    if (!this.name) return;
    try {
        this.doc = await frappe.getDoc(this.doctype, this.name);
        let emailFields = frappe.getMeta('Email').fields;
        emailFields[5].hidden = true;   
        emailFields[1].hidden = false;
        emailFields[3].hidden = false;
        emailFields[4].hidden = false;
        /*
        console.log("Email Accounts Loaded for sending and set to : Default ");
        let options = await frappe.db.getAll({
            doctype: "EmailAccount",
            fields: ['email','enableOutgoing'],
        });  
        for(let i = 0; i < options.length; i++){   
            if(options[i].enableOutgoing){
              console.log(options[i]);
              if(emailFields[1].options.indexOf(options[i].email) < 0)
                emailFields[1].options.push(options[i].email);
            }
         }
         await this.doc.set("fromEmailAddress", emailFields[1].options);
         */
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
            console.log(this.doc.getValidDict());
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