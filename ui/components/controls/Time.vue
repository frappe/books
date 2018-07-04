<template>
  <div class="form-group" v-if="!onlyInput">
    <label>{{ docfield.label }}</label>
    <flat-pickr
      :value="value"
      :config="config"
      class="form-control"
      @on-change="emitChange"
    >
    </flat-pickr>
  </div>
  <flat-pickr
    v-else
    :value="value"
    :config="config"
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
  data(){
    return{
      config:{
        enableTime: true,
        noCalendar: true
      }
    }
  },
  components: {
    flatPickr
  },
  methods: {
    emitChange(times, timeString) {
      this.$emit('change', timeString);
    }
  }
};
</script>
<style lang="scss">
@import "flatpickr/dist/flatpickr.css";
</style>