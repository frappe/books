<template>
  <Popover
    :show-popup="isShown"
    :hide-arrow="true"
    :placement="right ? 'bottom-end' : 'bottom-start'"
  >
    <template #target>
      <div v-on-outside-click="() => (isShown = false)" class="h-full">
        <slot
          :toggle-dropdown="toggleDropdown"
          :highlight-item-up="highlightItemUp"
          :highlight-item-down="highlightItemDown"
          :select-highlighted-item="selectHighlightedItem"
        ></slot>
      </div>
    </template>
    <template #content>
      <div
        class="bg-white dark:bg-gray-850 dark:text-white rounded w-full min-w-40 overflow-hidden"
      >
        <div class="p-1 max-h-64 overflow-auto custom-scroll custom-scroll-thumb2 text-sm">
          <div
            v-if="isLoading"
            class="p-2 text-gray-600 dark:text-gray-400 italic"
          >
            {{ t`Loading...` }}
          </div>
          <div
            v-else-if="dropdownItems.length === 0"
            class="p-2 text-gray-600 dark:text-gray-400 italic"
          >
            {{ getEmptyMessage() }}
          </div>
          <template v-else>
            <div
              v-for="(d, index) in dropdownItems"
              :key="`key-${index}`"
              ref="items"
            >
              <div
                v-if="d.isGroup"
                class="px-2 pt-3 pb-1 text-xs uppercase text-gray-700 dark:text-gray-400 font-semibold tracking-wider"
              >
                {{ d.label }}
              </div>
              <a
                v-else
                class="block p-2 rounded-md mt-1 first:mt-0 cursor-pointer truncate"
                :class="
                  index === highlightedIndex
                    ? 'bg-gray-100 dark:bg-gray-875'
                    : ''
                "
                @mouseenter="highlightedIndex = index"
                @mousedown.prevent
                @click="selectItem(d)"
              >
                <component :is="d.component" v-if="d.component" />
                <template v-else>{{ d.label }}</template>
              </a>
            </div>
          </template>
        </div>
      </div>
    </template>
  </Popover>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { DropdownItem } from 'src/utils/types';
import { defineComponent, PropType } from 'vue';
import Popover from './Popover.vue';

export default defineComponent({
  name: 'Dropdown',
  components: {
    Popover,
  },
  props: {
    items: {
      type: Array as PropType<DropdownItem[]>,
      default: () => [],
    },
    right: {
      type: Boolean,
      default: false,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    df: {
      type: Object as PropType<Field | null>,
      default: null,
    },
    doc: {
      type: Object as PropType<Doc | null>,
      default: null,
    },
  },
  data() {
    return {
      isShown: false,
      highlightedIndex: -1,
    };
  },
  computed: {
    dropdownItems(): DropdownItem[] {
      const groupedItems = getGroupedItems(this.items ?? []);
      const groupNames = Object.keys(groupedItems).filter(Boolean).sort();

      const items: DropdownItem[] = groupedItems[''] ?? [];
      for (let group of groupNames) {
        items.push({
          label: group,
          isGroup: true,
        });

        const grouped = groupedItems[group] ?? [];
        items.push(...grouped);
      }

      return items;
    },
  },
  watch: {
    highlightedIndex() {
      this.scrollToHighlighted();
    },
    dropdownItems() {
      const maxed = Math.max(this.highlightedIndex, -1);
      this.highlightedIndex = Math.min(maxed, this.dropdownItems.length - 1);
    },
  },
  methods: {
    getEmptyMessage(): string {
      const { schemaName, fieldname } = this.df ?? {};
      if (!schemaName || !fieldname || !this.doc) {
        return this.t`Empty`;
      }

      const emptyMessage = fyo.models[schemaName]?.emptyMessages[fieldname]?.(
        this.doc
      );

      if (!emptyMessage) {
        return this.t`Empty`;
      }

      return emptyMessage;
    },
    async selectItem(d?: DropdownItem): Promise<void> {
      if (!d || !d?.action) {
        return;
      }

      if (this.doc) {
        return await d.action(this.doc, this.$router);
      }

      await d.action();
    },
    toggleDropdown(flag?: boolean): void {
      if (typeof flag !== 'boolean') {
        flag = !this.isShown;
      }

      this.isShown = flag;
    },
    async selectHighlightedItem(): Promise<void> {
      let item = this.items[this.highlightedIndex];
      if (!item && this.dropdownItems.length === 1) {
        item = this.dropdownItems[0];
      }

      return await this.selectItem(item);
    },
    highlightItemUp(e?: Event): void {
      e?.preventDefault();

      this.highlightedIndex = Math.max(0, this.highlightedIndex - 1);
    },
    highlightItemDown(e?: Event): void {
      e?.preventDefault();

      this.highlightedIndex = Math.min(
        this.dropdownItems.length - 1,
        this.highlightedIndex + 1
      );
    },
    scrollToHighlighted(): void {
      const elems = this.$refs.items;
      if (!Array.isArray(elems)) {
        return;
      }

      const highlightedElement = elems[this.highlightedIndex];
      if (!(highlightedElement instanceof Element)) {
        return;
      }

      highlightedElement.scrollIntoView({ block: 'nearest' });
    },
  },
});

function getGroupedItems(
  items: DropdownItem[]
): Record<string, DropdownItem[]> {
  const groupedItems: Record<string, DropdownItem[]> = {};
  for (let item of items) {
    const group = item.group ?? '';

    groupedItems[group] ??= [];
    groupedItems[group].push(item);
  }

  return groupedItems;
}
</script>
