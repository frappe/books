<script setup>
const keys = useKeys();
</script>
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
            class="
              bg-gray-100
              text-sm
              pl-7
              focus:outline-none
              h-full
              w-56
              placeholder-gray-800
            "
            :placeholder="t`Search...`"
            autocomplete="off"
            spellcheck="false"
            v-model="inputValue"
            @focus="
              () => {
                search();
                toggleDropdown(true);
              }
            "
            @input="search"
            ref="input"
            @keydown.up="highlightItemUp"
            @keydown.down="highlightItemDown"
            @keydown.enter="selectHighlightedItem"
            @keydown.tab="toggleDropdown(false)"
            @keydown.esc="toggleDropdown(false)"
          />
          <div
            v-if="!inputValue"
            class="absolute justify-center right-1.5 text-gray-500 px-1.5"
          >
            {{ platform === 'Mac' ? '⌘ K' : 'Ctrl K' }}
          </div>
        </div>
      </template>
    </Dropdown>
  </div>
</template>
<script>
import { t } from 'fyo';
import Dropdown from 'src/components/Dropdown';
import { getSearchList } from 'src/utils/search';
import { routeTo } from 'src/utils/ui';
import { useKeys } from 'src/utils/vueUtils';
import { watch } from 'vue';

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
    watch(this.keys, (keys) => {
      if (
        keys.size === 2 &&
        keys.has('KeyK') &&
        (keys.has('MetaLeft') || keys.has('ControlLeft'))
      ) {
        this.$refs.input.focus();
      }

      if (keys.size === 1 && keys.has('Escape')) {
        this.$refs.input.blur();
      }
    });
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
      const searchList = getSearchList();
      this.searchList = searchList.map((d) => {
        if (d.route && !d.action) {
          d.action = () => {
            routeTo(d.route);
            this.inputValue = '';
          };
        }
        return d;
      });
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
