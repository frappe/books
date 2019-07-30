<template>
  <div class="p-3 d-flex align-items-center">
    <indicator :color="indicatorColor" class="mr-2 ml-1" />
    {{ message }}
  </div>
</template>

<script>
import indicators from 'frappejs/ui/constants/indicators';
export default {
  name: 'MessageDialog',
  data() {
    return {
      indicatorColor: indicators.ORANGE
    };
  },
  props: {
    message: {
      type: String
    }
  }
};
</script>
