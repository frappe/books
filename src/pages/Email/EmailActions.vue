<template>
    <div class="frappe-list-actions d-flex  p-3 border-bottom">
        <div class="justify-content-between align-items-center">
            <h5 class="m-0">{{ doctype }} List</h5>
        </div>
        <div class="buttons">
            <button  v-if="showDelete" class="btn btn-danger btn-sm" @click="$emit('delete')">Delete</button>
            <button v-else class="btn btn-primary btn-sm" @click="$emit('compose')">Compose</button>
            <button class="btn btn-primary btn-sm" @click="$emit('sync')">Sync</button>
        </div>
    </div>
</template>
<script>
export default {
    props: ['doctype', 'showDelete']
}

</script>
<style lang="scss" scoped>
@import "~@/styles/variables";
.buttons{
    margin: 0%;
    padding-right: 1px;
    position: absolute;
    right: 2%;
}
</style>

