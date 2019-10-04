<template>
  <div class="border-l h-full">
    <div class="flex justify-end px-4 pt-4">
      <Button>
        <XIcon class="w-3 h-3 stroke-current text-gray-700" />
      </Button>
    </div>
    <div class="px-4 pt-2 pb-4 border-b">
      <h2 class="font-medium">{{ title }}</h2>
    </div>
    <div class="text-xs">
      <div
        class="grid border-b px-4 py-3"
        style="grid-template-columns: 1fr 2fr"
        v-for="df in fields"
        :key="df.fieldname"
      >
        <div class="text-gray-600">{{ df.label }}</div>
        <div class="text-gray-900">{{ doc[df.fieldname] }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import Button from '@/components/Button';
import XIcon from '@/components/Icons/X';

export default {
  name: 'QuickEditForm',
  props: ['doctype', 'name'],
  components: {
    Button,
    XIcon
  },
  data() {
    return {
      title: '',
      doc: {},
      fields: []
    };
  },
  async mounted() {
    let meta = frappe.getMeta(this.doctype);
    this.doc = await frappe.getDoc(this.doctype, this.name);
    this.title = this.doc[meta.titleField];
    this.fields = meta
      .getQuickEditFields()
      .map(fieldname => meta.getField(fieldname));
  }
};
</script>
