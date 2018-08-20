<template>
    <div class="frappe-list-actions d-flex  p-3 border-bottom">
        <div class="justify-content-between align-items-center">
            <h5 class="m-0">{{ doctype }} List</h5>
        </div>
        <div class="email-group">
            <!-- <span > Current Account </span> -->
            <select v-model="selected">
                <option v-for="option in options" v-bind:value="option.email" >
                   {{ option.email }}
                </option>
            </select>
            <!-- <button class="btn btn-primary btn-sm" @click="receiveEmails(selected)">Sync</button> -->
            <button  v-if="showDelete" class="btn btn-danger btn-sm" @click="$emit('delete')">Delete</button>
            <button v-else class="btn btn-primary btn-sm" @click="$emit('compose')">Compose</button>
        </div>
    </div>
</template>
<script>
import ListActions from 'frappejs/ui/components/List/ListActions';
export default {
    extends: ListActions,
    props:  ['doctype','tab'],
    data(){
        return {
            selected: '',
            options : []
        }
    },
    async created() {
    this.options = await frappe.db.getAll({
      doctype: 'EmailAccount',
      fields: ['email'],
      filters: {
        enableIncoming: 1
      }
    });
    this.selected = this.options[0].email;
  },
    watch:{
        selected : async function(){
            this.$emit('update',this.selected)
            console.log("Selected Watching : "+this.selected);
            this.receiveEmails(this.selected);
        },
        tab: async function(){
            console.log("Current tab :"+this.tab);
            this.$emit('update',this.selected)
            if(this.tab != "SENT"){
                this.receiveEmails(this.options[0].email);
            }
            else{
                // Redundant
                this.$emit('update',this.selected);
            }
        }
    },
    methods:{
        async receiveEmails(email=this.selected){ 
            var syncOption = this.tab;
            if(syncOption == null || syncOption == "SENT"){
                // TEMP HACK
                syncOption = "UNSEEN";
            }
            // Might raise errors in some case 
            await frappe.call({method: 'sync-mail',args:{email,syncOption}});
        },
    }
}
</script>
<style lang="scss" scoped>
@import '../../styles/variables';
.email-group{
    margin-right: 1%;
    position: absolute;
    right: 2%;
}
</style>

