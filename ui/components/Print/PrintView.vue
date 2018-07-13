<template>
  <div class="print-view">
    <print-actions
      v-bind:title="name"
    ></print-actions>
    <div class="print-container">
      <div class="print-template" v-html="printTemplate"></div>
    </div>
  </div>
</template>

<script>
import { getHTML } from '../../../common/print.js';
import PrintActions from './PrintActions';

export default {
  name: 'PrintView',
  props: ['doctype', 'name'],
  data() {
    return {
      printTemplate: '',
    }
  },
  components: {
    PrintActions: PrintActions
  },
  async created(vm) {
    this.printTemplate = await getHTML(this.doctype, this.name);
  },
}
</script>

<style lang="scss">
@import "../../styles/variables";

.print-container {
  padding: 1rem;
}

.print-template {
  padding: 1rem;
  background-color: $white;
  box-shadow: 0rem 0rem 0.5rem rgba(0,0,0,0.2);
}

.print-view {}

</style>
