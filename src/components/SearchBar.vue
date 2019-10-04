<template>
  <div v-on-outside-click="clearInput" class="relative">
    <div class="rounded-lg relative flex items-center overflow-hidden">
      <div class="absolute ml-3">
        <feather-icon class="text-gray-500" name="search"></feather-icon>
      </div>
      <input
        type="search"
        class="bg-gray-200 text-sm p-2 pl-10 focus:outline-none"
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
    <div v-if="inputValue" class="absolute bg-white text-sm rounded shadow-md">
      <div
        v-for="(doc, i) in suggestion"
        :key="i+1"
        :ref="i+1"
        :route="doc.route"
        :class="{ 'border-t uppercase text-xs text-gray-600 mt-3 first:mt-0': doc.seperator, 'bg-gray-200': isFocused(i+1) && !doc.seperator }"
        class="px-3 py-2 rounded-lg"
        @click.native="routeTo(doc.route)"
      >
        <div :class="doc.seperator ? 'small' : ''">{{ doc.name }}</div>
        <!-- <div class="small ml-auto">{{ doc.doctype }}</div> -->
      </div>
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
