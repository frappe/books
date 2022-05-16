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
        size="small"
        :show-label="field.fieldtype === 'Check'"
        :key="field.fieldname + '-filter'"
        class="bg-gray-100 rounded"
        :class="field.fieldtype === 'Check' ? 'flex pl-2 py-1' : ''"
        input-class="bg-transparent text-sm"
        :df="field"
        :value="report.get(field.fieldname)"
        :read-only="loading"
        @change="async (value) => await report.set(field.fieldname, value)"
      />
    </div>

    <!-- Report Body -->
    <ListReport v-if="report" :report="report" class="mx-4 mt-4" />
  </div>
</template>
<script>
import { computed } from '@vue/reactivity';
import { t } from 'fyo';
import { reports } from 'reports';
import FormControl from 'src/components/Controls/FormControl.vue';
import PageHeader from 'src/components/PageHeader.vue';
import ListReport from 'src/components/Report/ListReport.vue';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    reportName: String,
  },
  data() {
    return {
      loading: false,
      report: null,
    };
  },
  provide() {
    return {
      report: computed(() => this.report),
    };
  },
  components: { PageHeader, FormControl, ListReport },
  async activated() {
    await this.setReportData();
    if (fyo.store.isDevelopment) {
      window.rep = this;
    }
  },
  computed: {
    title() {
      return reports[this.reportName]?.title ?? t`Report`;
    },
  },
  methods: {
    async setReportData() {
      const Report = reports[this.reportName];

      if (this.report === null) {
        this.report = new Report(fyo);
        await this.report.initialize();
      }

      if (!this.report.reportData.length) {
        await this.report.setReportData();
      }
    },
  },
});
</script>
