<template>
  <div class="frappe-form-actions d-flex justify-content-between align-items-center p-3 border-bottom">
    <!--<h5 class="m-0">{{ title }}</h5>-->
    <h5 class="m-0"></h5>
    <f-button primary v-if="isDirty" @click="$emit('send')">Send</f-button>
  </div>
</template>
<script>
import frappe from 'frappejs';
export default {
    props: ['doc'],
    data() {
    return {
      isDirty: false
    }
  },
  created() {
    this.doc.on('change', () => {
      this.isDirty = this.doc._dirty;
    });
  }
}
</script>