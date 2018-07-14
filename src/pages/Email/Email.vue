<template>
        <div class="frappe-list">
            <list-actions
              :doctype="doctype"
              :showDelete="checkList.length"
              @compose="newDoc"
              @delete="deleteCheckedItems"
              @sync="receiveEmails"
              @menu="showMenu"
            />
            <ul class="list-group">
                <list-item v-for="doc of data" :key="doc.name"
                    :id="doc.name"
                    :isActive="doc.name === $route.params.name"
                    :isChecked="isChecked(doc.name)"
                    @clickItem="openForm(doc.name)"
                    @checkItem="toggleCheck(doc.name)">
                    {{ doc[meta.titleField || 'name'] }}
                </list-item>
            </ul>
        </div>
</template>
<script>
import { _ } from 'frappejs/utils';
import List from 'frappejs/ui/components/List/List';
import frappe from 'frappejs';
import Form from 'frappejs/ui/components/Form/Form';
import ListActions from './EmailActions';
import EmailSend from './EmailSend';

export default {
  name: 'EmailList',
  extends: List,
  components: {
      ListActions
  },
  methods: {
    async newDoc() {
        let doc = await frappe.getNewDoc(this.doctype);
        let emailFields = frappe.getMeta('Email').fields;
        for(let i = 0; i < emailFields.length; i++){   
            emailFields[i].disabled = false;
        }
        this.$modal.show(EmailSend, {
            doctype: doc.doctype,
            name: doc.name, 
        });
        doc.on('afterInsert', (data) => {
            this.$modal.hide();
        });
    },
    async openForm(name) {
        this.activeItem = name;
        
        const data = await frappe.db.getAll({
            doctype: this.doctype,
            fields: ['*'],
            filters:{name: this.activeItem},
        });
        let emailFields = frappe.getMeta('Email').fields;
        for(let i = 0; i < emailFields.length; i++){   
            emailFields[i].disabled = true;
        }
        emailFields[5].hidden = false;
        this.$router.push(`/view/${this.doctype}/${name}`);
    },
    async receiveEmails(Id){
        await frappe.call({method: 'sync-mail',args:{Id}});
    },
    showMenu(){
        console.log("Menu is yet to be added!");
    }
  }
}
</script>