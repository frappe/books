<template>
  <Popover
    @close="emitFilterChange"
    placement="bottom-end"
    v-if="fields.length"
  >
    <template #target="{ togglePopover }">
      <Button :icon="true" @click="togglePopover()">
        <span class="flex items-center">
          <Icon name="filter" size="12" class="stroke-current text-gray-700" />
          <span class="ms-1">
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
        <div class="p-2">
          <template v-if="explicitFilters.length">
            <div class="flex flex-col gap-2">
              <div
                :key="filter.fieldname + getRandomString()"
                v-for="(filter, i) in explicitFilters"
                class="flex items-center justify-between text-base gap-2"
              >
                <div
                  class="
                    cursor-pointer
                    w-4
                    h-4
                    flex
                    items-center
                    justify-center
                    text-gray-600
                    hover:text-gray-800
                    rounded-md
                    group
                  "
                >
                  <span class="hidden group-hover:inline-block">
                    <feather-icon
                      name="x"
                      class="w-4 h-4 cursor-pointer"
                      :button="true"
                      @click="removeFilter(filter)"
                    />
                  </span>
                  <span class="group-hover:hidden">
                    {{ i + 1 }}
                  </span>
                </div>
                <FormControl
                  :border="true"
                  size="small"
                  class="w-24"
                  :df="{
                    placeholder: t`Field`,
                    fieldname: 'fieldname',
                    fieldtype: 'Select',
                    options: fieldOptions,
                  }"
                  :value="filter.fieldname"
                  @change="(value) => (filter.fieldname = value)"
                />
                <FormControl
                  :border="true"
                  size="small"
                  class="w-24"
                  :df="{
                    placeholder: t`Condition`,
                    fieldname: 'condition',
                    fieldtype: 'Select',
                    options: conditions,
                  }"
                  :value="filter.condition"
                  @change="(value) => (filter.condition = value)"
                />
                <FormControl
                  :border="true"
                  size="small"
                  class="w-24"
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
            p-2
            flex
            items-center
            text-gray-600
            cursor-pointer
            hover:bg-gray-100
          "
          @click="addNewFilter"
        >
          <feather-icon name="plus" class="w-4 h-4" />
          <span class="ms-2">{{ t`Add a filter` }}</span>
        </div>
      </div>
    </template>
  </Popover>
</template>

<script>
import { t } from 'fyo';
import { FieldTypeEnum } from 'schemas/types';
import { fyo } from 'src/initFyo';
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
  props: { schemaName: String },
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
      const df = this.fields[0];
      if (!df) {
        return;
      }

      this.addFilter(df.fieldname, 'like', '', false);
    },
    addFilter(fieldname, condition, value, implicit) {
      this.filters.push({ fieldname, condition, value, implicit: !!implicit });
    },
    removeFilter(filter) {
      this.filters = this.filters.filter((f) => f !== filter);
    },
    setFilter(filters, implicit) {
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

        this.addFilter(fieldname, condition, value, implicit);
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
    fields() {
      const excludedFieldsTypes = [
        FieldTypeEnum.Table,
        FieldTypeEnum.AttachImage,
      ];
      return fyo.schemaMap[this.schemaName].fields.filter(
        (f) =>
          f.filter ||
          (!f.computed &&
            !excludedFieldsTypes.includes(f.fieldtype) &&
            !f.meta &&
            !f.readOnly)
      );
    },
    fieldOptions() {
      return this.fields.map((df) => ({
        label: df.label,
        value: df.fieldname,
      }));
    },
    conditions() {
      return conditions;
    },
    explicitFilters() {
      return this.filters.filter((f) => !f.implicit);
    },
    activeFilterCount() {
      return this.explicitFilters.filter((filter) => filter.value).length;
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
