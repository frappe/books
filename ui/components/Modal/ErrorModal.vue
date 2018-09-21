<template>
<div class="modal-body">
    <p v-if="message">{{message}}</p>
    <div v-if="stackTrace"><hr>
        <textarea v-model="stackTrace" disabled></textarea>
    </div>
</div>
</template>
<script>
export default {
    props: ["message", "stackTrace"]
}
</script>
<style scoped>
    textarea {
        width: 100%;
        height: 40vh;
        padding: 1%
    }
</style>
