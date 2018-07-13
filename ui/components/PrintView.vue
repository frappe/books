<template>
  <div v-html="printTemplate"></div>
</template>

<script>
import { getHTML } from '../../common/print.js';

export default {
  name: 'PrintView',
  props: ['doctype', 'name'],
  data() {
    return {
      printTemplate: ''
    }
  },
  async created(vm) {
    this.printTemplate = await getHTML(this.doctype, this.name);
  },
}
</script>
