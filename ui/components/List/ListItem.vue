<template>
    <div :class="classList" @click.self="$emit('clickItem')">
        <div class="custom-control custom-checkbox d-flex">
            <input type="checkbox" class="custom-control-input" :id="id"
                :value="isChecked" @change="$emit('checkItem', isChecked)"
            >
            <label class="custom-control-label" :for="id"></label>
        </div>
        <div @click="$emit('clickItem')">
          <slot></slot>
        </div>
    </div>
</template>
<script>
export default {
    props: ['id', 'isActive', 'isChecked'],
    computed: {
        classList() {
            return ['list-group-item d-flex align-items-center', this.isActive ? 'bg-light' : ''];
        }
    }
}
</script>
