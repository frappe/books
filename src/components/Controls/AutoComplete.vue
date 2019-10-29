<template>
  <Dropdown :items="suggestions">
    <template
      v-slot="{ toggleDropdown, highlightItemUp, highlightItemDown, selectHighlightedItem }"
    >
      <input
        ref="input"
        :class="inputClasses"
        type="text"
        :value="linkValue"
        :placeholder="inputPlaceholder"
        :readonly="df.readOnly"
        @focus="e => onFocus(e, toggleDropdown)"
        @input="onInput"
        @keydown.up="highlightItemUp"
        @keydown.down="highlightItemDown"
        @keydown.enter="selectHighlightedItem"
        @keydown.tab="toggleDropdown(false)"
        @keydown.esc="toggleDropdown(false)"
      />
    </template>
  </Dropdown>
</template>

<script>
import frappe from 'frappejs';
import Base from './Base';
import Dropdown from '@/components/Dropdown';

export default {
  name: 'AutoComplete',
  extends: Base,
  components: {
    Dropdown
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
        this.linkValue = newValue;
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
      let suggestions = await this.getSuggestions(keyword);
      this.suggestions = suggestions.map(d => {
        if (!d.action) {
          d.action = () => this.setSuggestion(d);
        }
        return d;
      });
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
    setSuggestion(suggestion) {
      this.linkValue = suggestion.value;
      this.triggerChange(suggestion.value);
      this.toggleDropdown(false);
    },
    onFocus(e, toggleDropdown) {
      this.toggleDropdown = toggleDropdown;
      this.toggleDropdown(true);
      this.updateSuggestions();
    },
    onInput(e) {
      this.toggleDropdown(true);
      this.updateSuggestions(e);
    }
  }
};
</script>
