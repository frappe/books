<template>
  <div class="relative" v-on-outside-click="() => isShown = false">
    <div>
      <slot
        :toggleDropdown="toggleDropdown"
        :highlightItemUp="highlightItemUp"
        :highlightItemDown="highlightItemDown"
        :selectHighlightedItem="selectHighlightedItem"
      ></slot>
    </div>
    <div
      :class="right ? 'right-0' : 'left-0'"
      class="mt-1 absolute z-10 bg-white rounded-5px border w-full min-w-56"
      v-if="isShown"
    >
      <div class="p-1 max-h-64 overflow-auto">
        <a
          ref="items"
          class="block p-2 rounded mt-1 first:mt-0 cursor-pointer whitespace-no-wrap text-sm"
          v-for="(d, index) in items"
          :key="d.label"
          :class="index === highlightedIndex ? 'bg-gray-100' : ''"
          @mouseenter="highlightedIndex = index"
          @mouseleave="highlightedIndex = -1"
          @click="selectItem(d)"
        >
          <component :is="d.component" v-if="d.component" />
          <template v-else>{{ d.label }}</template>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dropdown',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    right: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isShown: false,
      highlightedIndex: -1
    };
  },
  methods: {
    selectItem(d) {
      if (d.action) {
        d.action();
      }
    },
    toggleDropdown(flag) {
      if (flag == null) {
        this.isShown = !this.isShown;
      } else {
        this.isShown = Boolean(flag);
      }
    },
    selectHighlightedItem() {
      if (![-1, this.items.length].includes(this.highlightedIndex)) {
        // valid selection
        let item = this.items[this.highlightedIndex];
        this.selectItem(item);
      }
    },
    highlightItemUp() {
      this.highlightedIndex -= 1;
      if (this.highlightedIndex < 0) {
        this.highlightedIndex = 0;
      }
      this.$nextTick(() => {
        let index = this.highlightedIndex;
        if (index !== 0) {
          index -= 1;
        }
        let highlightedElement = this.$refs.items[index];
        highlightedElement && highlightedElement.scrollIntoView();
      });
    },
    highlightItemDown() {
      this.highlightedIndex += 1;
      if (this.highlightedIndex > this.items.length) {
        this.highlightedIndex = this.items.length;
      }

      this.$nextTick(() => {
        let index = this.highlightedIndex;
        let highlightedElement = this.$refs.items[index];
        highlightedElement && highlightedElement.scrollIntoView();
      });
    }
  }
};
</script>
