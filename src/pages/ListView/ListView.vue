<template>
  <div class="flex">
    <div class="flex flex-col flex-1">
      <PageHeader>
        <h1 slot="title" class="text-xl font-bold" v-if="title">{{ title }}</h1>
        <template slot="actions">
          <Button type="primary" @click="makeNewDoc">
            <Add class="w-3 h-3 stroke-current text-white" />
          </Button>
          <SearchBar class="ml-2" />
        </template>
      </PageHeader>
      <div class="flex-1">
        <List :listConfig="listConfig" :filters="filters" />
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Observable from 'frappejs/utils/observable';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import Add from '@/components/Icons/Add';
import SearchBar from '@/components/SearchBar';
import List from './List';
import listConfigs from './listConfig';

export default {
  name: 'ListView',
  props: ['doctype', 'filters'],
  components: {
    PageHeader,
    List,
    Button,
    Add,
    SearchBar
  },
  created() {
    frappe.listView = new Observable();
  },
  methods: {
    async makeNewDoc() {
      const doctype = this.listConfig.doctype;
      const doc = await frappe.getNewDoc(doctype);
      if (this.listConfig.filters) {
        doc.set(this.listConfig.filters);
      }
      if (this.filters) {
        doc.set(this.filters);
      }
      let path = this.getFormPath(doc.name);
      this.$router.push(path);
      doc.on('afterInsert', () => {
        let path = this.getFormPath(doc.name);
        this.$router.replace(path);
      });
    },
    getFormPath(name) {
      if (this.listConfig.formRoute) {
        let path = this.listConfig.formRoute(name);
        return path;
      }
      return {
        path: `/list/${this.doctype}`,
        query: {
          edit: 1,
          doctype: this.doctype,
          name
        }
      };
    }
  },
  computed: {
    listConfig() {
      if (listConfigs[this.doctype]) {
        return listConfigs[this.doctype];
      } else {
        frappe.call({
          method: 'show-dialog',
          args: {
            title: 'Not Found',
            message: `${this.doctype} List not Registered`
          }
        });
        this.$router.go(-1);
      }
    },
    title() {
      if (this.listConfig) {
        return typeof this.listConfig.title === 'function'
          ? this.listConfig.title(this.filters)
          : this.listConfig.title;
      }
      return this.doctype;
    }
  }
};
</script>
