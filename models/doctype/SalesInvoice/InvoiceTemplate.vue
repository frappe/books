<template>
  <component :is="printComponent" :doc="doc" :print-settings="printSettings" />
</template>

<script>
import Default from './Templates/Default';
import Minimal from './Templates/Minimal';
import Business from './Templates/Business';

export default {
  name: 'InvoiceTemplate',
  props: ['doc', 'printSettings'],
  computed: {
    printComponent() {
      let type = this.printSettings.template || 'Default';
      return {
        Default,
        Minimal,
        Business
      }[type];
    }
  }
};
</script>
