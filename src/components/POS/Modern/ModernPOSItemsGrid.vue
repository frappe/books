<template>
  <div
    class="
      flex flex-col
      items-center
      gap-4
      my-3
      px-4
      py-2
      rounded-t-md
      text-black
      w-full
      overflow-y-auto
      custom-scroll custom-scroll-thumb2
    "
    style="height: 80vh"
  >
    <!-- Items Grid -->
    <div
      class="
        gap-2
        w-full
        grid grid-cols-1
        sm:grid-cols-2
        md:grid-cols-4
        lg:grid-cols-6
        xl:grid-cols-7'
      "
    >
      <div
        class="
          pb-3
          border border-gray-300
          dark:border-gray-800
          flex flex-col
          text-sm text-center
        "
        @click="handleChange(item as POSItem)"
        v-for="item in items as POSItem[]"
        :key="item.name"
      >
        <div class="self-center w-full h-32 lg:h-28 p-1 rounded-lg">
          <div class="relative w-auto h-full">
            <img
              v-if="item.image"
              :src="item.image"
              alt=""
              class="rounded-lg w-full h-full object-cover"
            />

            <div
              v-else
              class="
                rounded-lg
                bg-gray-100
                w-full
                h-full
                flex
                justify-center
                items-center
                dark:bg-gray-850
              "
            >
              <p class="text-4xl font-semibold text-gray-400 select-none">
                {{ getExtractedWords(item.name) }}
              </p>
            </div>
            <p
              class="
                w-6
                h-6
                top-1
                right-1
                absolute
                rounded-full
                flex
                justify-center
                items-center
              "
              :class="
                item.availableQty > 0
                  ? 'bg-green-100 text-green-900'
                  : 'bg-red-100 text-red-900'
              "
            >
              {{ item.availableQty }}
            </p>
          </div>
        </div>
        <h3 class="text-lg font-medium dark:text-white">{{ item.name }}</h3>

        <p class="text-lg font-medium dark:text-white">
          {{
            item.rate ? fyo.currencySymbols[item.rate.getCurrency()] : undefined
          }}
          {{ item.rate }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { POSItem } from '../types';

export default defineComponent({
  name: 'ModernPOSItemsGrid',
  emits: ['addItem', 'updateValues'],
  props: {
    items: {
      type: Array,
    },
    itemQtyMap: {
      type: Object,
    },
  },
  methods: {
    getExtractedWords(item: string) {
      const initials = item.split(' ').map((word) => {
        return word[0].toUpperCase();
      });
      return initials.join('');
    },
    handleChange(value: POSItem) {
      this.$emit('addItem', value);
      this.$emit('updateValues');
    },
  },
});
</script>
