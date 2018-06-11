<template>
    <div>
        <div class="p-4">
            <h4 class="pb-2">{{ reportName }}</h4>
            <report-filters v-if="reportConfig.filterFields.length" :filters="reportConfig.filterFields" @change="getReportData"></report-filters>
            <div class="pt-2" ref="datatable" v-once></div>
        </div>
        <not-found v-if="!reportConfig" />
    </div>
</template>
<script>
import DataTable from 'frappe-datatable'
import frappe from 'frappejs'
import FrappeControl from './controls/FrappeControl'
import ReportFilters from './ReportFilters'
import utils from 'frappejs/client/ui/utils'
import getReportViewConfig from '../../reports/view'

export default {
    props: ['reportName'],
    data() {
        return {
            'reportConfig': getReportViewConfig[this.reportName]
        }
    },
    computed: {
        reportColumns() {
            return utils.convertFieldsToDatatableColumns(this.reportConfig.getColumns())
        }
    },
    methods: {
        getReportData(filters) {
            frappe.methods[this.reportConfig.method](filters).then(data => {
                if (this.datatable) {
                    this.datatable.refresh(data || [])
                } else {
                    this.datatable = new DataTable(this.$refs.datatable, {
                        columns: this.reportColumns,
                        data: data || [],
                    });
                }
            })
        }
    },
    components: {
        FrappeControl,
        ReportFilters,
    }
}
</script>
<style>
</style>
