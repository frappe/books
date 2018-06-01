<template>
    <div class="frappe-list-actions d-flex justify-content-between align-items-center p-3 border-bottom">
        <h5 class="m-0">{{ doctype }} List</h5>
        <button class="btn btn-primary btn-sm" @click="$emit('new')">New</button>
    </div>
</template>
<script>
export default {
    props: ['doctype']
}
</script>
