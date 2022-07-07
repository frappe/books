<template>
  <Popover @close="emitFilterChange" placement="bottom-end">
    <template #target="{ togglePopover }">
      <Button :icon="true" @click="togglePopover()">
        <span class="flex items-center">
          <Icon name="filter" size="12" class="stroke-current text-gray-700" />
          <span class="ml-1">
            <template v-if="activeFilterCount > 0">
              {{ filterAppliedMessage }}
            </template>
            <template v-else>
              {{ t`Filter` }}
            </template>
          </span>
        </span>
      </Button>
    </template>
    <template #content>
      <div>
        <div class="p-3">
          <template v-if="filters.length">
            <div
              :key="filter.fieldname + getRandomString()"
              v-for="(filter, i) in filters"
              class="flex items-center justify-between text-base"
              :class="i !== 0 && 'mt-2'"
            >
              <div class="flex">
                <div class="w-24">
                  <FormControl
                    size="small"
                    input-class="bg-gray-100"
                    :df="{
                      placeholder: t`Field`,
                      fieldname: 'fieldname',
                      fieldtype: 'Select',
                      options: fieldOptions,
                    }"
                    :value="filter.fieldname"
                    @change="(value) => (filter.fieldname = value)"
                  />
                </div>
                <div class="ml-2 w-24">
                  <FormControl
                    size="small"
                    input-class="bg-gray-100"
                    :df="{
                      placeholder: t`Condition`,
                      fieldname: 'condition',
                      fieldtype: 'Select',
                      options: conditions,
                    }"
                    :value="filter.condition"
                    @change="(value) => (filter.condition = value)"
                  />
                </div>
                <div class="ml-2 w-24">
                  <FormControl
                    size="small"
                    input-class="bg-gray-100"
                    :df="{
                      placeholder: t`Value`,
                      fieldname: 'value',
                      fieldtype: 'Data',
                    }"
                    :value="filter.value"
                    @change="(value) => (filter.value = value)"
                  />
                </div>
              </div>
              <div
                class="
                  ml-2
                  cursor-pointer
                  w-5
                  h-5
                  flex-center
                  hover:bg-gray-100
                  rounded-md
                "
              >
                <feather-icon
                  name="x"
                  class="w-4 h-4"
                  @click="removeFilter(filter)"
                />
              </div>
            </div>
          </template>
          <template v-else>
            <span class="text-base text-gray-600">{{
              t`No filters selected`
            }}</span>
          </template>
        </div>
        <div
          class="
            text-base
            border-t
            px-3
            py-2
            flex
            items-center
            text-gray-600
            cursor-pointer
            hover:bg-gray-100
          "
          @click="addNewFilter"
        >
          <feather-icon name="plus" class="w-4 h-4" />
          <span class="ml-2">{{ t`Add a filter` }}</span>
        </div>
      </div>
    </template>
  </Popover>
</template>

<script>
import { t } from 'fyo';
import { getRandomString } from 'utils';
import Button from './Button';
import FormControl from './Controls/FormControl.vue';
import Icon from './Icon';
import Popover from './Popover';

let conditions = [
  { label: t`Is`, value: '=' },
  { label: t`Is Not`, value: '!=' },
  { label: t`Contains`, value: 'like' },
  { label: t`Does Not Contain`, value: 'not like' },
  { label: t`Greater Than`, value: '>' },
  { label: t`Less Than`, value: '<' },
  { label: t`Is Empty`, value: 'is null' },
  { label: t`Is Not Empty`, value: 'is not null' },
];

export default {
  name: 'FilterDropdown',
  components: {
    Popover,
    Button,
    Icon,
    FormControl,
  },
  props: ['fields'],
  emits: ['change'],
  data() {
    return {
      filters: [],
    };
  },
  created() {
    this.addNewFilter();
  },
  methods: {
    getRandomString,
    addNewFilter() {
      let df = this.fields[0];
      this.addFilter(df.fieldname, 'like', '');
    },
    addFilter(fieldname, condition, value) {
      this.filters.push({ fieldname, condition, value });
    },
    removeFilter(filter) {
      this.filters = this.filters.filter((f) => f !== filter);
    },
    setFilter(filters) {
      this.filters = [];
      Object.keys(filters).map((fieldname) => {
        let parts = filters[fieldname];
        let condition, value;
        if (Array.isArray(parts)) {
          condition = parts[0];
          value = parts[1];
        } else {
          condition = '=';
          value = parts;
        }
        this.addFilter(fieldname, condition, value);
      });
      this.emitFilterChange();
    },
    emitFilterChange() {
      let filters = this.filters.reduce((acc, filter) => {
        if (filter.value === '' && filter.condition) {
          return acc;
        }
        acc[filter.fieldname] = [filter.condition, filter.value];
        return acc;
      }, {});

      this.$emit('change', filters);
    },
  },
  computed: {
    fieldOptions() {
      return this.fields.map((df) => ({
        label: df.label,
        value: df.fieldname,
      }));
    },
    conditions() {
      return conditions;
    },
    activeFilterCount() {
      return this.filters.filter((filter) => filter.value).length;
    },
    filterAppliedMessage() {
      if (this.activeFilterCount === 1) {
        return this.t`1 filter applied`;
      }
      return this.t`${this.activeFilterCount} filters applied`;
    },
  },
};
</script>
