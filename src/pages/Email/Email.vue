<template>
        <div class="frappe-list">
            <list-actions
              :doctype="doctype"
              :showDelete="checkList.length"
              @compose="newDoc"
              @delete="deleteCheckedItems"
              @sync="receiveEmails"
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
import Form from 'frappejs/ui/components/Form/Form';
import List from 'frappejs/ui/components/List/List';
import frappe from 'frappejs';
import ListActions from './EmailActions';
//import ListItem from './EmailItem';

export default {
  name: 'List',
  extends: List,
  props: ['doctype', 'filters'],
  components: {
      ListActions,
  },
  methods: {
    async newDoc() {
        let doc = await frappe.getNewDoc(this.doctype);
        this.$modal.show({
                        title: _('New {0}', _(this.doctype)),
                        bodyComponent: Form,
                        bodyProps: {
                            doctype: this.doctype,
                            name: doc.name,
                        },
                    });
        doc.on('afterInsert', (data) => {
                        //this.handleChange(doc.name);
                        this.$modal.hide();
                    });
    },
    async openForm(name) {
        console.log("VIEW",name);
        this.activeItem = name;
        
        const data = await frappe.db.getAll({
            doctype: this.doctype,
            fields: ['*'],
            filters:{name: this.activeItem},
        });
        this.$router.push(`/view/${this.doctype}/${name}`);
        // :ADD BACK BUTTON 
    },
    receiveEmails(){
        frappe.call({method: 'sync-mail',});
    }
  }
}
</script>