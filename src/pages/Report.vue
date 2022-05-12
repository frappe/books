<template>
  <div class="flex flex-col w-full h-full">
    <PageHeader :title="title">
      <!-- 
      <DropdownWithActions
        v-for="group of actionGroups"
        :key="group.label"
        :type="group.type"
        :actions="group.actions"
        class="text-xs"
      >
        {{ group.label }}
      </DropdownWithActions>
      <DropdownWithActions :actions="actions" />

     -->
    </PageHeader>

    <!-- Filters -->
    <div v-if="report" class="mx-4 grid grid-cols-5 gap-2">
      <FormControl
        v-for="field in report.filters"
        :show-label="field.fieldtype === 'Check'"
        :key="field.fieldname + '-filter'"
        class="bg-gray-100 rounded"
        :class="field.fieldtype === 'Check' ? 'flex pl-3' : ''"
        input-class="bg-transparent px-3 py-2 text-base"
        :df="field"
        :value="report.get(field.fieldname)"
        :read-only="loading"
        @change="async (value) => await report.set(field.fieldname, value)"
      />
    </div>

    <!-- Report Outer Container -->
    <div
      v-if="report"
      class="mx-4 mt-4 overflow-x-scroll inline-block overflow-y-hidden"
    >
      <div class="inline-block">
        <!-- Title Row -->
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

        <!-- Report Rows Continer -->
        <div
          class="overflow-y-scroll"
          :style="{ height: `${hconst * maxRows + 5}px` }"
        >
          <!-- Report Rows -->
          <div
            v-for="(row, r) in report.reportData"
            :key="r + '-row'"
            class="border-b flex items-center"
            :style="{ height: `${hconst}px` }"
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
        </div>
      </div>
    </div>
    <div class="h-10 mx-4 mb-4 p-2 bg-red-100 text-base border-t">
      add pagination here
    </div>
  </div>
</template>
<script>
import { reports } from 'reports';
import FormControl from 'src/components/Controls/FormControl.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    reportName: String,
  },
  data() {
    return {
      wconst: 8,
      hconst: 48,
      loading: false,
      report: null,
    };
  },
  components: { PageHeader, FormControl },
  async mounted() {
    await this.setReportData();
  },
  async activated() {
    await this.setReportData();
    if (fyo.store.isDevelopment) {
      window.rep = this;
    }
  },
  computed: {
    maxRows() {
      return 18 - Math.ceil(this.report.filters.length / 5);
    },
    title() {
      return reports[this.reportName]?.title ?? t`Report`;
    },
  },
  methods: {
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
    async setReportData() {
      const Report = reports[this.reportName];
      if (this.report === null) {
        this.report = new Report(fyo);
      }

      if (!this.report.reportData.length) {
        await this.report.setReportData();
      }
    },
  },
});
</script>
