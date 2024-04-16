<template>
  <div>
    <!-- Search Bar Button -->
    <Button
      class="px-3 py-2 rounded-r-none dark:bg-gray-900"
      :padding="false"
      @click="open"
    >
      <feather-icon
        name="search"
        class="w-4 h-4 text-gray-700 dark:text-gray-300"
      />
    </Button>
  </div>

  <!-- Search Modal -->
  <Modal
    :open-modal="openModal"
    :set-close-listener="false"
    @closemodal="close"
  >
    <div class="w-form">
      <!-- Search Input -->
      <div class="p-1">
        <input
          ref="input"
          v-model="inputValue"
          type="search"
          autocomplete="off"
          spellcheck="false"
          :placeholder="t`Type to search...`"
          class="
            bg-gray-100
            dark:bg-gray-800
            text-2xl
            focus:outline-none
            w-full
            placeholder-gray-500
            text-gray-900
            dark:text-gray-100
            rounded-md
            p-3
          "
          @keydown.up="up"
          @keydown.down="down"
          @keydown.enter="() => select()"
          @keydown.esc="close"
        />
      </div>
      <hr v-if="suggestions.length" class="dark:border-gray-800" />

      <!-- Search List -->
      <div
        :style="`max-height: ${49 * 6 - 1}px`"
        class="overflow-auto custom-scroll custom-scroll-thumb2"
      >
        <div
          v-for="(si, i) in suggestions"
          :key="`${i}-${si.label}`"
          :data-index="`search-suggestion-${i}`"
          class="hover:bg-gray-50 dark:hover:bg-gray-875 cursor-pointer"
          :class="
            idx === i
              ? 'border-gray-700 dark:border-gray-200 bg-gray-50 dark:bg-gray-875 border-s-4'
              : ''
          "
          @click="select(i)"
        >
          <!-- Search List Item -->
          <div
            class="flex w-full justify-between px-3 items-center"
            style="height: var(--h-row-mid)"
          >
            <div class="flex items-center">
              <p
                :class="
                  idx === i
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-700 dark:text-gray-400'
                "
                :style="idx === i ? 'margin-left: -4px' : ''"
              >
                {{ si.label }}
              </p>
              <p
                v-if="si.group === 'Docs'"
                class="text-gray-600 dark:text-gray-400 text-sm ms-3"
              >
                {{ si.more.filter(Boolean).join(', ') }}
              </p>
            </div>
            <p
              class="text-sm text-end justify-self-end"
              :class="`text-${groupColorMap[si.group]}-500`"
            >
              {{
                si.group === 'Docs' ? si.schemaLabel : groupLabelMap[si.group]
              }}
            </p>
          </div>

          <hr
            v-if="i !== suggestions.length - 1"
            class="dark:border-gray-800"
          />
        </div>
      </div>

      <!-- Footer -->
      <hr class="dark:border-gray-800" />
      <div class="m-1 flex justify-between flex-col gap-2 text-sm select-none">
        <!-- Group Filters -->
        <div class="flex justify-between">
          <div class="flex gap-1">
            <button
              v-for="g in searchGroups"
              :key="g"
              class="border dark:border-gray-800 px-1 py-0.5 rounded-lg"
              :class="getGroupFilterButtonClass(g)"
              @click="searcher!.set(g, !searcher!.filters.groupFilters[g])"
            >
              {{ groupLabelMap[g] }}
            </button>
          </div>
          <button
            class="
              hover:text-gray-900
              dark:hover:text-gray-25
              py-0.5
              rounded
              text-gray-700
              dark:text-gray-300
            "
            @click="showMore = !showMore"
          >
            {{ showMore ? t`Less Filters` : t`More Filters` }}
          </button>
        </div>

        <!-- Additional Filters -->
        <div v-if="showMore" class="-mt-1">
          <!-- Group Skip Filters -->
          <div class="flex gap-1 text-gray-800 dark:text-gray-200">
            <button
              v-for="s in ['skipTables', 'skipTransactions'] as const"
              :key="s"
              class="border dark:border-gray-800 px-1 py-0.5 rounded-lg"
              :class="{ 'bg-gray-200': searcher?.filters[s] }"
              @click="searcher?.set(s, !searcher?.filters[s])"
            >
              {{
                s === 'skipTables' ? t`Skip Child Tables` : t`Skip Transactions`
              }}
            </button>
          </div>

          <!-- Schema Name Filters -->
          <div
            class="flex mt-1 gap-1 text-blue-500 dark:text-blue-100 flex-wrap"
          >
            <button
              v-for="sf in schemaFilters"
              :key="sf.value"
              class="
                border
                px-1
                py-0.5
                rounded-lg
                border-blue-100
                dark:border-blue-800
                whitespace-nowrap
              "
              :class="{
                'bg-blue-100 dark:bg-blue-800':
                  searcher?.filters.schemaFilters[sf.value],
              }"
              @click="
                searcher?.set(
                  sf.value,
                  !searcher?.filters.schemaFilters[sf.value]
                )
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
              class="
                flex
                items-center
                hover:text-gray-800
                dark:hover:text-gray-300
              "
              @click="openDocs"
            >
              <feather-icon name="help-circle" class="w-4 h-4 me-1" />
              {{ t`Help` }}
            </button>
          </div>

          <p v-if="searcher?.numSearches" class="ms-auto">
            {{ t`${suggestions.length} out of ${searcher.numSearches}` }}
          </p>

          <div
            v-if="(searcher?.numSearches ?? 0) > 50"
            class="
              border border-gray-100
              dark:border-gray-875
              rounded
              flex
              justify-self-end
              ms-2
            "
          >
            <template
              v-for="c in allowedLimits.filter(
                (c) => c < (searcher?.numSearches ?? 0) || c === -1
              )"
              :key="c + '-count'"
            >
              <button
                class="w-9"
                :class="
                  limit === c ? 'bg-gray-100 dark:bg-gray-875 rounded' : ''
                "
                @click="limit = Number(c)"
              >
                {{ c === -1 ? t`All` : c }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { fyo } from 'src/initFyo';
import { getBgTextColorClass } from 'src/utils/colors';
import { searcherKey, shortcutsKey } from 'src/utils/injectionKeys';
import { docsPathMap } from 'src/utils/misc';
import {
  SearchGroup,
  SearchItems,
  getGroupLabelMap,
  searchGroups,
} from 'src/utils/search';
import { defineComponent, inject, nextTick } from 'vue';
import Button from './Button.vue';
import Modal from './Modal.vue';

const COMPONENT_NAME = 'SearchBar';

type SchemaFilters = { value: string; label: string; index: number }[];

export default defineComponent({
  components: { Modal, Button },
  setup() {
    return {
      searcher: inject(searcherKey),
      shortcuts: inject(shortcutsKey),
    };
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
  computed: {
    groupLabelMap(): Record<SearchGroup, string> {
      return getGroupLabelMap();
    },
    schemaFilters(): SchemaFilters {
      const searchables = this.searcher?.searchables ?? {};

      const schemaNames = Object.keys(searchables);
      const filters = schemaNames
        .map((value) => {
          const schema = fyo.schemaMap[value];
          if (!schema) {
            return;
          }

          let index = 1;
          if (schema.isSubmittable) {
            index = 0;
          } else if (schema.isChild) {
            index = 2;
          }

          return { value, label: schema.label, index };
        })
        .filter(Boolean) as SchemaFilters;

      return filters.sort((a, b) => a.index - b.index);
    },
    groupColorMap(): Record<SearchGroup, string> {
      return {
        Docs: 'blue',
        Create: 'green',
        List: 'teal',
        Report: 'yellow',
        Page: 'orange',
      };
    },
    groupColorClassMap(): Record<SearchGroup, string> {
      return searchGroups.reduce((map, g) => {
        map[g] = getBgTextColorClass(this.groupColorMap[g]);
        return map;
      }, {} as Record<SearchGroup, string>);
    },
    suggestions(): SearchItems {
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
  async mounted() {
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.search = this;
    }

    this.openModal = false;
  },
  activated() {
    this.setShortcuts();
    this.openModal = false;
  },
  deactivated() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  methods: {
    openDocs() {
      ipc.openLink('https://docs.frappebooks.com/' + docsPathMap.Search);
    },
    getShortcuts() {
      const ifOpen = (cb: Function) => () => this.openModal && cb();
      const ifClose = (cb: Function) => () => !this.openModal && cb();

      const shortcuts = [
        {
          shortcut: 'KeyK',
          callback: ifClose(() => this.open()),
        },
      ];

      for (const i in searchGroups) {
        shortcuts.push({
          shortcut: `Digit${Number(i) + 1}`,
          callback: ifOpen(() => {
            const group = searchGroups[i];
            if (!this.searcher) {
              return;
            }

            const value = this.searcher.filters.groupFilters[group];
            if (typeof value !== 'boolean') {
              return;
            }

            this.searcher.set(group, !value);
          }),
        });
      }

      return shortcuts;
    },
    setShortcuts() {
      for (const { shortcut, callback } of this.getShortcuts()) {
        this.shortcuts!.pmod.set(COMPONENT_NAME, [shortcut], callback);
      }
    },
    open(): void {
      this.openModal = true;
      this.searcher?.updateKeywords();

      nextTick(() => {
        (this.$refs.input as HTMLInputElement)?.focus();
      });
    },
    close(): void {
      this.openModal = false;
      this.reset();
    },
    reset(): void {
      this.inputValue = '';
    },
    up(): void {
      this.idx = Math.max(this.idx - 1, 0);
      this.scrollToHighlighted();
    },
    down(): void {
      this.idx = Math.max(
        Math.min(this.idx + 1, this.suggestions.length - 1),
        0
      );
      this.scrollToHighlighted();
    },
    select(idx?: number): void {
      this.idx = idx ?? this.idx;
      this.suggestions[this.idx]?.action?.();
      this.close();
    },
    scrollToHighlighted(): void {
      const query = `[data-index="search-suggestion-${this.idx}"]`;
      const element = document.querySelectorAll(query)?.[0];
      element?.scrollIntoView({ block: 'nearest' });
    },
    getGroupFilterButtonClass(g: SearchGroup): string {
      if (!this.searcher) {
        return '';
      }

      const isOn = this.searcher.filters.groupFilters[g];
      const color = this.groupColorMap[g];
      if (isOn) {
        return `${getBgTextColorClass(
          color
        )} border-${color}-100 dark:border-${color}-800`;
      }

      return `text-${color}-600 dark:text-${color}-400 border-${color}-100 dark:border-${color}-800`;
    },
  },
});
</script>
<style scoped>
input[type='search']::-webkit-search-decoration,
input[type='search']::-webkit-search-cancel-button,
input[type='search']::-webkit-search-results-button,
input[type='search']::-webkit-search-results-decoration {
  display: none;
}
</style>
