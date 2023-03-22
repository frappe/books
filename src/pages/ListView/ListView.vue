<template>
  <div class="flex flex-col">
    <PageHeader :title="title">
      <Button :icon="false" @click="openExportModal = true" ref="exportButton">
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
        ref="makeNewDocButton"
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
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import Button from 'src/components/Button.vue';
import ExportWizard from 'src/components/ExportWizard.vue';
import FilterDropdown from 'src/components/FilterDropdown.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { getRouteData } from 'src/utils/filters';
import { shortcutsKey } from 'src/utils/injectionKeys';
import {
  docsPathMap,
  getCreateFiltersFromListViewFilters,
} from 'src/utils/misc';
import { docsPathRef } from 'src/utils/refs';
import { openQuickEdit, routeTo } from 'src/utils/ui';
import { QueryFilter } from 'utils/db/types';
import { defineComponent, inject, ref } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import List from './List.vue';

export default defineComponent({
  name: 'ListView',
  props: {
    schemaName: { type: String, required: true },
    filters: Object,
    pageTitle: { type: String, default: '' },
  },
  setup() {
    return {
      shortcuts: inject(shortcutsKey),
      list: ref<InstanceType<typeof List> | null>(null),
      makeNewDocButton: ref<InstanceType<typeof Button> | null>(null),
      exportButton: ref<InstanceType<typeof Button> | null>(null),
      filterDropdown: ref<InstanceType<typeof FilterDropdown> | null>(null),
    };
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
    } as {
      listConfig: undefined | ReturnType<typeof getListConfig>;
      openExportModal: boolean;
      listFilters: QueryFilter;
    };
  },
  async activated() {
    if (typeof this.filters === 'object') {
      this.filterDropdown?.setFilter(this.filters, true);
    }

    this.listConfig = getListConfig(this.schemaName);
    docsPathRef.value =
      docsPathMap[this.schemaName] ?? docsPathMap.Entries ?? '';

    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.lv = this;
    }

    this.setShortcuts();
  },
  deactivated() {
    docsPathRef.value = '';
    this.shortcuts?.delete(this);
  },
  methods: {
    setShortcuts() {
      if (!this.shortcuts) {
        return;
      }

      this.shortcuts.pmod.set(this, ['KeyN'], () =>
        this.makeNewDocButton?.$el.click()
      );
      this.shortcuts.pmod.set(this, ['KeyE'], () =>
        this.exportButton?.$el.click()
      );
    },
    updatedData(listFilters: QueryFilter) {
      this.listFilters = listFilters;
    },
    async openDoc(name: string) {
      const doc = await this.fyo.doc.getDoc(this.schemaName, name);

      if (this.listConfig?.formRoute) {
        return await routeTo(this.listConfig.formRoute(name));
      }

      const { routeFilter } = getRouteData({ doc });

      openQuickEdit({
        doc,
        listFilters: routeFilter,
      });
    },
    async makeNewDoc() {
      if (!this.canCreate) {
        return;
      }

      const filters = getCreateFiltersFromListViewFilters(this.filters ?? {});
      const doc = fyo.doc.getNewDoc(this.schemaName, filters);
      const path = this.getFormPath(doc);

      await routeTo(path);
      doc.on('afterSync', () => {
        const path = this.getFormPath(doc);
        this.$router.replace(path);
      });
    },
    applyFilter(filters: QueryFilter) {
      this.list?.updateData(filters);
    },
    getFormPath(doc: Doc) {
      const { label, routeFilter } = getRouteData({ doc });
      const currentPath = this.$router.currentRoute.value.path;

      // Maintain filters
      let path = `/list/${this.schemaName}/${label}`;
      if (currentPath.startsWith(path)) {
        path = currentPath;
      }

      let route: RouteLocationRaw = {
        path,
        query: {
          edit: 1,
          schemaName: this.schemaName,
          name: doc.name,
          filters: JSON.stringify(routeFilter),
        },
      };

      if (this.listConfig?.formRoute) {
        route = this.listConfig.formRoute(doc.name!);
      }

      return route;
    },
  },
  computed: {
    title(): string {
      if (this.pageTitle) {
        return this.pageTitle;
      }

      return fyo.schemaMap[this.schemaName]?.label ?? this.schemaName;
    },
    fields(): Field[] {
      return fyo.schemaMap[this.schemaName]?.fields ?? [];
    },
    canCreate(): boolean {
      return fyo.schemaMap[this.schemaName]?.create !== false;
    },
  },
});

function getListConfig(schemaName: string) {
  const listConfig = fyo.models[schemaName]?.getListViewSettings?.(fyo);
  if (listConfig?.columns === undefined) {
    return {
      columns: ['name'],
    };
  }
  return listConfig;
}
</script>
