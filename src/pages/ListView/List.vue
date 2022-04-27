<template>
  <div class="mx-4 pb-16 text-base flex flex-col overflow-y-hidden">
    <!-- Title Row -->
    <div class="flex">
      <div class="py-4 mr-3 w-7 border-b" v-if="hasImage">
        <p class="text-gray-700">Img</p>
      </div>
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

    <!-- Data Rows -->
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
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center my-auto">
      <img src="@/assets/img/list-empty-state.svg" alt="" class="w-24" />
      <p class="my-3 text-gray-800">{{ t`No entries found` }}</p>
      <Button type="primary" class="text-white" @click="$emit('makeNewDoc')">
        {{ t`Make Entry` }}
      </Button>
    </div>
  </div>
</template>
<script>
import Avatar from 'src/components/Avatar';
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
    Avatar,
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
      data: [],
    };
  },
  computed: {
    columns() {
      const columns = this.listConfig?.columns ?? [];
      return columns
        .map((fieldname) => fyo.getField(this.schemaName, fieldname))
        .filter(Boolean);
    },
    hasImage() {
      return !!fyo.getField(this.schemaName, 'image');
    },
  },
  async mounted() {
    await this.updateData();
    /*
    TODO: need to set callback incase that schema has data changes
    fyo.db.on(`change:${this.schemaName}`, () => {
      this.updateData();
    });
    */
  },
  methods: {
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
        orderBy: 'created',
      });
    },
  },
};
</script>
