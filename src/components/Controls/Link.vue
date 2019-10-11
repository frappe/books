<template>
  <div class="relative" v-on-outside-click="() => showDropdown = false">
    <input
      ref="input"
      class="focus:outline-none w-full"
      :class="inputClass"
      type="text"
      :value="linkValue"
      :placeholder="placeholder"
      :readonly="df.readOnly"
      @focus="onFocus"
      @input="onInput"
      @keydown.up="highlightItemUp"
      @keydown.down="highlightItemDown"
      @keydown.enter="selectHighlightedItem"
      @keydown.tab="showDropdown = false"
      @keydown.esc="showDropdown = false"
    />
    <div
      class="mt-1 absolute left-0 z-10 bg-white rounded border w-full min-w-56"
      v-if="showDropdown"
    >
      <div class="p-1 max-h-64 overflow-auto" v-if="suggestions.length">
        <a
          ref="suggestionItems"
          class="block p-2 rounded mt-1 first:mt-0 cursor-pointer"
          v-for="(s, index) in suggestions"
          :key="s.value"
          :class="index === highlightedIndex ? 'bg-gray-200' : ''"
          @mouseenter="highlightedIndex = index"
          @mouseleave="highlightedIndex = -1"
          @click="selectItem(s)"
        >{{ s.label }}</a>
      </div>
      <div class="border-t p-1">
        <a
          class="block px-2 rounded mt-1 first:mt-0 cursor-pointer flex items-center"
          :class="{'bg-gray-200': highlightedIndex === suggestions.length, 'py-1': linkValue, 'py-2': !linkValue}"
          @mouseenter="highlightedIndex = suggestions.length"
          @mouseleave="highlightedIndex = -1"
          @click="openNewDoc"
        >
          <div>{{ _('Create') }}</div>
          <Badge color="blue" class="ml-2" v-if="isNewValue">{{ linkValue }}</Badge>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import Base from './Base';
import Badge from '@/components/Badge';

export default {
  name: 'Link',
  extends: Base,
  components: {
    Badge
  },
  data() {
    return {
      linkValue: '',
      showDropdown: false,
      suggestions: [],
      highlightedIndex: -1
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.linkValue = this.value;
      }
    }
  },
  computed: {
    isNewValue() {
      let values = this.suggestions.map(d => d.value);
      return this.linkValue && !values.includes(this.linkValue);
    }
  },
  methods: {
    async updateSuggestions(e) {
      let keyword;
      if (e) {
        keyword = e.target.value;
        this.linkValue = keyword;
      }
      this.suggestions = await this.getSuggestions(keyword);
    },
    async getSuggestions(keyword = '') {
      let doctype = this.df.target;
      let meta = frappe.getMeta(doctype);
      let filters = await this.getFilters(keyword);
      if (keyword && !filters.keywords) {
        filters.keywords = ['like', keyword];
      }
      let results = await frappe.db.getAll({
        doctype,
        filters,
        fields: [...new Set(['name', meta.titleField, ...meta.keywordFields])]
      });
      return results.map(r => {
        return { label: r[meta.titleField], value: r.name };
      });
    },
    async getFilters(keyword) {
      let doc = await frappe.getDoc(this.doctype, this.name);
      return this.df.getFilters ? await this.df.getFilters(keyword, doc) : {};
    },
    selectHighlightedItem() {
      if (![-1, this.suggestions.length].includes(this.highlightedIndex)) {
        // valid selection
        let suggestion = this.suggestions[this.highlightedIndex];
        this.setSuggestion(suggestion);
      } else if (this.highlightedIndex === this.suggestions.length) {
        // create new
        this.openNewDoc();
      }
    },
    selectItem(suggestion) {
      this.setSuggestion(suggestion);
    },
    setSuggestion(suggestion) {
      this.triggerChange(suggestion.value);
      this.showDropdown = false;
    },
    async openNewDoc() {
      let doctype = this.df.target;
      let doc = await frappe.getNewDoc(doctype);
      let currentPath = this.$route.path;
      let currentQuery = this.$route.query;
      let filters = await this.getFilters();
      this.$router.push({
        path: currentPath,
        query: {
          edit: 1,
          doctype,
          name: doc.name,
          values: Object.assign({}, filters, {
            name: this.linkValue
          })
        }
      });
      doc.once('afterInsert', () => {
        this.$emit('new-doc', doc);
        this.$router.go(-1);
      });
    },
    onFocus() {
      this.showDropdown = true;
      this.updateSuggestions();
    },
    onInput(e) {
      this.showDropdown = true;
      this.updateSuggestions(e);
    },
    highlightItemUp() {
      this.highlightedIndex -= 1;
      if (this.highlightedIndex < 0) {
        this.highlightedIndex = 0;
      }
      this.$nextTick(() => {
        let index = this.highlightedIndex;
        if (index !== 0) {
          index -= 1;
        }
        let highlightedElement = this.$refs.suggestionItems[index];
        highlightedElement && highlightedElement.scrollIntoView();
      });
    },
    highlightItemDown() {
      this.highlightedIndex += 1;
      if (this.highlightedIndex > this.suggestions.length) {
        this.highlightedIndex = this.suggestions.length;
      }

      this.$nextTick(() => {
        let index = this.highlightedIndex;
        let highlightedElement = this.$refs.suggestionItems[index];
        highlightedElement && highlightedElement.scrollIntoView();
      });
    }
  }
};
</script>
