<template>
  <div class="bg-light">
    <page-header :title="meta.label || meta.name" />
    <div class="px-4 py-3">
      <list-toolbar
        :doctype="doctype"
        @newClick="openNewForm"
        class="mb-4"
      />
      <list
        :doctype="doctype"
      />
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import PageHeader from '@/components/PageHeader';
import ListToolbar from './ListToolbar';
import List from './List';

export default {
  name: 'ListView',
  props: ['doctype'],
  components: {
    PageHeader,
    ListToolbar,
    List
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    }
  },
  methods: {
    async openNewForm() {
      const doc = await frappe.getNewDoc(this.doctype);
      this.$router.push(`/edit/${this.doctype}/${doc.name}`);
    }
  }
}
</script>
