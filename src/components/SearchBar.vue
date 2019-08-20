<template>
  <div v-on-outside-click="clearInput">
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text pt-1">
          <feather-icon name="search" style="color: #212529 !important;"></feather-icon>
        </span>
      </div>
      <input
        type="search"
        class="form-control"
        @click="focus(0)"
        @keydown.down="navigate('down')"
        @keydown.up="navigate('up')"
        placeholder="Search..."
        autocomplete="off"
        spellcheck="false"
        v-model="inputValue"
        @keydown.enter="searchOrSelect"
      />
    </div>
    <div v-if="inputValue" class="search-list position-absolute shadow-sm" style="width: 98%">
      <list-row
        v-for="(doc, i) in suggestion"
        :key="i+1"
        :ref="i+1"
        :route="doc.route"
        :class="{ 'seperator': doc.seperator, 'item-active': isFocused(i+1) && !doc.seperator }"
        class="d-flex align-items-center"
        @click.native="routeTo(doc.route)"
      >
        <div :class="doc.seperator ? 'small' : ''">{{ doc.name }}</div>
        <div class="small ml-auto">{{ doc.doctype }}</div>
      </list-row>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import ListRow from '../pages/ListView/ListRow';
import ListCell from '../pages/ListView/ListCell';

export default {
  data() {
    return {
      inputValue: '',
      suggestion: [],
      currentlyFocused: 0
    };
  },
  components: {
    ListRow,
    ListCell
  },
  watch: {
    inputValue() {
      if (!this.inputValue.length) this.suggestion = [];
    }
  },
  methods: {
    focus(key) {
      this.currentlyFocused = key % (this.suggestion.length + 1);
    },
    navigate(dir) {
      const seperatorIndexes = this.suggestion.map((item, i) => {
        if (item.seperator) return i;
      });
      let nextItem = this.currentlyFocused + (dir === 'up' ? -1 : 1);
      if (seperatorIndexes.includes(this.currentlyFocused)) {
        nextItem = this.currentlyFocused + (dir === 'up' ? -2 : 2);
      }
      this.focus(nextItem);
    },
    isFocused(i) {
      if (i === this.currentlyFocused) {
        return true;
      }
      return false;
    },
    async searchOrSelect() {
      if (this.currentlyFocused != 0) {
        this.routeTo(this.$refs[this.currentlyFocused][0].$attrs.route);
        return;
      }

      const searchableDoctypes = frappe.getDoctypeList({
        isSingle: 0,
        isChild: 0
      });
      const documents = await this.getDocuments(searchableDoctypes);
      const doctypes = this.getDoctypes(searchableDoctypes);
      const reports = this.getReports();
      this.suggestion = documents.concat(doctypes).concat(reports);
      if (this.suggestion.length === 0)
        this.suggestion = [{ seperator: true, name: 'No results found.' }];
    },
    clearInput(e) {
      this.inputValue = '';
      this.$emit('change', null);
    },
    async getDocuments(searchableDoctypes) {
      const promises = searchableDoctypes.map(doctype => {
        return frappe.db.getAll({
          doctype,
          filters: {
            name: ['includes', this.inputValue],
            keywords: ['like', this.inputValue]
          },
          fields: ['name']
        });
      });
      const data = await Promise.all(promises);
      // data contains list of documents, sorted according to position of its doctype in searchableDoctypes
      const items = [];
      items.push({
        seperator: true,
        name: 'Documents'
      });
      for (let i = 0; i < data.length; i++) {
        // i represents doctype position in searchableDoctypes
        if (data[i].length > 0) {
          for (let doc of data[i]) {
            let doctype = searchableDoctypes[i];
            items.push({
              doctype,
              name: doc.name,
              route: `/edit/${doctype}/${doc.name}`
            });
          }
        }
      }
      if (items.length !== 1) return items;
      return [];
    },
    getDoctypes(searchableDoctypes) {
      const items = [{ seperator: true, name: 'Lists' }];
      let filteredDoctypes = searchableDoctypes.filter(doctype => {
        return (
          doctype.toLowerCase().indexOf(this.inputValue.toLowerCase()) != -1
        );
      });
      filteredDoctypes = filteredDoctypes.map(doctype => {
        var titleCase = doctype.replace(/([A-Z])/g, ' $1');
        titleCase = titleCase.charAt(0).toUpperCase() + titleCase.slice(1);
        return {
          name: titleCase,
          route: `/list/${doctype}`
        };
      });
      if (filteredDoctypes.length > 0) return items.concat(filteredDoctypes);
      return [];
    },
    getReports() {
      const items = [{ seperator: true, name: 'Reports' }];
      let reports = require('../../reports/view');
      reports = Object.values(reports);
      let filteredReports = reports.filter(report => {
        return (
          report.title.toLowerCase().indexOf(this.inputValue.toLowerCase()) !=
          -1
        );
      });
      filteredReports = filteredReports.map(report => {
        return {
          name: report.title,
          route: `/report/${report.method}`
        };
      });
      if (filteredReports.length > 0) return items.concat(filteredReports);
      return [];
    },
    routeTo(route) {
      this.$router.push(route);
      this.inputValue = '';
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../styles/variables';
.input-group-text {
  background-color: var(--white);
  border-right: none;
}
.seperator {
  background-color: var(--light);
}

input {
  border-left: none;
  height: 27px;
}

input:focus {
  border: 1px solid #ced4da;
  border-left: none;
  outline: none !important;
  box-shadow: none !important;
}
.search-list {
  z-index: 2;
  max-height: 90vh;
  overflow: auto;
}

.item-active {
  background-color: var(--light);
}
</style>

