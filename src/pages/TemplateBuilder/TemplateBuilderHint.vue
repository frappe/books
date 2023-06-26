<template>
  <div :class="level > 0 ? 'ms-2 ps-2 border-l' : ''">
    <template v-for="r of rows" :key="r.key">
      <div
        class="
          flex
          gap-2
          text-sm text-gray-600
          whitespace-nowrap
          overflow-auto
          no-scrollbar
        "
        :class="[typeof r.value === 'object' ? 'cursor-pointer' : '']"
        @click="r.collapsed = !r.collapsed"
      >
        <div class="">{{ getKey(r) }}</div>
        <div v-if="!r.isCollapsible" class="font-semibold text-gray-800">
          {{ r.value }}
        </div>
        <div
          v-else-if="Array.isArray(r.value)"
          class="
            text-blue-600
            bg-blue-50
            border-blue-200 border
            tracking-tighter
            rounded
            text-xs
            px-1
          "
        >
          Array
        </div>
        <div
          v-else
          class="
            text-pink-600
            bg-pink-50
            border-pink-200 border
            tracking-tighter
            rounded
            text-xs
            px-1
          "
        >
          Object
        </div>

        <feather-icon
          v-if="r.isCollapsible"
          :name="r.collapsed ? 'chevron-up' : 'chevron-down'"
          class="w-4 h-4 ms-auto"
        />
      </div>
      <div v-if="!r.collapsed && typeof r.value === 'object'">
        <TemplateBuilderHint
          :prefix="getKey(r)"
          :hints="Array.isArray(r.value) ? r.value[0] : r.value"
          :level="level + 1"
        />
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import { PrintTemplateHint } from 'src/utils/printTemplates';
import { PropType } from 'vue';
import { defineComponent } from 'vue';
type HintRow = {
  key: string;
  value: PrintTemplateHint[string];
  isCollapsible: boolean;
  collapsed: boolean;
};
export default defineComponent({
  name: 'TemplateBuilderHint',
  props: {
    prefix: { type: String, default: '' },
    hints: {
      type: Object as PropType<PrintTemplateHint>,
      required: true,
    },
    level: { type: Number, default: 0 },
  },
  data() {
    return { rows: [] } as {
      rows: HintRow[];
    };
  },
  mounted() {
    this.rows = Object.entries(this.hints)
      .map(([key, value]) => ({
        key,
        value,
        isCollapsible: typeof value === 'object',
        collapsed: this.level > 0,
      }))
      .sort((a, b) => Number(a.isCollapsible) - Number(b.isCollapsible));
  },
  methods: {
    getKey(row: HintRow) {
      const isArray = Array.isArray(row.value);
      if (isArray) {
        return `${this.prefix}.${row.key}[number]`;
      }

      if (this.prefix.length) {
        return `${this.prefix}.${row.key}`;
      }

      return row.key;
    },
  },
});
</script>
