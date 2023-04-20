<template>
  <Dropdown ref="dropdown" :items="suggestions" :df="df" :doc="doc">
    <template
      v-slot="{
        toggleDropdown,
        highlightItemUp,
        highlightItemDown,
        selectHighlightedItem,
      }"
    >
      <div :class="labelClasses" v-if="showLabel">
        {{ df.label }}
      </div>
      <div
        class="flex items-center justify-between pe-2 rounded"
        :style="containerStyles"
        :class="containerClasses"
      >
        <input
          ref="input"
          spellcheck="false"
          :class="inputClasses"
          class="bg-transparent"
          type="text"
          :value="label"
          :placeholder="inputPlaceholder"
          :readonly="isReadOnly"
          @focus="(e) => !isReadOnly && onFocus(e)"
          @click="(e) => !isReadOnly && onFocus(e)"
          @blur="(e) => !isReadOnly && onBlur(e)"
          @input="onInput"
          @keydown.up="highlightItemUp"
          @keydown.down="highlightItemDown"
          @keydown.enter="selectHighlightedItem"
          @keydown.tab="toggleDropdown(false)"
          @keydown.esc="toggleDropdown(false)"
          :tabindex="isReadOnly ? '-1' : '0'"
        />
        <svg
          v-if="!isReadOnly"
          class="w-3 h-3"
          style="background: inherit; margin-right: -3px"
          viewBox="0 0 5 10"
          xmlns="http://www.w3.org/2000/svg"
          @click="(e) => !isReadOnly && onFocus(e, toggleDropdown)"
        >
          <path
            d="M1 2.636L2.636 1l1.637 1.636M1 7.364L2.636 9l1.637-1.636"
            class="stroke-current"
            :class="showMandatory ? 'text-red-400' : 'text-gray-400'"
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
<script lang="ts">
import { getOptionList } from 'fyo/utils';
import { SelectOption } from 'schemas/types';
import Dropdown from 'src/components/Dropdown.vue';
import { fuzzyFilter } from 'src/utils';
import { getEventValue } from 'src/utils/ui';
import { defineComponent, ref } from 'vue';
import Base from './Base.vue';

type Suggestion = SelectOption & {
  action?: Function;
};

export default defineComponent({
  name: 'AutoComplete',
  emits: ['focus'],
  extends: Base,
  components: {
    Dropdown,
  },
  setup() {
    return { dropdown: ref<InstanceType<typeof Dropdown> | null>(null) };
  },
  data() {
    return {
      label: '',
      suggestions: [],
    } as {
      label: string | null;
      suggestions: Suggestion[];
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.label = this.getLabel(newValue);
      },
    },
  },
  mounted() {
    let label = null;
    if (this.label) {
      this.label = this.getLabel(this.label);
    } else if (typeof this.value === 'string') {
      this.label = this.getLabel(this.value);
    }

    this.label = label;
  },
  computed: {
    options(): SelectOption[] {
      if (!this.df) {
        return [];
      }

      return getOptionList(this.df, this.doc);
    },
  },
  methods: {
    getLabel(value: string): string | null {
      const oldValue = this.label;
      let option = this.options.find((o) => o.value === value);
      if (option === undefined) {
        option = this.options.find((o) => o.label === value);
      }

      if (!value && option === undefined) {
        return null;
      }

      return option?.label ?? oldValue;
    },
    select(suggestion: Suggestion): void {
      if (suggestion) {
        this.label = suggestion.label;
        this.triggerChange(suggestion.value);
      }

      this.dropdown?.toggleDropdown(false);
    },
    updateSuggestions(keyword?: string): void {
      if (typeof keyword === 'string') {
        this.label = keyword;
      }

      this.suggestions = this.getSuggestions(keyword).map((s) => ({
        ...s,
        action: () => this.select(s),
      }));
    },
    getSuggestions(keyword = ''): SelectOption[] {
      keyword = keyword.toLowerCase();
      if (!keyword) {
        return this.options;
      }

      return fuzzyFilter(this.options, 'label', keyword);
    },
    onInput(e: Event): void {
      if (this.isReadOnly) {
        return;
      }

      const value = getEventValue(e);
      this.dropdown?.toggleDropdown(true);
      this.updateSuggestions(value ?? undefined);
    },
    onFocus(e: FocusEvent): void {
      this.dropdown?.toggleDropdown(true);
      this.updateSuggestions();
      this.$emit('focus', e);
    },
    onBlur(e: FocusEvent): void {
      const value = getEventValue(e);
      if (!value) {
        return this.triggerChange('');
      }

      if (this.suggestions.length === 0) {
        return this.triggerChange(value);
      }

      const labels = this.suggestions.map(({ label }) => label);
      if (!labels.includes(value)) {
        const suggestions = this.getSuggestions(value);
        this.select(suggestions[0]);
      }
    },
  },
});
</script>
