<template>
  <div class="overflow-hidden flex flex-col h-full">
    <!-- Report Outer Container -->
    <div class="overflow-x-scroll overflow-y-hidden">
      <!-- Title Row -->
      <div class="inline-block">
        <div
          class="flex items-center border-b"
          :style="{ height: `${hconst}px` }"
          ref="titleRow"
        >
          <p
            v-for="(col, c) in report.columns"
            :key="c + '-col'"
            :style="getCellStyle(col, c)"
            class="
              text-gray-600 text-base
              px-3
              flex-shrink-0
              overflow-x-scroll
              whitespace-nowrap
            "
          >
            {{ col.label }}
          </p>
        </div>
      </div>

      <!-- Report Rows Container -->
      <div
        class="overflow-y-scroll inline-block"
        style="height: calc(100% - 49px)"
      >
        <!-- Report Rows -->
        <div
          v-for="(row, r) in report.reportData.slice(pageStart, pageEnd)"
          :key="r + '-row'"
          class="flex items-center"
          :style="{ height: `${hconst}px` }"
          :class="r !== pageEnd - 1 ? 'border-b' : ''"
        >
          <!-- Report Cell -->
          <div
            v-for="(cell, c) in row"
            :key="`${c}-${r}-cell`"
            :style="getCellStyle(cell, c)"
            class="
              text-gray-900 text-base
              px-3
              flex-shrink-0
              overflow-x-scroll
              whitespace-nowrap
            "
          >
            {{ cell.value }}
          </div>
        </div>
        <!-- </div> -->
      </div>
    </div>

    <!-- Pagination Footer -->
    <div class="mt-auto flex-shrink-0">
      <hr />
      <Paginator
        :item-count="report?.reportData?.length ?? 0"
        @index-change="setPageIndices"
      />
    </div>
  </div>
</template>
<script>
import { Report } from 'reports/Report';
import { defineComponent } from 'vue';
import Paginator from '../Paginator.vue';

export default defineComponent({
  props: {
    report: Report,
  },
  data() {
    return {
      wconst: 8,
      hconst: 48,
      pageStart: 0,
      pageEnd: 0,
    };
  },
  methods: {
    setPageIndices({ start, end }) {
      this.pageStart = start;
      this.pageEnd = end;
    },
    getCellStyle(cell, i) {
      const styles = {};
      const width = cell.width ?? 1;
      const align = cell.align ?? 'left';
      styles['width'] = `${width * this.wconst}rem`;
      styles['text-align'] = align;
      if (cell.bold) {
        styles['font-weight'] = 'bold';
      }
      if (cell.italics) {
        styles['font-style'] = 'italic';
      }
      if (i === 0) {
        styles['padding-left'] = '0px';
      }
      if (i === this.report.columns.length - 1) {
        styles['padding-right'] = '0px';
      }
      return styles;
    },
  },
  components: { Paginator },
});
</script>
