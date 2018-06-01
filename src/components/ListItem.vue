<template>
    <div :class="['list-group-item d-flex align-items-center', isActive ? 'active' : '']">
        <div class="custom-control custom-checkbox d-flex">
            <input type="checkbox" class="custom-control-input" :id="id">
            <label class="custom-control-label" :for="id"></label>
        </div>
        <slot></slot>
    </div>
</template>
<script>
export default {
    props: ['id', 'isActive']
}
</script>
