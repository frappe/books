<template>
  <Row
    :ratio="ratio"
    class="
      w-full
      px-2
      border-b
      hover:bg-gray-50
      h-row-mid
      group
      flex
      items-center
      justify-center
    "
  >
    <!-- Index or Remove button -->
    <div class="flex items-center pl-2 text-gray-600">
      <span class="hidden" :class="{ 'group-hover:inline-block': !readOnly }">
        <feather-icon
          name="x"
          class="w-4 h-4 -ml-1 cursor-pointer"
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
      :read-only="readOnly"
      :input-class="{ 'text-right': isNumeric(df), 'bg-transparent': true }"
      :key="df.fieldname"
      :df="df"
      :value="row[df.fieldname]"
      @change="(value) => onChange(df, value)"
      @new-doc="(doc) => row.set(df.fieldname, doc.name)"
    />

    <!-- Error Display -->
    <div
      class="text-sm text-red-600 mb-2 pl-2 col-span-full"
      v-if="Object.values(errors).filter(Boolean).length"
    >
      {{ getErrorString() }}
    </div>
  </Row>
</template>
<script>
import { Doc } from 'fyo/model/doc';
import Row from 'src/components/Row.vue';
import { getErrorMessage } from 'src/utils';
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
  },
  emits: ['remove'],
  components: {
    Row,
    FormControl,
  },
  data: () => ({ hovering: false, errors: {} }),
  beforeCreate() {
    this.$options.components.FormControl = FormControl;
  },
  provide() {
    return {
      schemaName: this.row.schemaName,
      name: this.row.name,
      doc: this.row,
    };
  },
  methods: {
    onChange(df, value) {
      if (value == null) {
        return;
      }

      this.errors[df.fieldname] = null;
      this.row.set(df.fieldname, value).catch((e) => {
        this.errors[df.fieldname] = getErrorMessage(e, this.row);
      });
    },
    getErrorString() {
      return Object.values(this.errors).filter(Boolean).join(' ');
    },
  },
};
</script>
