<template>
  <div class="mx-4 text-base flex flex-col overflow-y-hidden">
    <!-- Title Row -->
    <div class="flex items-center">
      <p class="w-8 text-right mr-4 text-gray-700">#</p>
      <Row
        class="flex-1 text-gray-700 border-none"
        :columnCount="columns.length"
        gap="1rem"
      >
        <div
          v-for="column in columns"
          :key="column.label"
          class="py-4 truncate"
          :class="
            ['Int', 'Float', 'Currency'].includes(column.fieldtype)
              ? 'text-right'
              : ''
          "
        >
          {{ column.label }}
        </div>
      </Row>
    </div>
    <hr />

    <!-- Data Rows -->
    <div class="overflow-y-auto" v-if="data.length !== 0">
      <div
        v-for="(doc, i) in data.slice((pageNo - 1) * count, pageNo * count)"
        :key="doc.name"
      >
        <!-- Row Content -->
        <div class="flex hover:bg-gray-100 items-center">
          <p class="w-8 text-right mr-4 text-gray-900">
            {{ i + 1 + (pageNo - 1) * count }}
          </p>
          <Row
            gap="1rem"
            class="cursor-pointer text-gray-900 flex-1 border-none"
            @click="openForm(doc)"
            :columnCount="columns.length"
          >
            <ListCell
              v-for="column in columns"
              :key="column.label"
              :class="{
                'text-right': ['Float', 'Currency'].includes(column.fieldtype),
              }"
              :doc="doc"
              :column="column"
            ></ListCell>
          </Row>
        </div>
        <hr v-if="i !== count - 1" />
      </div>
    </div>

    <!-- Pagination Footer -->
    <hr v-if="data.length > 20" />
    <div
      v-if="data.length > 20"
      class="my-3 grid grid-cols-3 text-gray-800 text-sm select-none"
    >
      <!-- Length Display -->
      <div class="justify-self-start">
        {{
          `${(pageNo - 1) * count + 1} - ${Math.min(
            pageNo * count,
            data.length
          )}`
        }}
      </div>

      <!-- Pagination Selector -->
      <div class="flex gap-1 items-center justify-self-center">
        <feather-icon
          name="chevron-left"
          class="w-4 h-4"
          :class="
            pageNo > 1 ? 'text-gray-600 cursor-pointer' : 'text-transparent'
          "
          @click="pageNo = Math.max(1, pageNo - 1)"
        />
        <div class="flex gap-1 bg-gray-100 rounded">
          <input
            type="number"
            class="
              w-6
              text-right
              outline-none
              bg-transparent
              focus:text-gray-900
            "
            :value="pageNo"
            @change="setPageNo"
            @input="setPageNo"
            min="1"
            :max="maxPages"
          />
          <p class="text-gray-600">/</p>
          <p class="w-5">
            {{ maxPages }}
          </p>
        </div>
        <feather-icon
          name="chevron-right"
          class="w-4 h-4"
          :class="
            pageNo < maxPages
              ? 'text-gray-600 cursor-pointer'
              : 'text-transparent'
          "
          @click="pageNo = Math.min(maxPages, pageNo + 1)"
        />
      </div>

      <!-- Count Selector -->
      <div class="border rounded flex justify-self-end">
        <button
          v-for="c in allowedCounts"
          :key="c + '-count'"
          @click="setCount(c)"
          class="w-9"
          :class="count === c ? 'bg-gray-200' : ''"
        >
          {{ c }}
        </button>
      </div>
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
import Row from 'src/components/Row';
import { fyo } from 'src/initFyo';
import { openQuickEdit, routeTo } from 'src/utils/ui';
import ListCell from './ListCell';

export default {
  name: 'List',
  props: { listConfig: Object, filters: Object, schemaName: String },
  emits: ['makeNewDoc'],
  components: {
    Row,
    ListCell,
    Button,
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
      pageNo: 1,
      count: 20,
      allowedCounts: [20, 100, 500],
      data: [],
    };
  },
  computed: {
    maxPages() {
      return Math.ceil(this.data.length / this.count);
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
    setPageNo({ target: { value } }) {
      value = parseInt(value);
      if (isNaN(value)) {
        return;
      }
      this.pageNo = Math.min(Math.max(1, value), this.maxPages);
    },
    setCount(count) {
      this.pageNo = 1;
      this.count = count;
    },
    setUpdateListeners() {
      const listener = (name) => {
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

      this.data = await fyo.db.getAll(this.schemaName, {
        fields: ['*'],
        filters,
        orderBy: 'modified',
      });
    },
  },
};
</script>
