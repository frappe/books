<template>
  <div class="bg-white">
    <page-header :title="listConfig.title" />
    <div class="px-4 py-3">
      <list-toolbar
        :listConfig="listConfig"
        @newClick="openNewForm"
        @filterList="keyword => filterList(keyword)"
        class="mb-4"
      />
      <list :listConfig="listConfig" />
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Observable from 'frappejs/utils/observable';
import PageHeader from '@/components/PageHeader';
import ListToolbar from './ListToolbar';
import List from './List';
import listConfigs from './listConfig';

export default {
  name: 'ListView',
  props: ['listName'],
  components: {
    PageHeader,
    ListToolbar,
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
    }
  }
};
</script>
