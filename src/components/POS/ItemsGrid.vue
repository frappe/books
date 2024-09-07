<template>
  <div
    class="
      flex flex-col
      gap-4
      p-4
      border
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
        v-for="item in items"
        :key="item.name"
        class="border border-gray-300 p-1 flex flex-col text-sm text-center"
        @click="handleChange(item as POSItem)"
      >
        <div
          class="self-center w-32 h-32 border border-gray-200 rounded-lg mb-2"
        >
          <div class="relative">
            <img
              v-if="item.image"
              :src="item.image"
              alt="hii"
              class="rounded-lg shadow-sm w-32 h-32 object-cover"
            />
            <div
              v-else
              class="rounded-lg w-32 h-32 flex justify-center items-center"
            >
              <p class="text-4xl font-semibold text-gray-400">
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
        <h3 class="text-lg font-medium mb-1">{{ item.name }}</h3>

        <p class="text-lg font-semibold mb-1">
          {{
            item.rate ? fyo.currencySymbols[item.rate.getCurrency()] : undefined
          }}
          {{ item.rate }}
        </p>

        <p class="font-medium">{{ item.unit }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { fyo } from 'src/initFyo';
import { ModelNameEnum } from 'models/types';
import { Item } from 'models/baseModels/Item/Item';
import { ItemQtyMap, POSItem } from './types';
import { Money } from 'pesa';

export default defineComponent({
  name: 'ItemsGrid',
  emits: ['addItem', 'updateValues'],
  setup() {
    return {
      itemQtyMap: inject('itemQtyMap') as ItemQtyMap,
    };
  },
  data() {
    return {
      items: [] as POSItem[],
    };
  },
  async mounted() {
    await this.setItems();
  },
  watch: {
    itemQtyMap: {
      async handler() {
        this.setItems();
      },
      deep: true,
    },
  },
  methods: {
    async setItems() {
      console.log('setItems');

      const items = (await fyo.db.getAll(ModelNameEnum.Item, {
        fields: [],
        filters: { trackItem: true },
      })) as Item[];

      this.items = [] as POSItem[];
      for (const item of items) {
        let availableQty = 0;

        if (!!this.itemQtyMap[item.name as string]) {
          availableQty = this.itemQtyMap[item.name as string].availableQty;
        }

        if (!item.name) {
          return;
        }

        this.items.push({
          availableQty,
          image: item?.image as string,
          name: item.name,
          rate: item.rate as Money,
          unit: item.unit as string,
          hasBatch: !!item.hasBatch,
          hasSerialNumber: !!item.hasSerialNumber,
        });
      }
      console.log(this.items, 'this.items');
    },
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
