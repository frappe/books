<template>
  <Dropdown :items="suggestions" :is-loading="isLoading" :df="df" :doc="doc">
    <template
      #default="{
        toggleDropdown,
        highlightItemUp,
        highlightItemDown,
        selectHighlightedItem,
      }"
    >
      <div v-if="showLabel" :class="labelClasses">
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
          :value="linkValue"
          :placeholder="inputPlaceholder"
          :readonly="isReadOnly"
          :tabindex="isReadOnly ? '-1' : '0'"
          @focus="(e) => !isReadOnly && onFocus(e, toggleDropdown)"
          @click="(e) => !isReadOnly && onFocus(e, toggleDropdown)"
          @blur="(e) => !isReadOnly && onBlur(e.target.value)"
          @input="onInput"
          @keydown.up="highlightItemUp"
          @keydown.down="highlightItemDown"
          @keydown.enter="selectHighlightedItem"
          @keydown.tab="toggleDropdown(false)"
          @keydown.esc="toggleDropdown(false)"
        />
        <svg
          v-if="!isReadOnly && !canLink"
          class="w-3 h-3"
          style="background: inherit; margin-right: -3px"
          viewBox="0 0 5 10"
          xmlns="http://www.w3.org/2000/svg"
          @click="(e) => !isReadOnly && onFocus(e, toggleDropdown)"
        >
          <path
            d="M1 2.636L2.636 1l1.637 1.636M1 7.364L2.636 9l1.637-1.636"
            class="stroke-current"
            :class="
              showMandatory ? 'text-red-400 dark:text-red-600' : 'text-gray-400'
            "
            fill="none"
            fill-rule="evenodd"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <button
          v-if="canLink"
          class="p-0.5 rounded -me1 bg-transparent"
          @mouseenter="showQuickView = true"
          @mouseleave="showQuickView = false"
          @click="routeToLinkedDoc"
        >
          <Popover
            :show-popup="showQuickView"
            :entry-delay="300"
            placement="bottom"
          >
            <template #target>
              <feather-icon
                name="chevron-right"
                class="w-4 h-4 text-gray-600"
              />
            </template>
            <template #content>
              <QuickView :schema-name="linkSchemaName" :name="value" />
            </template>
          </Popover>
        </button>
      </div>
    </template>
  </Dropdown>
</template>
<script>
import { getOptionList } from 'fyo/utils';
import { FieldTypeEnum } from 'schemas/types';
import Dropdown from 'src/components/Dropdown.vue';
import { fuzzyMatch } from 'src/utils';
import { getFormRoute, routeTo } from 'src/utils/ui';
import Popover from '../Popover.vue';
import Base from './Base.vue';
import QuickView from '../QuickView.vue';

export default {
  name: 'AutoComplete',
  components: {
    Dropdown,
    Popover,
    QuickView,
  },
  extends: Base,
  emits: ['focus'],
  data() {
    return {
      showQuickView: false,
      linkValue: '',
      isLoading: false,
      suggestions: [],
      highlightedIndex: -1,
    };
  },
  computed: {
    linkSchemaName() {
      let schemaName = this.df?.target;

      if (!schemaName) {
        const references = this.df?.references ?? '';
        schemaName = this.doc?.[references];
      }

      return schemaName;
    },
    options() {
      if (!this.df) {
        return [];
      }

      return getOptionList(this.df, this.doc);
    },
    canLink() {
      if (!this.value || !this.df) {
        return false;
      }

      const fieldtype = this.df?.fieldtype;
      const isLink = fieldtype === FieldTypeEnum.Link;
      const isDynamicLink = fieldtype === FieldTypeEnum.DynamicLink;

      if (!isLink && !isDynamicLink) {
        return false;
      }

      if (isLink && this.df.target) {
        return true;
      }

      const references = this.df.references;
      if (!references) {
        return false;
      }

      if (!this.doc?.[references]) {
        return false;
      }

      return true;
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.setLinkValue(this.getLinkValue(newValue));
      },
    },
  },
  mounted() {
    const value = this.linkValue || this.value;
    this.setLinkValue(this.getLinkValue(value));
  },
  unmounted() {
    this.showQuickView = false;
  },
  deactivated() {
    this.showQuickView = false;
  },
  methods: {
    async routeToLinkedDoc() {
      const name = this.value;
      if (!this.linkSchemaName || !name) {
        return;
      }

      const route = getFormRoute(this.linkSchemaName, name);
      await routeTo(route);
    },
    setLinkValue(value) {
      this.linkValue = value;
    },
    getLinkValue(value) {
      const oldValue = this.linkValue;
      let option = this.options.find((o) => o.value === value);
      if (option === undefined) {
        option = this.options.find((o) => o.label === value);
      }

      if (!value && option === undefined) {
        return null;
      }

      return option?.label ?? oldValue;
    },
    async updateSuggestions(keyword) {
      if (typeof keyword === 'string') {
        this.setLinkValue(keyword, true);
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
      if (suggestion?.actionOnly) {
        this.setLinkValue(this.value);
        return;
      }

      if (suggestion) {
        this.setLinkValue(suggestion.label);
        this.triggerChange(suggestion.value);
      }

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

      if (this.suggestions.length === 0) {
        this.triggerChange(label);
        return;
      }

      const suggestion = this.suggestions.find((s) => s.label === label);
      if (suggestion) {
        this.setSuggestion(suggestion);
      } else {
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
