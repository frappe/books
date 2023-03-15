<template>
  <div class="flex flex-col">
    <PageHeader :title="title">
      <Button :icon="false" @click="openExportModal = true">
        {{ t`Export` }}
      </Button>
      <FilterDropdown
        ref="filterDropdown"
        @change="applyFilter"
        :schema-name="schemaName"
      />
      <Button
        v-if="canCreate"
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
      @openDoc="openDoc"
      @updatedData="updatedData"
      @makeNewDoc="makeNewDoc"
    />
    <Modal :open-modal="openExportModal" @closemodal="openExportModal = false">
      <ExportWizard
        class="w-form"
        :schema-name="schemaName"
        :title="pageTitle"
        :list-filters="listFilters"
      />
    </Modal>
  </div>
</template>
<script>
import { thisExpression } from '@babel/types';
import Button from 'src/components/Button.vue';
import ExportWizard from 'src/components/ExportWizard.vue';
import FilterDropdown from 'src/components/FilterDropdown.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { getRouteData } from 'src/utils/filters';
import {
  docsPathMap,
  getCreateFiltersFromListViewFilters,
} from 'src/utils/misc';
import { docsPathRef } from 'src/utils/refs';
import { openQuickEdit, routeTo } from 'src/utils/ui';
import List from './List.vue';

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
    Modal,
    ExportWizard,
  },
  data() {
    return {
      listConfig: undefined,
      openExportModal: false,
      listFilters: {},
    };
  },
  async activated() {
    if (typeof this.filters === 'object') {
      this.$refs.filterDropdown.setFilter(this.filters, true);
    }

    this.listConfig = getListConfig(this.schemaName);
    docsPathRef.value = docsPathMap[this.schemaName] ?? docsPathMap.Entries;

    if (this.fyo.store.isDevelopment) {
      window.lv = this;
    }
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    updatedData(listFilters) {
      this.listFilters = listFilters;
    },
    async openDoc(name) {
      const doc = await this.fyo.doc.getDoc(this.schemaName, name);

      if (this.listConfig.formRoute) {
        return await routeTo(this.listConfig.formRoute(name));
      }

      const { routeFilter } = getRouteData({ doc });

      openQuickEdit({
        doc,
        listFilters: routeFilter,
      });
    },
    async makeNewDoc() {
      const filters = getCreateFiltersFromListViewFilters(this.filters ?? {});
      const doc = fyo.doc.getNewDoc(this.schemaName, filters);
      const path = this.getFormPath(doc);

      await routeTo(path);
      doc.on('afterSync', () => {
        const path = this.getFormPath(doc);
        this.$router.replace(path);
      });
    },
    applyFilter(filters) {
      this.$refs.list.updateData(filters);
    },
    getFormPath(doc) {
      const { label, routeFilter } = getRouteData({ doc });
      let path = {
        path: `/list/${this.schemaName}/${label}`,
        query: {
          edit: 1,
          schemaName: this.schemaName,
          name: doc.name,
          filters: JSON.stringify(routeFilter),
        },
      };

      if (this.listConfig.formRoute) {
        path = this.listConfig.formRoute(doc.name);
      }

      if (typeof path === 'object') {
        return path;
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
    canCreate() {
      return fyo.schemaMap[this.schemaName].create !== false;
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
