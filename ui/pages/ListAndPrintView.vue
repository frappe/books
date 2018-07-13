<template>
    <div class="frappe-list-form row no-gutters">
        <div class="col-4 border-right">
            <frappe-list :doctype="doctype" :filters="filters" :key="doctype" />
        </div>
        <div class="col-8">
            <print-view v-if="name" :key="doctype + name" :doctype="doctype" :name="name" @save="onSave" />
        </div>
    </div>
</template>
<script>
import List from '../components/List/List';
import PrintView from '../components/PrintView';

export default {
    props: ['doctype', 'name', 'filters'],
    components: {
        FrappeList: List,
        PrintView: PrintView,
    },
}
</script>
<style>
.frappe-list-form {
    min-height: calc(100vh - 4rem);
}
</style>
