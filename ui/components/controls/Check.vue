<template>
    <div class="form-group">
        <div class="custom-control custom-checkbox">
            <input class="custom-control-input" type="checkbox"
              :id="id"
              v-model="checkboxValue"
              @change="emitChange"
              :disabled="disabled"
            >
            <label class="custom-control-label" :for="id">{{ docfield.label }}</label>
        </div>
    </div>
</template>

<script>
import Base from './Base';
export default {
    extends: Base,
    data() {
        return {
            checkboxValue: Boolean(this.value)
        }
    },
    methods: {
        emitChange(e) {
            this.$emit('change', Number(this.checkboxValue));
        }
    }
}
</script>
