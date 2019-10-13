<template>
  <div class="relative" v-on-outside-click="() => showDropdown = false">
    <input
      ref="input"
      :class="inputClasses"
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
      class="mt-1 absolute left-0 z-10 bg-white rounded-5px border w-full min-w-56"
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
        >
          <component :is="s.component" v-if="s.component" />
          <template v-else>{{ s.label }}</template>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import Base from './Base';

export default {
  name: 'AutoComplete',
  extends: Base,
  components: {},
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
  computed: {},
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
      keyword = keyword.toLowerCase();
      let list = this.df.getList();
      return list
        .map(d => {
          if (typeof d === 'string') {
            return {
              label: d,
              value: d
            };
          }
          return d;
        })
        .filter(d => {
          let key = keyword.toLowerCase();
          return (
            d.label.toLowerCase().includes(keyword) ||
            d.value.toLowerCase().includes(keyword)
          );
        });
    },
    selectHighlightedItem() {
      if (![-1, this.suggestions.length].includes(this.highlightedIndex)) {
        // valid selection
        let suggestion = this.suggestions[this.highlightedIndex];
        this.setSuggestion(suggestion);
      }
    },
    selectItem(suggestion) {
      if (suggestion.action) {
        suggestion.action();
        return;
      }
      this.setSuggestion(suggestion);
    },
    setSuggestion(suggestion) {
      this.triggerChange(suggestion.value);
      this.showDropdown = false;
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
