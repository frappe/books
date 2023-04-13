<template>
  <Row
    :ratio="ratio"
    class="w-full px-2 group flex items-center justify-center h-row-mid"
    :class="readOnly ? '' : 'hover:bg-gray-25'"
  >
    <!-- Index or Remove button -->
    <div class="flex items-center ps-2 text-gray-600">
      <span class="hidden" :class="{ 'group-hover:inline-block': !readOnly }">
        <feather-icon
          name="x"
          class="w-4 h-4 -ms-1 cursor-pointer"
          :button="true"
          @click="$emit('remove')"
        />
      </span>
      <span :class="{ 'group-hover:hidden': !readOnly }">
        {{ row.idx + 1 }}
      </span>
    </div>

    <!-- Data Input Form Control -->
    <FormControl
      v-for="df in tableFields"
      :size="size"
      :key="df.fieldname"
      :df="df"
      :value="row[df.fieldname]"
      @change="(value) => onChange(df, value)"
    />
    <Button
      :icon="true"
      :padding="false"
      :background="false"
      @click="openRowQuickEdit"
      v-if="canEditRow"
    >
      <feather-icon name="edit" class="w-4 h-4 text-gray-600" />
    </Button>

    <!-- Error Display -->
    <div
      class="text-xs text-red-600 ps-2 col-span-full relative"
      style="bottom: 0.75rem; height: 0px"
      v-if="hasErrors"
    >
      {{ getErrorString() }}
    </div>
  </Row>
</template>
<script>
import { Doc } from 'fyo/model/doc';
import Row from 'src/components/Row.vue';
import { getErrorMessage } from 'src/utils';
import { computed, nextTick } from 'vue';
import Button from '../Button.vue';
import FormControl from './FormControl.vue';

export default {
  name: 'TableRow',
  props: {
    row: Doc,
    tableFields: Array,
    size: String,
    ratio: Array,
    isNumeric: Function,
    readOnly: Boolean,
    canEditRow: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['remove', 'change'],
  components: {
    Row,
    FormControl,
    Button,
  },
  data: () => ({ hovering: false, errors: {} }),
  beforeCreate() {
    this.$options.components.FormControl = FormControl;
  },
  provide() {
    return {
      doc: computed(() => this.row),
    };
  },
  computed: {
    hasErrors() {
      return Object.values(this.errors).filter(Boolean).length;
    },
  },
  methods: {
    async onChange(df, value) {
      const fieldname = df.fieldname;
      this.errors[fieldname] = null;
      const oldValue = this.row[fieldname];

      try {
        await this.row.set(fieldname, value);
        this.$emit('change', df, value);
      } catch (e) {
        this.errors[fieldname] = getErrorMessage(e, this.row);
        this.row[fieldname] = '';
        nextTick(() => (this.row[fieldname] = oldValue));
      }
    },
    getErrorString() {
      return Object.values(this.errors).filter(Boolean).join(' ');
    },
    openRowQuickEdit() {
      if (!this.row) {
        return;
      }

      this.$parent.$emit('editrow', this.row);
    },
  },
};
</script>
