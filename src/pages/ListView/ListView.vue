<template>
  <div class="flex flex-col">
    <PageHeader :title="title">
      <template #actions>
        <FilterDropdown
          ref="filterDropdown"
          @change="applyFilter"
          :fields="fields"
        />
        <Button class="ml-2" :icon="true" type="primary" @click="makeNewDoc">
          <feather-icon name="plus" class="w-4 h-4 text-white" />
        </Button>
      </template>
    </PageHeader>
    <List
      ref="list"
      :schemaName="schemaName"
      :listConfig="listConfig"
      :filters="filters"
      class="flex-1 flex h-full"
      @makeNewDoc="makeNewDoc"
    />
  </div>
</template>
<script>
import Button from 'src/components/Button';
import FilterDropdown from 'src/components/FilterDropdown';
import PageHeader from 'src/components/PageHeader';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';
import List from './List';

export default {
  name: 'ListView',
  props: ['schemaName', 'filters'],
  components: {
    PageHeader,
    List,
    Button,
    FilterDropdown,
  },
  data() {
    return { listConfig: undefined };
  },
  async activated() {
    if (typeof this.filters === 'object') {
      this.$refs.filterDropdown.setFilter(this.filters);
    }

    this.listConfig = getListConfig(this.schemaName);
  },
  methods: {
    async makeNewDoc() {
      const doc = await fyo.doc.getNewDoc(this.schemaName, this.filters ?? {});
      const path = this.getFormPath(doc.name);

      routeTo(path);
      doc.on('afterSync', () => {
        const path = this.getFormPath(doc.name);
        this.$router.replace(path);
      });
    },
    applyFilter(filters) {
      this.$refs.list.updateData(filters);
    },
    getFormPath(name) {
      let path = {
        path: `/list/${this.schemaName}`,
        query: {
          edit: 1,
          schemaName: this.schemaName,
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
    title() {
      return fyo.schemaMap[this.schemaName].label;
    },
    fields() {
      return fyo.schemaMap[this.schemaName].fields;
    },
  },
};

function getListConfig(schemaName) {
  const listConfig = fyo.models[schemaName]?.getListViewSettings?.(fyo);
  if (listConfig?.columns === undefined) {
    return {
      columns: fyo.schemaMap[schemaName].keywordFields ?? ['name'],
    };
  }
  return listConfig;
}
</script>
