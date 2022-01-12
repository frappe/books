<template>
  <Dropdown :items="suggestions" :is-loading="isLoading" :df="df" :doc="doc">
    <template
      v-slot="{
        toggleDropdown,
        highlightItemUp,
        highlightItemDown,
        selectHighlightedItem,
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
        @focus="(e) => onFocus(e, toggleDropdown)"
        @blur="(e) => onBlur(e.target.value)"
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
import { fuzzyMatch } from '@/utils';

export default {
  name: 'AutoComplete',
  extends: Base,
  components: {
    Dropdown,
  },
  data() {
    return {
      linkValue: '',
      showDropdown: false,
      isLoading: false,
      suggestions: [],
      highlightedIndex: -1,
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.linkValue = newValue;
      },
    },
  },
  inject: {
    doc: { default: null },
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
      this.suggestions = suggestions.map((d) => {
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
        ? await this.df.getList(this.doc)
        : this.df.options || [];

      let items = list.map((d) => {
        if (typeof d === 'string') {
          return {
            label: d,
            value: d,
          };
        }
        return d;
      });

      if (!keyword) {
        return items;
      }

      return items
        .map((item) => ({ ...fuzzyMatch(keyword, item.value), item }))
        .filter(({ isMatch }) => isMatch)
        .sort((a, b) => a.distance - b.distance)
        .map(({ item }) => item);
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
    async onBlur(value) {
      if (value === '' || value == null) {
        this.triggerChange('');
        return;
      }

      if (value && this.suggestions.length === 0) {
        this.triggerChange(value);
        return;
      }

      if (
        value &&
        !this.suggestions.map(({ value }) => value).includes(value)
      ) {
        const suggestion = await this.getSuggestions(value);

        if (suggestion.length < 2) {
          this.linkValue = '';
          this.triggerChange('');
        } else {
          this.setSuggestion(suggestion[0]);
        }
      }
    },
    onInput(e) {
      this.toggleDropdown(true);
      this.updateSuggestions(e);
    },
  },
};
</script>
