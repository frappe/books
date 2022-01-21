<template>
  <div class="px-5 pb-16 text-base flex flex-col overflow-y-hidden">
    <div class="flex px-3">
      <div class="py-4 mr-3 w-7" v-if="hasImage"></div>
      <Row
        class="flex-1 text-gray-700"
        :columnCount="columns.length"
        gap="1rem"
      >
        <div
          v-for="column in columns"
          :key="column.label"
          class="py-4 truncate"
          :class="
            ['Float', 'Currency'].includes(column.fieldtype) ? 'text-right' : ''
          "
        >
          {{ column.label }}
        </div>
      </Row>
    </div>
    <div class="overflow-y-auto" v-if="data.length !== 0">
      <div
        class="px-3 flex hover:bg-gray-100 rounded-md"
        v-for="doc in data"
        :key="doc.name"
      >
        <div class="w-7 py-4 mr-3" v-if="hasImage">
          <Avatar :imageURL="doc.image" :label="doc.name" />
        </div>
        <Row
          gap="1rem"
          class="cursor-pointer text-gray-900 flex-1"
          @click.native="openForm(doc)"
          :columnCount="columns.length"
        >
          <ListCell
            v-for="column in columns"
            :key="column.label"
            :class="{
              'text-right': ['Float', 'Currency'].includes(column.fieldtype)
            }"
            :doc="doc"
            :column="column"
          ></ListCell>
        </Row>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center my-auto">
      <img src="@/assets/img/list-empty-state.svg" alt="" class="w-24" />
      <p class="my-3 text-gray-800">No {{ meta.label || meta.name }} found</p>
      <Button type="primary" class="text-white" @click="$emit('makeNewDoc')">
        Create a new {{ meta.label || meta.name }}
      </Button>
    </div>
  </div>
</template>
<script>
import frappe from 'frappe';
import Row from '@/components/Row';
import ListCell from './ListCell';
import Avatar from '@/components/Avatar';
import { openQuickEdit, routeTo } from '@/utils';
import Button from '@/components/Button';

export default {
  name: 'List',
  props: ['listConfig', 'filters'],
  components: {
    Row,
    ListCell,
    Avatar,
    Button
  },
  watch: {
    listConfig(oldValue, newValue) {
      if (oldValue.doctype !== newValue.doctype) {
        this.setupColumnsAndData();
      }
    }
  },
  data() {
    return {
      data: []
    };
  },
  computed: {
    columns() {
      return this.prepareColumns();
    },
    meta() {
      return frappe.getMeta(this.listConfig.doctype);
    },
    hasImage() {
      return this.meta.hasField('image');
    }
  },
  async mounted() {
    await this.setupColumnsAndData();
    frappe.db.on(`change:${this.listConfig.doctype}`, () => {
      this.updateData();
    });
  },
  methods: {
    async setupColumnsAndData() {
      this.doctype = this.listConfig.doctype;
      await this.updateData();
    },
    openForm(doc) {
      if (this.listConfig.formRoute) {
        routeTo(this.listConfig.formRoute(doc.name));
        return;
      }
      openQuickEdit({
        doctype: this.doctype,
        name: doc.name
      });
    },
    async updateData(filters) {
      if (!filters) filters = this.getFilters();
      this.data = await frappe.db.getAll({
        doctype: this.doctype,
        fields: ['*'],
        filters,
        orderBy: 'creation'
      });
    },
    getFilters() {
      let filters = {};
      Object.assign(filters, this.listConfig.filters || {});
      Object.assign(filters, this.filters);
      return filters;
    },
    prepareColumns() {
      return this.listConfig.columns
        .map(col => {
          if (typeof col === 'string') {
            const field = this.meta.getField(col);
            if (!field) return null;
            return field;
          }
          return col;
        })
        .filter(Boolean);
    }
  }
};
</script>
