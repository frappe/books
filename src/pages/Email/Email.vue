<template>
        <div class="frappe-list">
            <list-actions
              :doctype="doctype"
              :name="name"
              :showDelete="checkList.length"
              @compose="newDoc"
              @delete="deleteCheckedItems"
            />
            <br>
            <ul class="row title">
                <div > From </div>
                <div > To</div>
                <div > Subject</div>
                <div > Date</div>
            </ul>
            <ul class="list-group">
                <list-item v-for="doc of data" :key="doc.name"
                    :id="doc.name"
                    :isActive="doc.name === $route.params.name"
                    :isChecked="isChecked(doc.name)"
                    @clickItem="openForm(doc.name)"
                    @checkItem="toggleCheck(doc.name)">
                    {{ doc[meta.titleField || 'name'] }}
                    <!-- {{ doc['toEmailAddress'] }}
                    {{ doc['fromEmailAddress'] }} 
                    {{ doc['subject'] }}
                    {{ doc['date'] }} -->
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
  props: ['doctype', 'name'],
  components: {
      ListActions
  },
   data(){
     return {
        data:[]
     }  
   },
    async created(){
        console.log("This has to be fixed to filter specific emails");
        this.$root.$emit('emailConfigView');
        const data = await frappe.db.getAll({
            doctype: this.doctype,
            fields: ['*'],
        });
        this.data = data;
   },
    methods: {
    async newDoc() {
        let doc = await frappe.getNewDoc(this.doctype);
        let emailFields = frappe.getMeta('Email').fields;
        for(let i = 0; i < emailFields.length; i++){   
            emailFields[i].disabled = false;
        }
        this.$modal.show({
            component: EmailSend,
            props: {
              doctype: doc.doctype,
              name: doc.name,
            }
          });
        console.log("Err Fix : dump db");
        // unable to dump on DB [ check delete + hit refresh / sync ]
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
        emailFields[5].hidden = false;
        for(let i = 0; i < emailFields.length; i++){   
            emailFields[i].disabled = true;
        }
        // EMAIL DATE DISABLED DOESN't Work
        emailFields[1].hidden = true;
        emailFields[3].hidden = true;
        emailFields[4].hidden = true;
        this.$router.push(`/view/${this.doctype}/${name}`);
    }
  }
}
</script>
<style>
.title div{
    margin-left: 10%;
    margin-right: 10%;
    display: flex;
    flex-direction: row;
}
</style>