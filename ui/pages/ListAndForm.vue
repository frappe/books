<template>
    <div class="frappe-list-form row no-gutters">
        <div class="col-4 border-right">
            <frappe-list :doctype="doctype" :filters="filters" :key="doctype" />
        </div>
        <div class="col-8">
            <frappe-form v-if="name" :key="doctype + name" :doctype="doctype" :name="name" @save="onSave" />
        </div>
    </div>
</template>
<script>
import List from '../components/List/List';
import Form from '../components/Form/Form';

export default {
    props: ['doctype', 'name', 'filters'],
    components: {
        FrappeList: List,
        FrappeForm: Form
    },
    methods: {
        onSave(doc) {
             if (doc.name !== this.$route.params.name) {
                this.$router.push(`/edit/${doc.doctype}/${doc.name}`);
            }
        }
    }
}
</script>
<style>
.frappe-list-form {
    min-height: calc(100vh - 4rem);
}
</style>
