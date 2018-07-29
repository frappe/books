<template>
        <div class="frappe-list">
            <list-actions
              :doctype="doctype"
              :name="name"
              :showDelete="checkList.length"
              @compose="newDoc"
              @delete="deleteCheckedItems"
              @sync="receiveEmails"
            />
            <ul class="row">
                <br>
                <div class="from-title"> From </div>
                    <div class="to-title">To</div>
                    <div class="subject-title">Subject</div>
                    <div class="date-title">Date</div>
            </ul>
            <ul class="list-group">
                <list-item v-for="doc of data" :key="doc.name"
                    :id="doc.name"
                    :isActive="doc.name === $route.params.name"
                    :isChecked="isChecked(doc.name)"
                    @clickItem="openForm(doc.name)"
                    @checkItem="toggleCheck(doc.name)">
                    <div class="from-item"> {{ doc['toEmailAddress'] }} </div>
                    <div class="to-item"> {{ doc['fromEmailAddress'] }} </div>
                    <div class="subject-item"> {{ doc['subject'] }} </div>
                    <div class="date-item"> {{ doc['date'] }} </div>
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
      this.$root.$emit('emailConfigView');
      const data = await frappe.db.getAll({
            doctype: this.doctype,
            fields: ['*'],
        });
        this.data = data;
   },
   watch: {
    name : async function(){
        console.log("Emails Loaded From Default ");
        this.$root.$emit('emailConfigView');
        this.options = await frappe.db.getAll({
            doctype: "EmailAccount",
            fields: ['email','enableIncoming'],
        });
        var Id , syncOption;
        for(let i = 0; i < this.options.length; i++){   
            if(this.options[i].enableIncoming){
                Id = this.options[i].email;
                syncOption = this.name;
                break;
            }
         }
         this.receiveEmails(Id,syncOption);
    }
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
    async receiveEmails(Id,syncOption=null){ 
        console.log("If you've clicked sync maybe this has raised some errors");
        if(syncOption==null){
            syncOption = "UNSEEN";  // FIX THIS
        }
        await frappe.call({method: 'sync-mail',args:{Id,syncOption}});
    },
  }
}
</script>
<style>

.from-item{
    position: absolute;
    left:4%;
}
.to-item{
    position: absolute;
    left:25%;
}
.subject-item{
    position: absolute;
    left:45%;
}
.date-item{
    position: absolute;
    right:2%;
}
.from-title{
    position: absolute;
    left:10%;
}
.to-title{
    position: absolute;
    left:30%;
}
.subject-title{
    position: absolute;
    left:50%;
}
.date-title{
    position: absolute;
    right:4%;
}

</style>