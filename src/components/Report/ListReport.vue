<template>
  <div class="overflow-hidden flex flex-col h-full">
    <!-- Report Outer Container -->
    <div class="overflow-hidden" v-if="dataSlice.length">
      <!--Title Row -->
      <div
        class="w-full overflow-x-hidden flex items-center border-b px-4"
        ref="titlerow"
        :style="{
          height: `${hconst}px`,
          paddingRight: 'calc(var(--w-scrollbar) + 1rem)',
        }"
      >
        <div
          v-for="(col, c) in report.columns"
          :key="c + '-col'"
          :style="getCellStyle(col, c)"
          class="
            text-gray-600 text-base
            px-3
            flex-shrink-0
            overflow-x-auto
            whitespace-nowrap
          "
        >
          {{ col.label }}
        </div>
      </div>

      <WithScroll
        class="overflow-auto w-full"
        style="height: calc(100% - 49px)"
        @scroll="scroll"
      >
        <!-- Report Rows -->
        <template v-for="(row, r) in dataSlice" :key="r + '-row'">
          <div
            v-if="!row.folded"
            class="flex items-center w-max px-4"
            :style="{
              height: `${hconst}px`,
              minWidth: `calc(var(--w-desk) - var(--w-scrollbar))`,
            }"
            :class="[
              r !== pageEnd - 1 ? 'border-b' : '',
              row.isGroup ? 'hover:bg-gray-50 cursor-pointer' : '',
            ]"
            @click="() => onRowClick(row, r)"
          >
            <!-- Report Cell -->
            <div
              v-for="(cell, c) in row.cells"
              :key="`${c}-${r}-cell`"
              :style="getCellStyle(cell, c)"
              class="
                text-gray-900 text-base
                px-3
                flex-shrink-0
                overflow-x-auto
                whitespace-nowrap
              "
            >
              {{ cell.value }}
            </div>
          </div>
        </template>
      </WithScroll>
      <!-- Report Rows Container -->
    </div>
    <p v-else class="w-full text-center mt-20 text-gray-800 text-base">
      {{ report.loading ? t`Loading Report...` : t`No Values to be Displayed` }}
    </p>

    <!-- Pagination Footer -->
    <div class="mt-auto flex-shrink-0" v-if="report.usePagination">
      <hr />
      <Paginator
        :item-count="report?.reportData?.length ?? 0"
        class="px-4"
        @index-change="setPageIndices"
      />
    </div>
    <div v-else class="h-4" />
  </div>
</template>
<script>
import { Report } from 'reports/Report';
import { FieldTypeEnum } from 'schemas/types';
import { defineComponent } from 'vue';
import Paginator from '../Paginator.vue';
import WithScroll from '../WithScroll.vue';

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
  computed: {
    dataSlice() {
      if (this.report?.usePagination) {
        return this.report.reportData.slice(this.pageStart, this.pageEnd);
      }

      return this.report.reportData;
    },
  },
  methods: {
    scroll({ scrollLeft }) {
      this.$refs.titlerow.scrollLeft = scrollLeft;
    },
    setPageIndices({ start, end }) {
      this.pageStart = start;
      this.pageEnd = end;
    },
    onRowClick(clickedRow, r) {
      if (!clickedRow.isGroup) {
        return;
      }

      r += 1;
      clickedRow.foldedBelow = !clickedRow.foldedBelow;
      const folded = clickedRow.foldedBelow;
      let row = this.dataSlice[r];

      while (row && row.level > clickedRow.level) {
        row.folded = folded;
        r += 1;
        row = this.dataSlice[r];
      }
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
        styles['font-style'] = 'oblique 15deg';
      }

      if (i === 0) {
        styles['padding-left'] = '0px';
      }

      if (
        !cell.align &&
        [
          FieldTypeEnum.Currency,
          FieldTypeEnum.Int,
          FieldTypeEnum.Float,
        ].includes(cell.fieldtype)
      ) {
        styles['text-align'] = 'right';
      }

      if (i === this.report.columns.length - 1) {
        styles['padding-right'] = '0px';
      }

      if (cell.indent) {
        styles['padding-left'] = `${cell.indent * 2}rem`;
      }

      if (cell.color === 'red') {
        styles['color'] = '#e53e3e';
      } else if (cell.color === 'green') {
        styles['color'] = '#38a169';
      }

      return styles;
    },
  },
  components: { Paginator, WithScroll },
});
</script>
