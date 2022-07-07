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
      <div
        class="
          flex
          items-center
          justify-between
          focus-within:bg-gray-200
          pr-2
          rounded
        "
      >
        <input
          ref="input"
          spellcheck="false"
          :class="inputClasses"
          type="text"
          :value="linkValue"
          :placeholder="inputPlaceholder"
          :readonly="isReadOnly"
          @focus="(e) => !isReadOnly && onFocus(e, toggleDropdown)"
          @blur="(e) => !isReadOnly && onBlur(e.target.value)"
          @input="onInput"
          @keydown.up="highlightItemUp"
          @keydown.down="highlightItemDown"
          @keydown.enter="selectHighlightedItem"
          @keydown.tab="toggleDropdown(false)"
          @keydown.esc="toggleDropdown(false)"
        />
        <svg
          v-if="!isReadOnly"
          class="w-3 h-3"
          style="background: inherit; margin-right: -3px"
          viewBox="0 0 5 10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 2.636L2.636 1l1.637 1.636M1 7.364L2.636 9l1.637-1.636"
            stroke="#404040"
            fill="none"
            fill-rule="evenodd"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </template>
  </Dropdown>
</template>

<script>
import { getOptionList } from 'fyo/utils';
import Dropdown from 'src/components/Dropdown.vue';
import { fuzzyMatch } from 'src/utils';
import Base from './Base.vue';

export default {
  name: 'AutoComplete',
  emits: ['focus'],
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
        this.linkValue = this.getLabel(newValue);
      },
    },
  },
  inject: {
    doc: { default: null },
  },
  mounted() {
    this.linkValue = this.getLabel(this.linkValue || this.value);
  },
  computed: {
    options() {
      if (!this.df) {
        return [];
      }

      return getOptionList(this.df, this.doc);
    },
  },
  methods: {
    getLabel(value) {
      const oldValue = this.linkValue;
      let option = this.options.find((o) => o.value === value);
      if (option === undefined) {
        option = this.options.find((o) => o.label === value);
      }

      return option?.label ?? oldValue;
    },
    getValue(label) {
      let option = this.options.find((o) => o.label === label);
      if (option === undefined) {
        option = this.options.find((o) => o.value === label);
      }

      return option?.value ?? label;
    },
    async updateSuggestions(keyword) {
      if (typeof keyword === 'string') {
        this.linkValue = keyword;
      }

      this.isLoading = true;
      const suggestions = await this.getSuggestions(keyword);
      this.suggestions = this.setSetSuggestionAction(suggestions);
      this.isLoading = false;
    },

    setSetSuggestionAction(suggestions) {
      for (const option of suggestions) {
        if (option.action) {
          continue;
        }

        option.action = () => {
          this.setSuggestion(option);
        };
      }

      return suggestions;
    },
    async getSuggestions(keyword = '') {
      keyword = keyword.toLowerCase();
      if (!keyword) {
        return this.options;
      }

      return this.options
        .map((item) => ({ ...fuzzyMatch(keyword, item.label), item }))
        .filter(({ isMatch }) => isMatch)
        .sort((a, b) => a.distance - b.distance)
        .map(({ item }) => item);
    },
    setSuggestion(suggestion) {
      this.linkValue = suggestion.label;
      this.triggerChange(suggestion.value);
      this.toggleDropdown(false);
    },
    onFocus(e, toggleDropdown) {
      this.toggleDropdown = toggleDropdown;
      this.toggleDropdown(true);
      this.updateSuggestions();
      this.$emit('focus', e);
    },
    async onBlur(label) {
      if (!label) {
        this.triggerChange('');
        return;
      }

      if (label && this.suggestions.length === 0) {
        this.triggerChange(label);
        return;
      }

      if (
        label &&
        !this.suggestions.map(({ label }) => label).includes(label)
      ) {
        const suggestions = await this.getSuggestions(label);
        this.setSuggestion(suggestions[0]);
      }
    },
    onInput(e) {
      if (this.isReadOnly) {
        return;
      }

      this.toggleDropdown(true);
      this.updateSuggestions(e.target.value);
    },
  },
};
</script>
