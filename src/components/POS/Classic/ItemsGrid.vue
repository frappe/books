<template>
  <div
    class="
      gap-4
      py-2
      w-full
      flex flex-col
      items-center
      rounded-t-md
      text-black
      overflow-y-auto
      custom-scroll custom-scroll-thumb2
    "
    style="height: 83vh"
  >
    <!-- Items Grid -->
    <div
      class="
        gap-2
        w-full
        grid grid-cols-1
        md:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >
      <div
        class="
          p-1
          border border-gray-300
          flex flex-col
          text-sm text-center
          dark:border-gray-800
        "
        @click="handleChange(item as POSItem)"
        v-for="item in items as POSItem[]"
        :key="item.name"
      >
        <div class="self-center w-32 h-32 p-1 rounded-lg">
          <div class="relative w-full h-full p-2">
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
                w-full
                h-full
                bg-gray-100
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
                absolute
                top-1
                right-1
                rounded-full
                w-6
                h-6
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
  name: 'ItemsGrid',
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
