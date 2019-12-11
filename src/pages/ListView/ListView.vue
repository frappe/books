<template>
  <div class="flex flex-col">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold" v-if="title">{{ title }}</h1>
      <template slot="actions">
        <FilterDropdown
          ref="filterDropdown"
          @change="applyFilter"
          :fields="meta.fields"
        />
        <Button class="ml-2" :icon="true" type="primary" @click="makeNewDoc">
          <feather-icon name="plus" class="w-4 h-4 text-white" />
        </Button>
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <div class="flex-1 flex h-full">
      <List
        ref="list"
        :listConfig="listConfig"
        :filters="filters"
        class="flex-1"
      />
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Observable from 'frappejs/utils/observable';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import SearchBar from '@/components/SearchBar';
import List from './List';
import listConfigs from './listConfig';
import Icon from '@/components/Icon';
import FilterDropdown from '@/components/FilterDropdown';

export default {
  name: 'ListView',
  props: ['doctype', 'filters'],
  components: {
    PageHeader,
    List,
    Button,
    SearchBar,
    Icon,
    FilterDropdown
  },
  activated() {
    if (typeof this.filters === 'object') {
      this.$refs.filterDropdown.setFilter(this.filters);
    }
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
    applyFilter(filters) {
      this.$refs.list.updateData(filters);
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
    meta() {
      return frappe.getMeta(this.doctype);
    },
    listConfig() {
      if (listConfigs[this.doctype]) {
        return listConfigs[this.doctype];
      } else {
        return {
          title: this.doctype,
          doctype: this.doctype,
          columns: this.meta.getKeywordFields()
        };
      }
    },
    title() {
      return this.listConfig.title || this.doctype;
    }
  }
};
</script>
