<template>
  <div>
    <!-- Search Bar Button -->
    <button
      @click="open"
      class="
        focus:outline-none
        shadow-button
        flex flex-row
        gap-1
        text-base text-gray-700
        bg-gray-100
        rounded-md
        h-8
        w-48
        px-3
        items-center
        hover:bg-gray-200
      "
    >
      <feather-icon name="search" class="w-4 h-4" />
      <p>{{ t`Search` }}</p>
      <div v-if="!inputValue" class="text-gray-400 ml-auto text-sm">
        {{ modKey('k') }}
      </div>
    </button>
  </div>

  <!-- Search Modal -->
  <Modal :open-modal="openModal">
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
          placeholder-gray-700
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
        class="hover:bg-blue-50 cursor-pointer"
        :class="idx === i ? 'bg-blue-100' : ''"
        @click="select(i)"
      >
        <!-- Doc Search List Item -->
        <div
          v-if="si.group === 'Docs'"
          class="flex w-full justify-between px-3 items-center"
          style="height: 48px"
        >
          <div class="flex items-center">
            <p class="text-gray-900">
              {{ si.label }}
            </p>
            <p class="text-gray-600 text-sm ml-3">
              {{ si.more.join(', ') }}
            </p>
          </div>
          <p
            class="text-sm text-right justify-self-end"
            :class="`text-${groupColorMap[si.group]}-500`"
          >
            {{ si.schemaLabel }}
          </p>
        </div>

        <!-- Doc Search List Item -->
        <div
          v-else
          class="flex flex-row w-full justify-between px-3 items-center"
          style="height: 48px"
        >
          <p class="text-gray-900">
            {{ si.label }}
          </p>
          <div
            class="text-sm text-right justify-self-end"
            :class="`text-${groupColorMap[si.group]}-500`"
          >
            {{ groupLabelMap[si.group] }}
          </div>
        </div>
        <hr v-if="i !== suggestions.length - 1" />
      </div>
    </div>

    <!-- Footer -->
    <hr />
    <div class="m-1 flex justify-between flex-col gap-2 text-sm select-none">
      <!-- Group Filters -->
      <div class="flex justify-between">
        <div class="flex gap-2">
          <button
            v-for="g in searchGroups"
            :key="g"
            class="border px-1 py-0.5 rounded-lg"
            :class="getGroupFilterButtonClass(g)"
            @click="groupFilters[g] = !groupFilters[g]"
          >
            {{ groupLabelMap[g] }}
          </button>
        </div>
        <button
          class="
            bg-gray-100
            hover:bg-gray-200
            px-2
            py-0.5
            rounded
            text-gray-800
          "
        >
          {{ t`More Filters` }}
        </button>
      </div>

      <!-- Keybindings Help -->
      <div class="flex text-sm text-gray-500 justify-between">
        <div class="flex gap-4">
          <p>↑↓ {{ t`Navigate` }}</p>
          <p>↩ {{ t`Select` }}</p>
          <p><span class="tracking-tighter">esc</span> {{ t`Close` }}</p>
        </div>
        <p v-if="suggestions.length">
          {{ t`${suggestions.length} out of ${totalLength} shown` }}
        </p>
      </div>
    </div>
  </Modal>
</template>
<script>
import { t } from 'fyo';
import { fuzzyMatch } from 'src/utils';
import { getBgTextColorClass } from 'src/utils/colors';
import { docSearch, getSearchList, searchGroups } from 'src/utils/search';
import { routeTo } from 'src/utils/ui';
import { useKeys } from 'src/utils/vueUtils';
import { getIsNullOrUndef } from 'utils/';
import { nextTick, watch } from 'vue';
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
      searchList: [],
      docSearch: null,
      totalLength: 0,
      groupFilters: {
        List: true,
        Report: true,
        Create: true,
        Page: true,
        Docs: true,
      },
    };
  },
  components: { Modal },
  async mounted() {
    this.docSearch = docSearch;
    await this.docSearch.fetchKeywords();

    if (fyo.store.isDevelopment) {
      window.search = docSearch;
    }

    this.makeSearchList();
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
      if (!group || this.groupFilters[group] === undefined) {
        return;
      }

      this.groupFilters[group] = !this.groupFilters[group];
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
      nextTick(() => {
        this.$refs.input.focus();
      });
    },
    close() {
      this.openModal = false;
      this.reset();
    },
    reset() {
      this.searchGroups.forEach((g) => {
        this.groupFilters[g] = true;
      });
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
    async makeSearchList() {
      const searchList = getSearchList();
      this.searchList = searchList.map((d) => {
        if (d.route && !d.action) {
          d.action = () => {
            routeTo(d.route);
          };
        }
        return d;
      });
    },
    getGroupFilterButtonClass(g) {
      const isOn = this.groupFilters[g];
      const color = this.groupColorMap[g];
      if (isOn) {
        return `${getBgTextColorClass(color)} border-${color}-100`;
      }

      return `text-${color}-600 border-${color}-100`;
    },
  },
  computed: {
    groupLabelMap() {
      return {
        Create: t`Create`,
        List: t`List`,
        Report: t`Report`,
        Docs: t`Docs`,
        Page: t`Page`,
      };
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
      const filters = new Set(
        this.searchGroups.filter((g) => this.groupFilters[g])
      );

      const nonDocs = this.searchList
        .filter((si) => filters.has(si.group))
        .map((si) => ({
          ...fuzzyMatch(this.inputValue, `${si.label} ${si.group}`),
          si,
        }))
        .filter(({ isMatch }) => isMatch)
        .sort((a, b) => a.distance - b.distance)
        .map(({ si }) => si);

      let docs = [];
      if (this.groupFilters.Docs && this.inputValue) {
        docs = this.docSearch.search(this.inputValue);
      }

      const all = [docs, nonDocs].flat();
      // eslint-disable-next-line
      this.totalLength = all.length;
      return all.slice(0, 50);
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
