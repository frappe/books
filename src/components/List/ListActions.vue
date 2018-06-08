<template>
    <div class="frappe-list-actions d-flex justify-content-between align-items-center p-3 border-bottom">
        <h5 class="m-0">{{ doctype }} List</h5>
        <button v-if="showDelete" class="btn btn-danger btn-sm" @click="$emit('delete')">Delete</button>
        <button v-else class="btn btn-primary btn-sm" @click="$emit('new')">New</button>
    </div>
</template>
<script>
export default {
    props: ['doctype', 'showDelete']
}
</script>
