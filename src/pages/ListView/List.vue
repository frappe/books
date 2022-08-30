<template>
  <div class="text-base flex flex-col overflow-y-hidden">
    <!-- Title Row -->
    <div class="flex items-center">
      <p class="w-8 text-right mr-4 text-gray-700">#</p>
      <Row
        class="flex-1 text-gray-700 border-none h-row-mid"
        :columnCount="columns.length"
        gap="1rem"
      >
        <div
          v-for="(column, i) in columns"
          :key="column.label"
          class="
            overflow-x-auto
            no-scrollbar
            whitespace-nowrap
            h-row
            items-center
            flex
          "
          :class="{
            'ml-auto': isNumeric(column.fieldtype),
            'pr-4': i === columns.length - 1,
          }"
        >
          {{ column.label }}
        </div>
      </Row>
    </div>
    <hr />

    <!-- Data Rows -->
    <div class="overflow-y-auto" v-if="dataSlice.length !== 0">
      <div v-for="(doc, i) in dataSlice" :key="doc.name">
        <!-- Row Content -->
        <div class="flex hover:bg-gray-50 items-center">
          <p class="w-8 text-right mr-4 text-gray-900">
            {{ i + pageStart + 1 }}
          </p>
          <Row
            gap="1rem"
            class="cursor-pointer text-gray-900 flex-1 border-none h-row-mid"
            @click="openForm(doc)"
            :columnCount="columns.length"
          >
            <ListCell
              v-for="(column, c) in columns"
              :key="column.label"
              :class="{
                'text-right': isNumeric(column.fieldtype),
                'pr-4': c === columns.length - 1,
              }"
              :doc="doc"
              :column="column"
            />
          </Row>
        </div>
        <hr v-if="!(i === dataSlice.length - 1 && i > 13)" />
      </div>
    </div>

    <!-- Pagination Footer -->
    <div class="mt-auto" v-if="data?.length">
      <hr />
      <Paginator
        :item-count="data.length"
        @index-change="setPageIndices"
        class="px-4"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="!data?.length"
      class="flex flex-col items-center justify-center my-auto"
    >
      <img src="@/assets/img/list-empty-state.svg" alt="" class="w-24" />
      <p class="my-3 text-gray-800">{{ t`No entries found` }}</p>
      <Button type="primary" class="text-white" @click="$emit('makeNewDoc')">
        {{ t`Make Entry` }}
      </Button>
    </div>
  </div>
</template>
<script>
import Button from 'src/components/Button';
import Paginator from 'src/components/Paginator.vue';
import Row from 'src/components/Row';
import { fyo } from 'src/initFyo';
import { isNumeric } from 'src/utils';
import { openQuickEdit, routeTo } from 'src/utils/ui';
import { defineComponent } from 'vue';
import ListCell from './ListCell';

export default defineComponent({
  name: 'List',
  props: { listConfig: Object, filters: Object, schemaName: String },
  emits: ['makeNewDoc'],
  components: {
    Row,
    ListCell,
    Button,
    Paginator,
  },
  watch: {
    schemaName(oldValue, newValue) {
      if (oldValue === newValue) {
        return;
      }

      this.updateData();
    },
  },
  data() {
    return {
      data: [],
      pageStart: 0,
      pageEnd: 0,
    };
  },
  computed: {
    dataSlice() {
      return this.data.slice(this.pageStart, this.pageEnd);
    },
    count() {
      return this.pageEnd - this.pageStart + 1;
    },
    columns() {
      let columns = this.listConfig?.columns ?? [];

      if (columns.length === 0) {
        columns = fyo.schemaMap[this.schemaName].quickEditFields ?? [];
        columns = [...new Set(['name', ...columns])];
      }

      return columns
        .map((fieldname) => {
          if (typeof fieldname === 'object') {
            return fieldname;
          }

          return fyo.getField(this.schemaName, fieldname);
        })
        .filter(Boolean);
    },
  },
  async mounted() {
    await this.updateData();
    this.setUpdateListeners();
  },
  methods: {
    isNumeric,
    setPageIndices({ start, end }) {
      this.pageStart = start;
      this.pageEnd = end;
    },
    setUpdateListeners() {
      if (!this.schemaName) {
        return;
      }

      const listener = () => {
        this.updateData();
      };

      if (fyo.schemaMap[this.schemaName].isSubmittable) {
        fyo.doc.observer.on(`submit:${this.schemaName}`, listener);
        fyo.doc.observer.on(`revert:${this.schemaName}`, listener);
      }

      fyo.doc.observer.on(`sync:${this.schemaName}`, listener);
      fyo.db.observer.on(`delete:${this.schemaName}`, listener);
      fyo.doc.observer.on(`rename:${this.schemaName}`, listener);
    },
    openForm(doc) {
      if (this.listConfig.formRoute) {
        routeTo(this.listConfig.formRoute(doc.name));
        return;
      }

      openQuickEdit({
        schemaName: this.schemaName,
        name: doc.name,
      });
    },
    async updateData(filters) {
      if (!filters) {
        filters = { ...this.filters };
      }

      const orderBy = !!fyo.getField(this.schemaName, 'date')
        ? 'date'
        : 'created';

      this.data = (
        await fyo.db.getAll(this.schemaName, {
          fields: ['*'],
          filters,
          orderBy,
        })
      ).map((d) => ({ ...d, schema: fyo.schemaMap[this.schemaName] }));
    },
  },
});
</script>
