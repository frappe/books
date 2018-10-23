<template>
  <div v-if="doc">
    <h4 class="mb-3">{{ title }}</h4>
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
      title: '',
      fields: []
    }
  },
  async mounted() {
    this.doc = await frappe.getDoc(this.doctype);
    const meta = frappe.getMeta(this.doctype);
    this.fields = meta.fields;
    this.title = meta.label;
  },
  methods: {
    saveDoc() {
      this.doc.update();
      this.$toasted.show('Saved');
    }
  }
}
</script>
