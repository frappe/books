<template>
  <div class="flex flex-col w-full h-full">
    <PageHeader :title="title">
      <DropdownWithActions
        v-for="group of groupedActions"
        :icon="false"
        :key="group.label"
        :type="group.type"
        :actions="group.actions"
        class="text-xs"
      >
        {{ group.group }}
      </DropdownWithActions>
    </PageHeader>

    <!-- Filters -->
    <div
      v-if="report && report.filters.length"
      class="grid grid-cols-5 gap-4 p-4 border-b"
    >
      <FormControl
        v-for="field in report.filters"
        :border="true"
        size="small"
        :class="[field.fieldtype === 'Check' ? 'self-end' : '']"
        :show-label="true"
        :key="field.fieldname + '-filter'"
        :df="field"
        :value="report.get(field.fieldname)"
        :read-only="loading"
        @change="async (value) => await report.set(field.fieldname, value)"
      />
    </div>

    <!-- Report Body -->
    <ListReport v-if="report" :report="report" class="" />
  </div>
</template>
<script>
import { computed } from '@vue/reactivity';
import { t } from 'fyo';
import { reports } from 'reports';
import FormControl from 'src/components/Controls/FormControl.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import PageHeader from 'src/components/PageHeader.vue';
import ListReport from 'src/components/Report/ListReport.vue';
import { fyo } from 'src/initFyo';
import { docsPathMap } from 'src/utils/misc';
import { docsPathRef } from 'src/utils/refs';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    reportClassName: String,
    defaultFilters: {
      type: String,
      default: '{}',
    },
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
  components: { PageHeader, FormControl, ListReport, DropdownWithActions },
  async activated() {
    docsPathRef.value = docsPathMap[this.reportClassName] ?? docsPathMap.Reports;
    await this.setReportData();

    const filters = JSON.parse(this.defaultFilters);
    const filterKeys = Object.keys(filters);
    for (const key of filterKeys) {
      await this.report.set(key, filters[key]);
    }

    if (filterKeys.length) {
      await this.report.updateData();
    }

    if (fyo.store.isDevelopment) {
      window.rep = this;
    }
  },
  deactivated() {
    docsPathRef.value = '';
  },
  computed: {
    title() {
      return reports[this.reportClassName]?.title ?? t`Report`;
    },
    groupedActions() {
      const actions = this.report?.getActions() ?? [];
      const actionsMap = actions.reduce((acc, ac) => {
        if (!ac.group) {
          ac.group = 'none';
        }

        acc[ac.group] ??= {
          group: ac.group,
          label: ac.label ?? '',
          e: ac.type,
          actions: [],
        };

        acc[ac.group].actions.push(ac);
        return acc;
      }, {});

      return Object.values(actionsMap);
    },
  },
  methods: {
    async setReportData() {
      const Report = reports[this.reportClassName];

      if (this.report === null) {
        this.report = new Report(fyo);
        await this.report.initialize();
      }

      if (!this.report.reportData.length) {
        await this.report.setReportData();
      } else if (this.report.shouldRefresh) {
        await this.report.setReportData(undefined, true);
      }
    },
  },
});
</script>
