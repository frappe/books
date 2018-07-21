<template>
    <div class="frappe-list-form row no-gutters">
        <div class="col-4 border-right">
            <frappe-list :doctype="doctype" :key="doctype" />
        </div>
        <div class="col-8">
            <frappe-form v-if="name" :key="doctype + name" :doctype="doctype" :name="name" @save="onSave" />
        </div>
    </div>
</template>
<script>
import ListAndForm from 'frappejs/ui/pages/ListAndForm';

export default {
    name: 'EmailAccount',
    extends:ListAndForm,
    methods: {
    }
}
</script>
