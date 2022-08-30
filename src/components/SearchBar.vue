<template>
  <div>
    <!-- Search Bar Button -->
    <Button @click="open" class="px-2" :padding="false">
      <feather-icon name="search" class="w-4 h-4 mr-1 text-gray-800" />
      <p>{{ t`Search` }}</p>
      <div class="text-gray-500 px-1 ml-4 text-sm">
        {{ modKey('k') }}
      </div>
    </Button>
  </div>

  <!-- Search Modal -->
  <Modal :open-modal="openModal" @closemodal="close">
    <!-- Search Input -->
    <div class="p-1">
      <input
        ref="input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        :placeholder="t`Type to search...`"
        v-model="inputValue"
        @focus="search"
        @input="search"
        @keydown.up="up"
        @keydown.down="down"
        @keydown.enter="() => select()"
        @keydown.esc="close"
        class="
          bg-gray-100
          text-2xl
          focus:outline-none
          w-full
          placeholder-gray-500
          text-gray-900
          rounded-md
          p-3
        "
      />
    </div>
    <hr v-if="suggestions.length" />

    <!-- Search List -->
    <div :style="`max-height: ${49 * 6 - 1}px`" class="overflow-auto">
      <div
        v-for="(si, i) in suggestions"
        :key="`${i}-${si.key}`"
        ref="suggestions"
        class="hover:bg-gray-50 cursor-pointer"
        :class="idx === i ? 'border-blue-500 bg-gray-50 border-l-4' : ''"
        @click="select(i)"
      >
        <!-- Search List Item -->
        <div
          class="flex w-full justify-between px-3 items-center"
          style="height: var(--h-row-mid)"
        >
          <div class="flex items-center">
            <p
              :class="idx === i ? 'text-blue-600' : 'text-gray-900'"
              :style="idx === i ? 'margin-left: -4px' : ''"
            >
              {{ si.label }}
            </p>
            <p class="text-gray-600 text-sm ml-3" v-if="si.group === 'Docs'">
              {{ si.more.filter(Boolean).join(', ') }}
            </p>
          </div>
          <p
            class="text-sm text-right justify-self-end"
            :class="`text-${groupColorMap[si.group]}-500`"
          >
            {{ si.group === 'Docs' ? si.schemaLabel : groupLabelMap[si.group] }}
          </p>
        </div>

        <hr v-if="i !== suggestions.length - 1" />
      </div>
    </div>

    <!-- Footer -->
    <hr />
    <div class="m-1 flex justify-between flex-col gap-2 text-sm select-none">
      <!-- Group Filters -->
      <div class="flex justify-between">
        <div class="flex gap-1">
          <button
            v-for="g in searchGroups"
            :key="g"
            class="border px-1 py-0.5 rounded-lg"
            :class="getGroupFilterButtonClass(g)"
            @click="searcher.set(g, !searcher.filters.groupFilters[g])"
          >
            {{ groupLabelMap[g] }}
          </button>
        </div>
        <button
          class="hover:text-gray-900 py-0.5 rounded text-gray-700"
          @click="showMore = !showMore"
        >
          {{ showMore ? t`Less Filters` : t`More Filters` }}
        </button>
      </div>

      <!-- Additional Filters -->
      <div v-if="showMore" class="-mt-1">
        <!-- Group Skip Filters -->
        <div class="flex gap-1 text-gray-800">
          <button
            v-for="s in ['skipTables', 'skipTransactions']"
            :key="s"
            class="border px-1 py-0.5 rounded-lg"
            :class="{ 'bg-gray-200': searcher.filters[s] }"
            @click="searcher.set(s, !searcher.filters[s])"
          >
            {{
              s === 'skipTables' ? t`Skip Child Tables` : t`Skip Transactions`
            }}
          </button>
        </div>

        <!-- Schema Name Filters -->
        <div class="flex mt-1 gap-1 text-blue-500 flex-wrap">
          <button
            v-for="sf in schemaFilters"
            :key="sf.value"
            class="
              border
              px-1
              py-0.5
              rounded-lg
              border-blue-100
              whitespace-nowrap
            "
            :class="{ 'bg-blue-100': searcher.filters.schemaFilters[sf.value] }"
            @click="
              searcher.set(sf.value, !searcher.filters.schemaFilters[sf.value])
            "
          >
            {{ sf.label }}
          </button>
        </div>
      </div>

      <!-- Keybindings Help -->
      <div class="flex text-sm text-gray-500 justify-between items-baseline">
        <div class="flex gap-4">
          <p>↑↓ {{ t`Navigate` }}</p>
          <p>↩ {{ t`Select` }}</p>
          <p><span class="tracking-tighter">esc</span> {{ t`Close` }}</p>
          <button
            class="flex items-center hover:text-gray-800"
            @click="openDocs"
          >
            <feather-icon name="help-circle" class="w-4 h-4 mr-1" />
            {{ t`Help` }}
          </button>
        </div>

        <p v-if="searcher?.numSearches" class="ml-auto">
          {{ t`${suggestions.length} out of ${searcher.numSearches}` }}
        </p>

        <div
          class="border border-gray-100 rounded flex justify-self-end ml-2"
          v-if="(searcher?.numSearches ?? 0) > 50"
        >
          <template
            v-for="c in allowedLimits.filter(
              (c) => c < searcher.numSearches || c === -1
            )"
            :key="c + '-count'"
          >
            <button
              @click="limit = parseInt(c)"
              class="w-9"
              :class="limit === c ? 'bg-gray-100' : ''"
            >
              {{ c === -1 ? t`All` : c }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Modal>
</template>
<script>
import { fyo } from 'src/initFyo';
import { getBgTextColorClass } from 'src/utils/colors';
import { openLink } from 'src/utils/ipcCalls';
import { docsPathMap } from 'src/utils/misc';
import { getGroupLabelMap, searchGroups } from 'src/utils/search';
import { useKeys } from 'src/utils/vueUtils';
import { getIsNullOrUndef } from 'utils/';
import { nextTick, watch } from 'vue';
import Button from './Button.vue';
import Modal from './Modal.vue';

export default {
  setup() {
    const keys = useKeys();
    return { keys };
  },
  data() {
    return {
      idx: 0,
      searchGroups,
      openModal: false,
      inputValue: '',
      showMore: false,
      limit: 50,
      allowedLimits: [50, 100, 500, -1],
    };
  },
  inject: ['searcher'],
  components: { Modal, Button },
  async mounted() {
    if (fyo.store.isDevelopment) {
      window.search = this;
    }

    watch(this.keys, (keys) => {
      if (
        keys.size === 2 &&
        keys.has('KeyK') &&
        (keys.has('MetaLeft') || keys.has('ControlLeft'))
      ) {
        this.open();
      }

      if (!this.openModal) {
        return;
      }

      if (keys.size === 1 && keys.has('Escape')) {
        this.close();
      }

      const input = this.$refs.input;
      if (!getIsNullOrUndef(input) && document.activeElement !== input) {
        input.focus();
      }

      this.setFilter(keys);
    });
    this.openModal = false;
  },
  activated() {
    this.openModal = false;
  },
  methods: {
    openDocs() {
      openLink('https://docs.frappebooks.com/' + docsPathMap.Search);
    },
    setFilter(keys) {
      if (!keys.has('MetaLeft') && !keys.has('ControlLeft')) {
        return;
      }

      if (!keys.size === 2) {
        return;
      }

      const matches = [...keys].join(',').match(/Digit(\d+)/);
      if (!matches) {
        return;
      }

      const digit = matches[1];
      const index = parseInt(digit) - 1;
      const group = searchGroups[index];
      const value = this.searcher.filters.groupFilters[group];
      if (!group || typeof value !== 'boolean') {
        return;
      }

      this.searcher.set(group, !value);
    },
    modKey(key) {
      key = key.toUpperCase();
      if (this.platform === 'Mac') {
        return `⌘ ${key}`;
      }

      return `Ctrl ${key}`;
    },
    open() {
      this.openModal = true;
      this.searcher?.updateKeywords();
      nextTick(() => {
        this.$refs.input.focus();
      });
    },
    close() {
      this.openModal = false;
      this.reset();
    },
    reset() {
      this.inputValue = '';
    },
    up() {
      this.idx = Math.max(this.idx - 1, 0);
      this.scrollToHighlighted();
    },
    down() {
      this.idx = Math.max(
        Math.min(this.idx + 1, this.suggestions.length - 1),
        0
      );
      this.scrollToHighlighted();
    },
    select(idx) {
      this.idx = idx ?? this.idx;
      this.suggestions[this.idx]?.action();
      this.close();
    },
    scrollToHighlighted() {
      const ref = this.$refs.suggestions[this.idx];
      ref.scrollIntoView({ block: 'nearest' });
    },
    getGroupFilterButtonClass(g) {
      if (!this.searcher) {
        return '';
      }

      const isOn = this.searcher.filters.groupFilters[g];
      const color = this.groupColorMap[g];
      if (isOn) {
        return `${getBgTextColorClass(color)} border-${color}-100`;
      }

      return `text-${color}-600 border-${color}-100`;
    },
  },
  computed: {
    groupLabelMap() {
      return getGroupLabelMap();
    },
    schemaFilters() {
      const schemaNames = Object.keys(this.searcher?.searchables) ?? [];
      return schemaNames
        .map((sn) => {
          const schema = fyo.schemaMap[sn];
          const value = sn;
          const label = schema.label;
          let index = 1;
          if (schema.isSubmittable) {
            index = 0;
          } else if (schema.isChild) {
            index = 2;
          }
          return { value, label, index };
        })
        .sort((a, b) => a.index - b.index);
    },
    groupColorMap() {
      return {
        Docs: 'blue',
        Create: 'green',
        List: 'teal',
        Report: 'yellow',
        Page: 'orange',
      };
    },
    groupColorClassMap() {
      return searchGroups.reduce((map, g) => {
        map[g] = getBgTextColorClass(this.groupColorMap[g]);
        return map;
      }, {});
    },
    suggestions() {
      if (!this.searcher) {
        return [];
      }

      const suggestions = this.searcher.search(this.inputValue);
      if (this.limit === -1) {
        return suggestions;
      }

      return suggestions.slice(0, this.limit);
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
