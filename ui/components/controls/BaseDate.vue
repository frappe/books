<template>
  <div :class="{'form-group': !onlyInput}">
    <label v-if="!onlyInput">{{ docfield.label }}</label>
    <flat-pickr
      class="form-control"
      :class="getFormControlSize()"
      :placeholder="docfield.placeholder"
      :value="value"
      :config="config"
      @on-change="emitChange"
    ></flat-pickr>
  </div>
</template>
<script>
import flatPickr from 'vue-flatpickr-component';
import Data from './Data';

export default {
  extends: Data,
  props: ['config'],
  components: {
    flatPickr
  },
  methods: {
    emitChange(dates, dateString) {
      this.$emit('change', dateString);
    }
  }
};
</script>
<style lang="scss">
@import '~flatpickr/dist/flatpickr.css';
.flat-pickr-input {
  background-color: #fff;
}
</style>
