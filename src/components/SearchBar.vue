<template>
  <div v-on-outside-click="clearInput" class="relative">
    <Dropdown :items="suggestions" class="text-sm h-full">
      <template
        v-slot="{
          toggleDropdown,
          highlightItemUp,
          highlightItemDown,
          selectHighlightedItem,
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
            :placeholder="t`Search...`"
            autocomplete="off"
            spellcheck="false"
            v-model="inputValue"
            @input="
              () => {
                search();
                toggleDropdown(true);
              }
            "
            ref="input"
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
import { t } from 'fyo';
import reports from 'reports/view';
import Dropdown from 'src/components/Dropdown';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';


export default {
  data() {
    return {
      inputValue: '',
      searchList: [],
      suggestions: [],
    };
  },
  components: {
    Dropdown,
  },
  emits: ['change'],
  mounted() {
    this.makeSearchList();
  },
  methods: {
    async search() {
      this.suggestions = this.searchList.filter((d) => {
        let key = this.inputValue.toLowerCase();
        return d.label.toLowerCase().includes(key);
      });

      if (this.suggestions.length === 0) {
        this.suggestions = [{ label: t`No results found.` }];
      }
    },
    clearInput() {
      this.inputValue = '';
      this.$emit('change', null);
    },
    async makeSearchList() {
      const doctypes = this.getDoctypes();
      const reports = this.getReports();
      const views = this.getViews();

      let searchList = [...doctypes, ...reports, ...views];
      this.searchList = searchList.map((d) => {
        if (d.route) {
          d.action = () => routeTo(d.route);
          this.inputValue = '';
        }
        return d;
      });
    },
    getDoctypes() {
      let doctypes = Object.keys(fyo.models).sort();
      let doctypeMetas = doctypes.map((doctype) => fyo.getMeta(doctype));
      let searchableDoctypes = doctypeMetas.filter((meta) => {
        return !meta.isSingle && !meta.isChild;
      });
      return searchableDoctypes.map((meta) => {
        return {
          label: meta.label || meta.name,
          route: `/list/${meta.name}`,
          group: 'List',
        };
      });
    },
    getReports() {
      return Object.values(reports).map((report) => {
        return {
          label: report.title,
          route: `/report/${report.method}`,
          group: 'Reports',
        };
      });
    },
    getViews() {
      return [
        {
          label: t`Chart of Accounts`,
          route: '/chartOfAccounts',
          group: 'List',
        },
      ];
    },
  },
};
</script>
<style scoped>
input[type='search']::-webkit-search-decoration,
input[type='search']::-webkit-search-cancel-button,
input[type='search']::-webkit-search-results-button,
input[type='search']::-webkit-search-results-decoration {
  display: none;
}
</style>
