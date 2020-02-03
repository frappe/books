<template>
  <Dropdown :items="suggestions" :is-loading="isLoading">
    <template
      v-slot="{
        toggleDropdown,
        highlightItemUp,
        highlightItemDown,
        selectHighlightedItem
      }"
    >
      <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
        {{ df.label }}
      </div>
      <input
        ref="input"
        :class="inputClasses"
        type="text"
        :value="linkValue"
        :placeholder="inputPlaceholder"
        :readonly="isReadOnly"
        @focus="e => onFocus(e, toggleDropdown)"
        @blur="e => onBlur(e.target.value)"
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
      isLoading: false,
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
      this.isLoading = true;
      let suggestions = await this.getSuggestions(keyword);
      this.suggestions = suggestions.map(d => {
        if (!d.action) {
          d.action = () => this.setSuggestion(d);
        }
        return d;
      });
      this.isLoading = false;
    },
    async getSuggestions(keyword = '') {
      keyword = keyword.toLowerCase();

      let list = this.df.getList
        ? await this.df.getList()
        : this.df.options || [];

      let items = list.map(d => {
        if (typeof d === 'string') {
          return {
            label: d,
            value: d
          };
        }
        return d;
      });

      if (!keyword) {
        return items;
      }

      return items.filter(d => {
        let key = keyword.toLowerCase();
        return (
          d.label.toLowerCase().includes(key) ||
          d.value.toLowerCase().includes(key)
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
      this.$emit('focus', e);
    },
    onBlur(value) {
      if (value === '' || value == null) {
        this.triggerChange('');
      }
    },
    onInput(e) {
      this.toggleDropdown(true);
      this.updateSuggestions(e);
    }
  }
};
</script>
