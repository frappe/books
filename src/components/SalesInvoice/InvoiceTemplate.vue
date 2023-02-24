<template>
  <component :is="printComponent" :doc="doc" :print-settings="printSettings" />
</template>

<script>
import Basic from './Templates/Basic';
import Business from './Templates/Business';

export default {
  name: 'InvoiceTemplate',
  props: ['doc', 'printSettings'],
  computed: {
    printComponent() {
      let type = this.printSettings.template;
      let templates = {
        Basic,
        Business,
      };
      if (!(type in templates)) {
        type = 'Basic';
      }
      return templates[type];
    },
  },
};
</script>
