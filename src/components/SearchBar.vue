<script setup>
const keys = useKeys();
</script>
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
      "
    >
      <feather-icon name="search" class="w-4 h-4" />
      <p>{{ t`Search` }}</p>
      <div v-if="!inputValue" class="text-gray-500 ml-auto">
        {{ platform === 'Mac' ? '⌘ K' : 'Ctrl K' }}
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
    <div :style="`max-height: ${49 * 6 - 1}px`" class="overflow-scroll">
      <div
        v-for="(si, i) in suggestions"
        :key="`${i}-${si.key}`"
        ref="suggestions"
        class="hover:bg-blue-100 cursor-pointer"
        :class="idx === i ? 'bg-blue-100' : ''"
        @click="select(i)"
      >
        <div
          class="flex flex-row w-full justify-between px-3 items-center"
          style="height: 48px"
        >
          <p class="">
            {{ si.label }}
          </p>
          <div
            class="text-base px-2 py-1 rounded-lg flex items-center"
            :class="groupColorClassMap[si.group]"
          >
            {{ groupLabelMap[si.group] }}
          </div>
        </div>
        <hr v-if="i !== suggestions.length - 1" />
      </div>
    </div>

    <!-- Footer -->
    <hr />
    <div class="m-2 flex justify-between items-center">
      <!-- Group Filters -->
      <div class="flex flex-row gap-2">
        <button
          v-for="g in searchGroups"
          :key="g"
          class="text-base border px-2 py-0.5 rounded-lg"
          :class="getGroupFilterButtonClass(g)"
          @click="groupFilters[g] = !groupFilters[g]"
        >
          {{ groupLabelMap[g] }}
        </button>
      </div>

      <!-- Keybindings Help -->
      <div class="flex text-base gap-3 justify-center text-gray-700">
        <p>↑↓ {{ t`Navigate` }}</p>
        <p>↩ {{ t`Select` }}</p>
        <p><span class="text-sm tracking-tighter">esc</span> {{ t`Close` }}</p>
      </div>
    </div>
  </Modal>
</template>
<script>
import { t } from 'fyo';
import { fuzzyMatch } from 'src/utils';
import { getBgTextColorClass } from 'src/utils/colors';
import { getSearchList, searchGroups } from 'src/utils/search';
import { routeTo } from 'src/utils/ui';
import { useKeys } from 'src/utils/vueUtils';
import { getIsNullOrUndef } from 'utils/';
import { nextTick, watch } from 'vue';
import Modal from './Modal.vue';

export default {
  data() {
    return {
      idx: 0,
      searchGroups,
      openModal: false,
      inputValue: '',
      searchList: [],
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
  mounted() {
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
    });
    this.openModal = false;
  },
  activated() {
    this.openModal = false;
  },
  methods: {
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

      return this.searchList
        .filter((si) => filters.has(si.group))
        .map((si) => ({
          ...fuzzyMatch(this.inputValue, `${si.label} ${si.group}`),
          si,
        }))
        .filter(({ isMatch }) => isMatch)
        .sort((a, b) => a.distance - b.distance)
        .map(({ si }) => si);
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
