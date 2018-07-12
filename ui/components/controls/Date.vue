<template>
  <div :class="{'form-group': !onlyInput}">
    <label v-if="!onlyInput">{{ docfield.label }}</label>
    <flat-pickr
      :value="value"
      class="form-control"
      @on-change="emitChange">
    </flat-pickr>
  </div>
</template>
<script>
import flatPickr from 'vue-flatpickr-component';
import Data from './Data';

export default {
  extends: Data,
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
@import "flatpickr/dist/flatpickr.css";
</style>
