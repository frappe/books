<template>
  <Popover @close="emitFilterChange" placement="bottom-end">
    <template v-slot:target="{ togglePopover }">
      <Button :icon="true" @click="togglePopover()">
        <span class="flex items-center">
          <Icon name="filter" size="12" class="stroke-current text-gray-800" />
          <span class="ml-2 text-base text-black">
            <template v-if="activeFilterCount > 0">
              {{ filterAppliedMessage }}
            </template>
            <template v-else>
              {{ _('Filter') }}
            </template>
          </span>
        </span>
      </Button>
    </template>
    <div slot="content">
      <div class="p-3">
        <template v-if="filters.length">
          <div
            :key="filter.fieldname + frappe.getRandomString()"
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
                    placeholder: 'Field',
                    fieldname: 'fieldname',
                    fieldtype: 'Select',
                    options: fieldOptions
                  }"
                  :value="filter.fieldname"
                  @change="value => (filter.fieldname = value)"
                />
              </div>
              <div class="ml-2 w-24">
                <FormControl
                  size="small"
                  input-class="bg-gray-100"
                  :df="{
                    placeholder: 'Condition',
                    fieldname: 'condition',
                    fieldtype: 'Select',
                    options: conditions
                  }"
                  :value="filter.condition"
                  @change="value => (filter.condition = value)"
                />
              </div>
              <div class="ml-2 w-24">
                <FormControl
                  size="small"
                  input-class="bg-gray-100"
                  :df="{
                    placeholder: 'Value',
                    fieldname: 'value',
                    fieldtype: 'Data'
                  }"
                  :value="filter.value"
                  @change="value => (filter.value = value)"
                />
              </div>
            </div>
            <div
              class="ml-2 cursor-pointer w-5 h-5 flex-center hover:bg-gray-100 rounded-md"
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
            _('No filters selected')
          }}</span>
        </template>
      </div>
      <div
        class="text-base border-t px-3 py-2 flex items-center text-gray-600 cursor-pointer hover:bg-gray-100"
        @click="addNewFilter"
      >
        <feather-icon name="plus" class="w-4 h-4" />
        <span class="ml-2">{{ _('Add a filter') }}</span>
      </div>
    </div>
  </Popover>
</template>

<script>
import Popover from './Popover';
import Button from './Button';
import Icon from './Icon';
import FormControl from './Controls/FormControl';

let conditions = [
  { label: 'Is', value: '=' },
  { label: 'Is Not', value: '!=' },
  { label: 'Contains', value: 'like' },
  { label: 'Does Not Contain', value: 'not like' },
  { label: 'Greater Than', value: '>' },
  { label: 'Less Than', value: '<' },
  { label: 'Is Empty', value: 'is null' },
  { label: 'Is Not Empty', value: 'is not null' }
];

export default {
  name: 'FilterDropdown',
  components: {
    Popover,
    Button,
    Icon,
    FormControl
  },
  props: ['fields'],
  data() {
    return {
      filters: []
    };
  },
  created() {
    this.addNewFilter();
  },
  methods: {
    addNewFilter() {
      let df = this.fields[0];
      this.addFilter(df.fieldname, 'like', '');
    },
    addFilter(fieldname, condition, value) {
      this.filters.push({ fieldname, condition, value });
    },
    removeFilter(filter) {
      this.filters = this.filters.filter(f => f !== filter);
    },
    setFilter(filters) {
      this.filters = [];
      Object.keys(filters).map(fieldname => {
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
    }
  },
  computed: {
    fieldOptions() {
      return this.fields.map(df => ({ label: df.label, value: df.fieldname }));
    },
    conditions() {
      return conditions;
    },
    activeFilterCount() {
      return this.filters.filter(filter => filter.value).length;
    },
    filterAppliedMessage() {
      if (this.activeFilterCount === 1) {
        return this._('1 filter applied');
      }
      return this._('{0} filters applied', [this.activeFilterCount]);
    }
  }
};
</script>
