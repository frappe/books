<template>
  <div class="flex flex-col">
    <PageHeader :title="title" />
    <div class="flex-1">
      <List :listConfig="listConfig" :filters="filters" />
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Observable from 'frappejs/utils/observable';
import PageHeader from '@/components/PageHeader';
import List from './List';
import listConfigs from './listConfig';

export default {
  name: 'ListView',
  props: ['listName', 'filters'],
  components: {
    PageHeader,
    List
  },
  created() {
    frappe.listView = new Observable();
  },
  methods: {
    async openNewForm() {
      const doctype = this.listConfig.doctype;
      const doc = await frappe.getNewDoc(doctype);
      if (this.listConfig.filters) {
        doc.set(this.listConfig.filters);
      }
      if (this.filters) {
        doc.set(this.filters);
      }
      this.$router.push(`/edit/${doctype}/${doc.name}`);
      doc.on('afterInsert', () => {
        this.$router.push(`/edit/${doctype}/${doc.name}`);
      });
    }
  },
  computed: {
    listConfig() {
      if (listConfigs[this.listName]) {
        return listConfigs[this.listName];
      } else {
        frappe.call({
          method: 'show-dialog',
          args: {
            title: 'Not Found',
            message: `${this.listName} List not Registered`
          }
        });
        this.$router.go(-1);
      }
    },
    title() {
      try {
        return this.listConfig.title(this.filters);
      } catch (e) {
        return this.listConfig.title;
      }
    }
  }
};
</script>
