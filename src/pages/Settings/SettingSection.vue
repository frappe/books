<template>
  <div v-if="doc">
    <h4 class="mb-3">{{ doctype }}</h4>
    <form-layout
      :doc="doc"
      :fields="fields"
      @updateDoc="saveDoc"
    />
  </div>
</template>
<script>
import FormLayout from 'frappejs/ui/components/Form/FormLayout';

export default {
  name: 'SettingSection',
  props: ['doctype'],
  components: {
    FormLayout
  },
  data() {
    return {
      doc: null,
      fields: []
    }
  },
  async mounted() {
    this.doc = await frappe.getDoc(this.doctype);
    this.fields = frappe.getMeta(this.doctype).fields;
  },
  methods: {
    saveDoc() {
      this.doc.update();
      this.$toasted.show('Saved');
    }
  }
}
</script>
