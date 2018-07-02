<template>
  <div class="form-group" v-if="!onlyInput">
    <label>{{ docfield.label }}</label>
    <flat-pickr
      :value="value"
      class="form-control"
      @on-change="emitChange">
    </flat-pickr>
  </div>
  <flat-pickr
    v-else
    :value="value"
    class="form-control"
    @on-change="emitChange"
  >
  </flat-pickr>
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
@import "~flatpickr/dist/flatpickr.css";
</style>
