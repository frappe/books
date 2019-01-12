<template>
  <div id="exportWizard" class="modal-body">
    <!-- <div class="row mt-2">
      <div class="col-10 text-left">
        <h5> Export {{ this.title }} </h5>
      </div>
      <div class="col-2 text-right">
        <f-button primary @click="save">{{ 'Export' }}</f-button>
      </div>
    </div> -->
    <div class="ml-4 col-6 text-left">
      <input
        id="select-cbox"
        @change="toggleSelect"
        class="form-check-input"
        type="checkbox"
        v-model="selectAllFlag"
      >
      <label class="form-check-label bold ml-2" for="select-cbox">{{ "Select/Clear All" }}</label>
    </div>
    <hr width="93%">
    <div class="row ml-4 mb-4">
      <div v-for="column in columns" :key="column.id" class="form-check mt-2 col-6">
        <input :id="column.id" class="form-check-input" type="checkbox" v-model="column.checked">
        <label class="form-check-label" :for="column.id">{{ column.content }}</label>
      </div>
    </div>
    <hr>
    <div class="row">
      <div class="col-12 text-right">
        <f-button primary @click="save">{{ 'Download CSV' }}</f-button>
      </div>
    </div>
  </div>
</template>
<script>
import path from 'path';
const { writeFile } = require('frappejs/server/utils');
var FileSaver = require('file-saver');

export default {
  props: ['title', 'rows', 'columnData'],
  data() {
    return {
      selectAllFlag: true,
      columns: this.columnData
    };
  },
  methods: {
    toggleSelect() {
      this.columns = this.columns.map(column => {
        return {
          id: column.id,
          content: column.content,
          checked: this.selectAllFlag
        };
      });
    },
    close() {
      this.$modal.hide();
    },
    checkNoneSelected(columns) {
      console.log(columns);
      let selected = 0;
      columns.map(column => {
        if (column.checked) selected++;
      });
      if (selected) return false;
      else return true;
    },
    async save() {
      if (this.checkNoneSelected(this.columns)) {
        alert(
          `No columns have been selected.\n` +
            `Please select atleast one column to perform export.`
        );
      } else {
        let selectedColumnIds = this.columns.map(column => {
          if (column.checked) return column.id;
        });
        console.log(selectedColumnIds);
        let selectedColumns = this.columnData.filter(
          column => selectedColumnIds.indexOf(column.id) != -1
        );
        await this.exportData(this.rows, selectedColumns);
        this.$modal.hide();
      }
    },
    async exportData(rows = this.rows, columns = this.columnData) {
      let title = this.title;
      let columnNames = columns.map(column => column.content).toString();
      let columnIDs = columns.map(column => column.id);
      let rowData = rows.map(row => columnIDs.map(id => row[id]).toString());
      let csvDataArray = [columnNames, ...rowData];
      let csvData = csvDataArray.join('\n');
      let d = new Date();
      let fileName = [
        title.replace(/\s/g, '-'),
        [d.getDate(), d.getMonth(), d.getFullYear()].join('-'),
        `${d.getTime()}.csv`
      ].join('_');
      var blob = new Blob([csvData], { type: 'text/plain;charset=utf-8' });
      await FileSaver.saveAs(blob, fileName);
    }
  }
};
</script>
<style scoped>
.fixed-btn-width {
  width: 5vw !important;
}
.bold {
  font-size: 1.1rem;
  font-weight: 600;
}
#select-cbox {
  width: 15px;
  height: 15px;
}
#exportWizard {
 overflow: hidden;
}
</style>
