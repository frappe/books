<template>
  <div class="form-group" v-on-outside-click="onOutsideClick">
    <table class="table table-bordered" style="table-layout: fixed">
      <thead>
        <tr>
          <th scope="col" width="60">
            <input class="mr-2" type="checkbox" @change="toggleCheckAll" />
            <span>#</span>
          </th>
          <th scope="col" v-for="column in columns" :key="column.fieldname">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody v-if="rows.length">
        <tr v-for="(row, i) in rows" :key="i">
          <th scope="row">
            <input
              class="mr-2"
              type="checkbox"
              :checked="checkedRows.includes(i)"
              @change="e => onCheck(e, i)"
            />
            <span>{{ i + 1 }}</span>
          </th>
          <td
            v-for="column in columns"
            :key="column.fieldname"
            tabindex="1"
            :ref="column.fieldname + i"
            @click="activateFocus(i, column.fieldname)"
            @dblclick="activateEditing(i, column.fieldname)"
            @keydown.enter="enterPressOnCell()"
            @keydown.tab.exact.prevent="focusNextCell()"
            @keydown.shift.tab.exact.prevent="focusPreviousCell()"
            @keydown.left="focusPreviousCell()"
            @keydown.right="focusNextCell()"
            @keydown.up="focusAboveCell(i, column.fieldname)"
            @keydown.down="focusBelowCell(i, column.fieldname)"
            @keydown.esc="escOnCell(i, column.fieldname)"
          >
            <div
              class="table-cell"
              :class="{'active': isFocused(i, column.fieldname),'p-1': isEditing(i, column.fieldname)}"
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
              <div
                class="text-truncate"
                :data-fieldtype="column.fieldtype"
                v-else
              >{{ row[column.fieldname] || '&nbsp;' }}</div>
            </div>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td :colspan="columns.length + 1" class="text-center">
            <div class="table-cell">No Data</div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="table-actions" v-if="!disabled">
      <f-button danger @click="removeCheckedRows" v-if="checkedRows.length">Remove</f-button>
      <f-button secondary @click="addRow" v-if="!checkedRows.length">Add Row</f-button>
    </div>
  </div>
</template>

<script>
import Base from './Base';
import Observable from 'frappejs/utils/observable';

export default {
  extends: Base,
  data() {
    return {
      columns: [],
      checkedRows: [],
      currentlyEditing: {},
      currentlyFocused: {}
    };
  },
  mounted() {
    this.columns = this.getColumns();
  },
  methods: {
    escOnCell(i, fieldname) {
      this.deactivateEditing();
      this.activateFocus(i, fieldname);
    },
    enterPressOnCell() {
      const { index, fieldname } = this.currentlyFocused;
      if (this.isEditing(index, fieldname)) {
        // FIX: enter pressing on a cell with a value throws error.
        // Problem: input gets undefined on deactivating
        setTimeout(() => {
          this.deactivateEditing();
        }, 300);

        this.activateFocus(index, fieldname);
      } else {
        this.activateEditing(index, fieldname);
      }
    },
    focusPreviousCell() {
      let { index, fieldname } = this.currentlyFocused;
      if (
        this.isFocused(index, fieldname) &&
        !this.isEditing(index, fieldname)
      ) {
        let pos = this._getColumnIndex(fieldname);
        pos -= 1;
        if (pos < 0) {
          index -= 1;
          pos = this.columns.length - 1;
        }
        if (index < 0) {
          index = 0;
          pos = 0;
        }
        this.activateFocus(index, this.columns[pos].fieldname);
      }
    },
    focusNextCell() {
      let { index, fieldname } = this.currentlyFocused;
      if (
        this.isFocused(index, fieldname) &&
        !this.isEditing(index, fieldname)
      ) {
        let pos = this._getColumnIndex(fieldname);
        pos += 1;
        if (pos > this.columns.length - 1) {
          index += 1;
          pos = 0;
        }
        if (index > this.rows.length - 1) {
          index = this.rows.length - 1;
          pos = this.columns.length - 1;
        }
        this.activateFocus(index, this.columns[pos].fieldname);
      }
    },
    focusAboveCell(i, fieldname) {
      if (this.isFocused(i, fieldname) && !this.isEditing(i, fieldname)) {
        let pos = this._getColumnIndex(fieldname);
        i -= 1;
        if (i < 0) {
          i = 0;
        }
        this.activateFocus(i, this.columns[pos].fieldname);
      }
    },
    focusBelowCell(i, fieldname) {
      if (this.isFocused(i, fieldname) && !this.isEditing(i, fieldname)) {
        let pos = this._getColumnIndex(fieldname);
        i += 1;
        if (i > this.rows.length - 1) {
          i = this.rows.length - 1;
        }
        this.activateFocus(i, this.columns[pos].fieldname);
      }
    },
    _getColumnIndex(fieldname) {
      return this.columns.map(c => c.fieldname).indexOf(fieldname);
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
    toggleCheckAll() {
      if (this.checkedRows.length === this.rows.length) {
        this.checkedRows = [];
      } else {
        this.checkedRows = this.rows.map((row, i) => i);
      }
    },
    getDocfield(fieldname) {
      return this.meta.getField(fieldname);
    },
    isEditing(i, fieldname) {
      if (this.disabled) {
        return false;
      }
      return (
        this.currentlyEditing.index === i &&
        this.currentlyEditing.fieldname === fieldname
      );
    },
    isFocused(i, fieldname) {
      return (
        this.currentlyFocused.index === i &&
        this.currentlyFocused.fieldname === fieldname
      );
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
    activateFocus(i, fieldname) {
      if (this.isFocused(i, fieldname) && this.isEditing(i, fieldname)) {
        return;
      }
      // this.deactivateEditing();
      const docfield = this.columns.find(c => c.fieldname === fieldname);
      this.currentlyFocused = {
        index: i,
        fieldname
      };
      this.$refs[fieldname + i][0].focus();
    },
    deactivateEditing(i, _fieldname) {
      const { index, fieldname } = this.currentlyEditing;
      if (!(index === i && fieldname === _fieldname)) {
        this.currentlyEditing = {};
      }
    },
    deactivateFocus(i, _fieldname) {
      const { index, fieldname } = this.currentlyFocused;
      if (!(index === i && fieldname === _fieldname)) {
        this.currentlyFocused = {};
      }
    },
    async addRow() {
      const rows = this.rows.slice();
      const newRow = { idx: rows.length };

      for (let column of this.columns) {
        if (column.defaultValue) newRow[column.fieldname] = column.defaultValue;
        else newRow[column.fieldname] = null;
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
        return !indices.includes(i);
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
};
</script>
<style lang="scss" scoped>
td {
  padding: 0rem;
  outline: none;
}

.table-cell {
  padding: 0.75rem;
  border: 1px solid transparent;

  &.active {
    border: 1px solid var(--blue);
  }
}

.form-control {
  padding: 0;
  border: none;
  box-shadow: none;
  outline: none;
}

.form-group /deep/ .form-control {
  padding: 0;
  border: none;
  box-shadow: none;
  outline: none;
}

[data-fieldtype='Link'] .input-group-append {
  display: none;
}

[data-fieldtype='Currency'],
[data-fieldtype='Float'] {
  text-align: right !important;
}
</style>
