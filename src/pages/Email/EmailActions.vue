<template>
    <div class="frappe-list-actions d-flex  p-3 border-bottom">
        <div class="justify-content-between align-items-center">
            <h5 class="m-0">{{ doctype }} List</h5>
        </div>
        <div class="email-group">
            <span > Current Account </span>
            <select v-model="selected">
                <option v-for="option in options" v-bind:value="option.email" >
                   {{ option.email }}
                </option>
            </select>
            <button class="btn btn-primary btn-sm" @click="$emit('sync',selected)">Sync</button>
            <button  v-if="showDelete" class="btn btn-danger btn-sm" @click="$emit('delete')">Delete</button>
            <button v-else class="btn btn-primary btn-sm" @click="$emit('compose')">Compose</button>
            <button  class="btn btn-primary btn-sm" @click="$emit('menu')">Menu</button>
        </div>
    </div>
</template>
<script>
import ListActions from 'frappejs/ui/components/List/ListActions';
export default {
    extends: ListActions,
    data(){
        return {
            selected: '',
            options : []
        }
    },
    async created(){
        this.options = await frappe.db.getAll({
            doctype: "EmailAccount",
            fields: ['email','enableIncoming'],
        });
        for(let i = 0; i < this.options.length; i++){   
            if(this.options[i].enableIncoming){
                this.selected = this.options[i].email ;
                break;
            }
         }
    },
    methods:{}
}
</script>
<style lang="scss" scoped>
@import "~@/styles/variables";
.email-group{
    margin-right: 1%;
    position: absolute;
    right: 2%;
}
</style>

