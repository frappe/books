<template>
    <div class="frappe-list-form row no-gutters">
        <div class="col-4 border-right">
            <frappe-list :doctype="doctype" :filters="filters" :key="doctype" />
        </div>
        <div class="col-8 background-gray">
            <print-view v-if="name" :key="doctype + name" :doctype="doctype" :name="name" />
        </div>
    </div>
</template>
<script>
import List from '../components/List/List';
import PrintView from '../components/Print/PrintView';

export default {
    props: ['doctype', 'name', 'filters'],
    components: {
        FrappeList: List,
        PrintView: PrintView,
    },
}
</script>
<style lang="scss">
.frappe-list-form {
    min-height: calc(100vh - 4rem);
}
@import "../styles/variables";
.background-gray {
    background-color: $gray-100
}
</style>
