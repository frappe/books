<template>
  <div class="flex flex-col">
    <PageHeader :title="title">
      <FilterDropdown
        ref="filterDropdown"
        @change="applyFilter"
        :schema-name="schemaName"
      />
      <Button
        :icon="true"
        type="primary"
        @click="makeNewDoc"
        :padding="false"
        class="px-3"
      >
        <feather-icon name="plus" class="w-4 h-4" />
      </Button>
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
import Button from 'src/components/Button.vue';
import FilterDropdown from 'src/components/FilterDropdown.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { docsPathMap } from 'src/utils/misc';
import { docsPath, routeTo } from 'src/utils/ui';
import List from './List';

export default {
  name: 'ListView',
  props: {
    schemaName: String,
    filters: Object,
    pageTitle: { type: String, default: '' },
  },
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
      this.$refs.filterDropdown.setFilter(this.filters, true);
    }

    this.listConfig = getListConfig(this.schemaName);
    docsPath.value = docsPathMap[this.schemaName] ?? docsPathMap.Entries;
  },
  deactivated() {
    docsPath.value = '';
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
      return this.pageTitle || fyo.schemaMap[this.schemaName].label;
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
      columns: ['name'],
    };
  }
  return listConfig;
}
</script>
