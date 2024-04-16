<template>
  <div class="text-base flex flex-col overflow-hidden">
    <!-- Title Row -->
    <div
      class="flex items-center"
      :style="{
        paddingRight: dataSlice.length > 13 ? 'var(--w-scrollbar)' : '',
      }"
    >
      <p class="w-8 text-end me-4 text-gray-700 dark:text-gray-400">#</p>
      <Row
        class="flex-1 text-gray-700 dark:text-gray-400 h-row-mid"
        :column-count="columns.length"
        gap="1rem"
      >
        <div
          v-for="(column, i) in columns"
          :key="column.label"
          class="overflow-x-auto no-scrollbar whitespace-nowrap h-row items-center flex"
          :class="{
            'ms-auto': isNumeric(column.fieldtype),
            'pe-4': i === columns.length - 1,
          }"
        >
          {{ column.label }}
        </div>
      </Row>
    </div>
    <hr class="dark:border-gray-800" />

    <!-- Data Rows -->
    <div
      v-if="dataSlice.length !== 0"
      class="overflow-y-auto dark:dark-scroll custom-scroll custom-scroll-thumb1"
    >
      <div v-for="(row, i) in dataSlice" :key="(row.name as string)">
        <!-- Row Content -->
        <div class="flex hover:bg-gray-50 dark:hover:bg-gray-850 items-center">
          <p class="w-8 text-end me-4 text-gray-900 dark:text-gray-25">
            {{ i + pageStart + 1 }}
          </p>
          <Row
            gap="1rem"
            class="cursor-pointer text-gray-900 dark:text-gray-300 flex-1 h-row-mid"
            :column-count="columns.length"
            @click="$emit('openDoc', row.name)"
          >
            <ListCell
              v-for="(column, c) in columns"
              :key="column.label"
              :class="{
                'text-end': isNumeric(column.fieldtype),
                'pe-4': c === columns.length - 1,
              }"
              :row="(row as RenderData)"
              :column="column"
            />
          </Row>
        </div>
        <hr
          v-if="!(i === dataSlice.length - 1 && i > 13)"
          class="dark:border-gray-800"
        />
      </div>
    </div>

    <!-- Pagination Footer -->
    <div v-if="data?.length" class="mt-auto">
      <hr class="dark:border-gray-800" />
      <Paginator
        :item-count="data.length"
        class="px-4"
        @index-change="setPageIndices"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="!data?.length"
      class="flex flex-col items-center justify-center my-auto"
    >
      <img src="../../assets/img/list-empty-state.svg" alt="" class="w-24" />
      <p class="my-3 text-gray-800 dark:text-gray-200">
        {{ t`No entries found` }}
      </p>
      <Button v-if="canCreate" type="primary" @click="$emit('makeNewDoc')">
        {{ t`Make Entry` }}
      </Button>
    </div>
  </div>
</template>
<script lang="ts">
import { ListViewSettings, RenderData } from 'fyo/model/types';
import { cloneDeep } from 'lodash';
import Button from 'src/components/Button.vue';
import Paginator from 'src/components/Paginator.vue';
import Row from 'src/components/Row.vue';
import { fyo } from 'src/initFyo';
import { isNumeric } from 'src/utils';
import { QueryFilter } from 'utils/db/types';
import { PropType, defineComponent } from 'vue';
import ListCell from './ListCell.vue';

export default defineComponent({
  name: 'List',
  components: {
    Row,
    ListCell,
    Button,
    Paginator,
  },
  props: {
    listConfig: {
      type: Object as PropType<ListViewSettings | undefined>,
      default: () => ({ columns: [] }),
    },
    filters: {
      type: Object as PropType<QueryFilter>,
      default: () => ({}),
    },
    schemaName: { type: String, required: true },
    canCreate: Boolean,
  },
  emits: ['openDoc', 'makeNewDoc', 'updatedData'],
  data() {
    return {
      data: [] as RenderData[],
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
        columns = fyo.schemaMap[this.schemaName]?.quickEditFields ?? [];
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
  watch: {
    async schemaName(oldValue, newValue) {
      if (oldValue === newValue) {
        return;
      }

      await this.updateData();
    },
  },
  async mounted() {
    await this.updateData();
    this.setUpdateListeners();
  },
  methods: {
    isNumeric,
    setPageIndices({ start, end }: { start: number; end: number }) {
      this.pageStart = start;
      this.pageEnd = end;
    },
    setUpdateListeners() {
      if (!this.schemaName) {
        return;
      }

      const listener = async () => {
        await this.updateData();
      };

      if (fyo.schemaMap[this.schemaName]?.isSubmittable) {
        fyo.doc.observer.on(`submit:${this.schemaName}`, listener);
        fyo.doc.observer.on(`revert:${this.schemaName}`, listener);
      }

      fyo.doc.observer.on(`sync:${this.schemaName}`, listener);
      fyo.db.observer.on(`delete:${this.schemaName}`, listener);
      fyo.doc.observer.on(`rename:${this.schemaName}`, listener);
    },
    async updateData(filters?: Record<string, unknown>) {
      if (!filters) {
        filters = { ...this.filters };
      }

      // Unproxy the filters
      filters = cloneDeep(filters);

      const orderBy = ['created'];
      if (fyo.db.fieldMap[this.schemaName]['date']) {
        orderBy.unshift('date');
      }

      const tableData = await fyo.db.getAll(this.schemaName, {
        fields: ['*'],
        filters: filters as QueryFilter,
        orderBy,
      });

      this.data = tableData.map((d) => ({
        ...d,
        schema: fyo.schemaMap[this.schemaName],
      })) as RenderData[];
      this.$emit('updatedData', filters);
    },
  },
});
</script>
