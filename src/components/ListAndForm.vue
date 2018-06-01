<template>
    <div class="frappe-list-form row no-gutters">
        <div class="col-4 border-right">
            <frappe-list :doctype="doctype" />
        </div>
        <div class="col-8">
            <frappe-form v-if="name" :doctype="doctype" :name="name" />
        </div>
    </div>
</template>
<script>
import List from './List';
import Form from './Form';

export default {
    data() {
        return {
            doctype: this.$route.params.doctype,
            name: this.$route.params.name
        }
    },
    components: {
        FrappeList: List,
        FrappeForm: Form
    }
}
</script>
<style>
.frappe-list-form {
    min-height: calc(100vh - 57px);
}
</style>
