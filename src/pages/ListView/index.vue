<template>
  <div class="bg-white row" style="height: 100%">
    <div class="border-right" :class="formOpen ? 'col-6' : 'col-12'">
      <page-header v-if="actions" :title="title" :actions="actions" />
      <div class="px-4">
        <!-- <list-toolbar :title="title" :filters="filters" @newClick="openNewForm" class="mb-2" /> -->
        <list :listConfig="listConfig" :filters="filters" />
      </div>
    </div>
    <router-view :key="$route.fullPath" class="col-6" v-if="formOpen"></router-view>
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
  props: ['listName', 'filters'],
  data() {
    return {
      actions: undefined
    };
  },
  components: {
    PageHeader,
    ListToolbar,
    List
  },
  created() {
    frappe.listView = new Observable();
  },
  computed: {
    formOpen() {
      return this.$route.name === 'FormView' || false;
    },
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
  },
  mounted() {
    this.actions = [
      {
        label: '+',
        clickHandler: this.openNewForm.bind(this)
      }
    ];
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
      const listName = this.listConfig.listName || doctype;
      // this.$router.push(`/list/${listName}/edit/${doctype}/${doc.name}`);
      this.$router.push(`/edit/${doctype}/${doc.name}`);
      doc.on('afterInsert', () => {
        // this.$router.push(`/list/${listName}/edit/${doctype}/${doc.name}`);
        this.$router.push(`/edit/${doctype}/${doc.name}`);
      });
    }
  }
};
</script>
