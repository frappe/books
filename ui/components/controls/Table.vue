<template>
  <div class="form-group" v-on-outside-click="onOutsideClick">
    <table class="table table-bordered" style="table-layout: fixed">
      <thead>
        <tr>
          <th scope="col" width="60">
            <input class="mr-2" type="checkbox">
            <span>#</span>
          </th>
          <th scope="col" v-for="column in columns" :key="column.fieldname">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody v-if="rows.length">
        <tr v-for="(row, i) in rows" :key="i">
          <th scope="row">
            <input class="mr-2" type="checkbox" @change="e => onCheck(e, i)">
            <span>{{ i + 1 }}</span>
          </th>
          <td v-for="column in columns" :key="column.fieldname"
            @dblclick="activateEditing(i, column.fieldname)"
            @click="deactivateEditing(i, column.fieldname)"
            @keydown.shift.tab="shiftTabPressOnCell(i, column.fieldname)"
            @keydown.tab="tabPressOnCell(i, column.fieldname)"
            @keydown.enter="enterPressOnCell(i, column.fieldname)"
          >
            <frappe-control
              v-if="isEditing(i, column.fieldname)"
              :docfield="getDocfield(column.fieldname)"
              :value="row[column.fieldname]"
              :onlyInput="true"
              :doc="row"
              :autofocus="true"
              @change="onCellChange(i, column.fieldname, $event)"
            />
            <span v-else>
              {{ row[column.fieldname] }}
            </span>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td :colspan="columns.length + 1" class="text-center">
            No Data
          </td>
        </tr>
      </tbody>
    </table>
    <div class="table-actions" v-if="!disabled">
      <f-button danger @click="removeCheckedRows" v-if="checkedRows.length">Remove</f-button>
      <f-button light @click="addRow" v-if="!checkedRows.length">Add Row</f-button>
    </div>
  </div>
</template>

<script>
// import ModelTable from '../ModelTable';
import Base from './Base';
import Observable from 'frappejs/utils/observable';

export default {
  extends: Base,
  data() {
    return {
      columns: [],
      checkedRows: [],
      currentlyEditing: {}
    }
  },
  mounted() {
    this.columns = this.getColumns();
  },
  methods: {
    enterPressOnCell(i, fieldname) {
      this.deactivateEditing();
    },
    shiftTabPressOnCell(i, fieldname) {
      if (this.isEditing(i, fieldname)) {
        let pos = this.columns.map(c => c.fieldname).indexOf(fieldname);
        pos = pos - 1;
        this.activateEditing(i, this.columns[pos].fieldname);
      }
    },
    tabPressOnCell(i, fieldname) {
      if (this.isEditing(i, fieldname)) {
        let pos = this.columns.map(c => c.fieldname).indexOf(fieldname);
        pos = pos + 1;
        this.activateEditing(i, this.columns[pos].fieldname);
      }
    },
    onOutsideClick(e) {
      this.deactivateEditing();
    },
    onCheck(e, idx) {
      if (e.target.checked) {
        this.checkedRows.push(idx);
      } else {
        this.checkedRows = this.checkedRows.filter(i => i !== idx);
      }
    },
    getDocfield(fieldname) {
      return this.meta.getField(fieldname);
    },
    isEditing(i, fieldname) {
      if (this.disabled) {
        return false;
      }
      return this.currentlyEditing.index === i &&
        this.currentlyEditing.fieldname === fieldname;
    },
    activateEditing(i, fieldname) {
      const docfield = this.columns.find(c => c.fieldname === fieldname);
      if (docfield.readOnly || docfield.disabled) {
        return;
      }
      this.currentlyEditing = {
        index: i,
        fieldname
      };
    },
    deactivateEditing(i, _fieldname) {
      const { index, fieldname } = this.currentlyEditing;
      if (!(index === i && fieldname === _fieldname)) {
        this.currentlyEditing = {};
      }
    },
    addRow() {
      const rows = this.rows.slice();
      const newRow = {
        idx: rows.length
      };

      for (let column of this.columns) {
        newRow[column.fieldname] = null;
      }

      rows.push(newRow);
      this.emitChange(rows, newRow);
    },
    removeCheckedRows() {
      this.removeRows(this.checkedRows);
      this.checkedRows = [];
    },
    removeRows(indices) {
      // convert to array
      if (!Array.isArray(indices)) {
        indices = [indices];
      }
      // convert string to number
      indices = indices.map(i => parseInt(i, 10));

      // make a copy
      let rows = this.rows.slice();
      rows = rows.filter((row, i) => {
        return !indices.includes(i)
      });

      this.emitChange(rows);
    },
    getRows() {
      return (this.docs || []).map((row, i) => {
        const doc = new Observable();
        doc.set('idx', i);
        for (let fieldname in row) {
          doc.set(fieldname, row[fieldname]);
        }
        return doc;
      });
    },
    getColumns() {
      const fieldsToShow = this.meta.fields.filter(df => !df.hidden);
      return fieldsToShow;
    },
    onCellChange(idx, fieldname, value) {
      const rows = this.value.slice();
      rows[idx][fieldname] = value;
      this.emitChange(rows, rows[idx]);
    },
    emitChange(rows, rowDoc) {
      this.$emit('change', rows, rowDoc);
    }
  },
  computed: {
    meta() {
      return frappe.getMeta(this.docfield.childtype);
    },
    rows() {
      return this.value;
    }
  }
}
</script>
<style>
.table .form-control {
  padding: 0;
  border: none;
  box-shadow: none;
  outline: none;
}

.table [data-fieldtype="Link"] .input-group-append {
  display: none;
}
</style>
