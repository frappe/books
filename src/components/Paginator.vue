<template>
  <div
    class="grid grid-cols-3 text-gray-800 dark:text-gray-100 text-sm select-none items-center"
    style="height: 50px"
  >
    <!-- Length Display -->
    <div class="justify-self-start">
      {{
        `${(pageNo - 1) * count + 1} - ${Math.min(pageNo * count, itemCount)}`
      }}
    </div>

    <!-- Pagination Selector -->
    <div class="flex gap-1 items-center justify-self-center">
      <feather-icon
        name="chevron-left"
        class="w-4 h-4 rtl-rotate-180"
        :class="
          pageNo > 1
            ? 'text-gray-600 dark:text-gray-500 cursor-pointer'
            : 'text-transparent'
        "
        @click="() => setPageNo(Math.max(1, pageNo - 1))"
      />
      <div class="flex gap-1 bg-gray-100 dark:bg-gray-890 rounded">
        <input
          type="number"
          class="w-7 text-end outline-none bg-transparent focus:text-gray-900 dark:focus:text-gray-25"
          :value="pageNo"
          min="1"
          :max="maxPages"
          @change="(e) => setPageNo(e.target.value)"
          @input="(e) => setPageNo(e.target.value)"
        />
        <p class="text-gray-600">/</p>
        <p class="w-7">
          {{ maxPages }}
        </p>
      </div>
      <feather-icon
        name="chevron-right"
        class="w-4 h-4 rtl-rotate-180"
        :class="
          pageNo < maxPages
            ? 'text-gray-600 dark:text-gray-500 cursor-pointer'
            : 'text-transparent'
        "
        @click="() => setPageNo(Math.min(maxPages, pageNo + 1))"
      />
    </div>

    <!-- Count Selector -->
    <div
      v-if="filteredCounts.length"
      class="border border-gray-100 dark:border-gray-800 rounded flex justify-self-end"
    >
      <template v-for="c in filteredCounts" :key="c + '-count'">
        <button
          class="w-9"
          :class="
            count === c || (count === itemCount && c === -1)
              ? 'rounded bg-gray-100 dark:bg-gray-890'
              : ''
          "
          @click="setCount(c)"
        >
          {{ c === -1 ? t`All` : c }}
        </button>
      </template>
    </div>
  </div>
</template>
<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    itemCount: { type: Number, default: 0 },
    allowedCounts: { type: Array, default: () => [50, 100, 500, -1] },
  },
  emits: ['index-change'],
  data() {
    return {
      pageNo: 1,
      count: 0,
    };
  },
  computed: {
    maxPages() {
      return Math.ceil(this.itemCount / this.count);
    },
    filteredCounts() {
      return this.allowedCounts.filter(this.filterCount);
    },
  },
  mounted() {
    this.count = this.allowedCounts[0];
    this.emitIndices();
  },
  methods: {
    filterCount(count) {
      if (count !== -1 && this.itemCount < count) {
        return false;
      }

      if (count === -1 && this.itemCount < this.allowedCounts[0]) {
        return false;
      }

      return true;
    },
    setPageNo(value) {
      value = parseInt(value);
      if (isNaN(value)) {
        return;
      }

      this.pageNo = Math.min(Math.max(1, value), this.maxPages);
      this.emitIndices();
    },
    setCount(count) {
      this.pageNo = 1;
      if (count === -1) {
        count = this.itemCount;
      }
      this.count = count;
      this.emitIndices();
    },
    emitIndices() {
      const indices = this.getSliceIndices();
      this.$emit('index-change', indices);
    },
    getSliceIndices() {
      const start = (this.pageNo - 1) * this.count;
      const end = this.pageNo * this.count;
      return { start, end };
    },
  },
});
</script>
