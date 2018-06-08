<template>
    <div class="frappe-form-actions d-flex justify-content-between align-items-center p-3 border-bottom">
        <h5 class="m-0">{{ title || name }}</h5>
        <button class="btn btn-primary btn-sm" @click="$emit('save')">Save</button>
    </div>
</template>
<script>
export default {
    props: ['doctype', 'name', 'title']
}
</script>
