<template>
  <div
    class="
      flex flex-col
      gap-4
      p-4
      items-center
      mt-4
      px-2
      rounded-t-md
      text-black
      w-full
    "
    style="height: 80vh"
  >
    <!-- Items Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
      <div
        class="
          border border-gray-300
          dark:border-gray-800
          p-1
          flex flex-col
          text-sm text-center
        "
        @click="handleChange(item as POSItem)"
        v-for="item in items as POSItem[]"
        :key="item.name"
      >
        <div class="self-center w-32 h-32 rounded-lg mb-1">
          <div class="relative">
            <img
              v-if="item.image"
              :src="item.image"
              alt=""
              class="rounded-lg w-32 h-32 object-cover"
            />
            <div
              v-else
              class="
                rounded-lg
                w-32
                h-32
                flex
                bg-gray-100
                dark:bg-gray-850
                justify-center
                items-center
              "
            >
              <p class="text-4xl font-semibold text-gray-400 select-none">
                {{ getExtractedWords(item.name) }}
              </p>
            </div>
            <p
              class="absolute top-1 right-1 rounded-full p-1"
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
import { fyo } from 'src/initFyo';
import { POSItem } from './types';

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
