<template>
        <div class="frappe-list">
            <list-actions
              :doctype="doctype"
              :name="name"
              :showDelete="checkList.length"
              @compose="newDoc"
              @delete="deleteCheckedItems"
              @update="emailList"
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
                    <!-- <div class="from-item">{{ doc['fromEmailAddress'] }} </div>
                    <div class="to-item">{{ doc['toEmailAddress'] }}</div>
                    <div class="subject-item">{{ doc['subject'] }}</div>
                    <div class="date-item">{{ doc['date'] }}</div> -->
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
        data:[],
     }  
   },
    async created(){
        console.log("This has to be fixed to filter specific emails");
        this.$root.$emit('emailConfigView');
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
    },
    async emailList(selectedId){
        const data = await frappe.db.getAll({
            doctype: this.doctype,
            fields: ['*'],
            filters:{toEmailAddress:selectedId},
        });
        console.log("Switched To : "+selectedId);
        this.data = data;
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