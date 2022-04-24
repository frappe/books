<template>
  <div class="flex flex-col">
    <PageHeader>
      <template #title>
        <h1 class="text-2xl font-bold" v-if="title">
          {{ title }}
        </h1>
      </template>
      <template #actions>
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
        @makeNewDoc="makeNewDoc"
      />
    </div>
  </div>
</template>
<script>
import Button from 'src/components/Button';
import FilterDropdown from 'src/components/FilterDropdown';
import PageHeader from 'src/components/PageHeader';
import SearchBar from 'src/components/SearchBar';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils';
import List from './List';

export default {
  name: 'ListView',
  props: ['doctype', 'filters'],
  components: {
    PageHeader,
    List,
    Button,
    SearchBar,
    FilterDropdown,
  },
  data() {
    return { listConfigs: undefined };
  },
  async activated() {
    if (typeof this.filters === 'object') {
      this.$refs.filterDropdown.setFilter(this.filters);
    }

    if (this.listConfigs === undefined) {
      this.listConfigs = (await import('./listConfig')).default;
    }
  },
  methods: {
    async makeNewDoc() {
      const doctype = this.listConfig.doctype;
      const doc = await fyo.doc.getNewDoc(doctype);
      if (this.listConfig.filters) {
        doc.set(this.listConfig.filters);
      }
      if (this.filters) {
        doc.set(this.filters);
      }
      let path = this.getFormPath(doc.name);
      routeTo(path);
      doc.on('afterInsert', () => {
        let path = this.getFormPath(doc.name);
        this.$router.replace(path);
      });
    },
    applyFilter(filters) {
      this.$refs.list.updateData(filters);
    },
    getFormPath(name) {
      let path = {
        path: `/list/${this.doctype}`,
        query: {
          edit: 1,
          doctype: this.doctype,
          name,
        },
      };

      if (this.listConfig.formRoute) {
        path = this.listConfig.formRoute(name);
      }

      // Maintain filter if present
      const currentPath = this.$router.currentRoute.value.path;
      if (currentPath.slice(0, path?.path?.length ?? 0) === path.path) {
        path.path = currentPath;
      }

      return path;
    },
  },
  computed: {
    listConfig() {
      if (this?.listConfigs?.[this?.doctype]) {
        return this.listConfigs[this.doctype];
      } else {
        return {
          title: this.doctype,
          doctype: this.doctype,
          columns: fyo.schemaMap[this.doctype].keywordFields ?? ['name'],
        };
      }
    },
    title() {
      return this.listConfig.title || this.doctype;
    },
  },
};
</script>
