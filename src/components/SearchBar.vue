<template>
  <div v-on-outside-click="clearInput" class="relative">
    <Dropdown :items="suggestions" class="text-sm h-full">
      <template
        v-slot="{
          toggleDropdown,
          highlightItemUp,
          highlightItemDown,
          selectHighlightedItem
        }"
      >
        <div
          class="rounded-md relative flex items-center overflow-hidden h-full"
        >
          <div class="absolute flex justify-center w-8">
            <feather-icon name="search" class="w-3 h-3 text-gray-800" />
          </div>
          <input
            type="search"
            class="bg-gray-200 text-sm pl-8 focus:outline-none h-full w-56"
            placeholder="Search..."
            autocomplete="off"
            spellcheck="false"
            v-model="inputValue"
            @input="search"
            ref="input"
            @focus="$toggleDropdown = toggleDropdown"
            @keydown.up="highlightItemUp"
            @keydown.down="highlightItemDown"
            @keydown.enter="selectHighlightedItem"
            @keydown.tab="toggleDropdown(false)"
            @keydown.esc="toggleDropdown(false)"
          />
        </div>
      </template>
    </Dropdown>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Dropdown from '@/components/Dropdown';

export default {
  data() {
    return {
      inputValue: '',
      searchList: [],
      suggestions: [],
      $toggleDropdown: null
    };
  },
  components: {
    Dropdown
  },
  mounted() {
    this.makeSearchList();
  },
  methods: {
    async search() {
      this.$toggleDropdown && this.$toggleDropdown(true);

      this.suggestions = this.searchList.filter(d => {
        let key = this.inputValue.toLowerCase();
        return d.label.toLowerCase().includes(key);
      });

      if (this.suggestions.length === 0) {
        this.suggestions = [{ label: 'No results found.' }];
      }
    },
    clearInput() {
      this.inputValue = '';
      this.$emit('change', null);
    },
    makeSearchList() {
      const doctypes = this.getDoctypes();
      const reports = this.getReports();
      const views = this.getViews();

      let searchList = [...doctypes, ...reports, ...views];
      this.searchList = searchList.map(d => {
        if (d.route) {
          d.action = () => this.routeTo(d.route);
        }
        return d;
      });
    },
    getDoctypes() {
      let doctypes = Object.keys(frappe.models).sort();
      let doctypeMetas = doctypes.map(doctype => frappe.getMeta(doctype));
      let searchableDoctypes = doctypeMetas.filter(meta => {
        return !meta.isSingle && !meta.isChild;
      });
      return searchableDoctypes.map(meta => {
        return {
          label: meta.label || meta.name,
          route: `/list/${meta.name}`,
          group: 'List'
        };
      });
    },
    getReports() {
      let reports = require('../../reports/view');
      return Object.values(reports).map(report => {
        return {
          label: report.title,
          route: `/report/${report.method}`,
          group: 'Reports'
        };
      });
    },
    getViews() {
      return [
        {
          label: 'Chart of Accounts',
          route: '/chartOfAccounts',
          group: 'List'
        }
      ];
    },
    routeTo(route) {
      this.$router.push(route);
      this.inputValue = '';
    }
  }
};
</script>
