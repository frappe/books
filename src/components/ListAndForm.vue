<template>
    <div class="frappe-list-form row no-gutters">
        <div class="col-4 border-right">
            <frappe-list :doctype="doctype" :key="doctype" />
        </div>
        <div class="col-8">
            <frappe-form v-if="name" :key="doctype + name" :doctype="doctype" :name="name" />
        </div>
    </div>
</template>
<script>
import List from './List';
import Form from './Form';

export default {
    components: {
        FrappeList: List,
        FrappeForm: Form
    },
    computed: {
        doctype() {
            return this.$route.params.doctype;
        },
        name() {
            return this.$route.params.name;
        }
    }
}
</script>
<style>
.frappe-list-form {
    min-height: calc(100vh - 4rem);
}
</style>
