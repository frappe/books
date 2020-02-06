<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <Popover placement="bottom-end">
      <template v-slot:target="{ togglePopover }">
        <div
          tabindex="0"
          :class="inputClasses"
          @click="!isReadOnly && togglePopover()"
        >
          <div class="flex items-center">
            <div
              v-if="value"
              class="w-3 h-3 rounded mr-1"
              :style="{ backgroundColor: value }"
            ></div>
            <span v-if="value">
              {{ selectedColorLabel }}
            </span>
            <span class="text-gray-400" v-else>
              {{ inputPlaceholder }}
            </span>
          </div>
        </div>
      </template>
      <div class="text-sm py-3 px-2 text-center" slot="content">
        <div>
          <Row class="border-none" :column-count="5" gap="0.5rem">
            <div
              v-for="color in colors"
              :key="color.value"
              class="w-4 h-4 rounded cursor-pointer"
              :style="{ backgroundColor: color.value }"
              @click="setColorValue(color.value)"
            ></div>
          </Row>
        </div>
        <div class="mt-3 w-28">
          <input
            type="text"
            :placeholder="_('Custom Hex')"
            :class="inputClasses"
            :value="value"
            @change="e => setColorValue(e.target.value)"
            class="bg-gray-100"
          />
        </div>
      </div>
    </Popover>
  </div>
</template>

<script>
import Base from './Base';
import Row from '@/components/Row';
import Popover from '@/components/Popover';

export default {
  name: 'Color',
  extends: Base,
  components: {
    Popover,
    Row
  },
  methods: {
    setColorValue(value) {
      if (!value.startsWith('#')) {
        value = '#' + value;
      }
      if (/^#[0-9A-F]{6}$/i.test(value)) {
        this.triggerChange(value);
      }
    }
  },
  computed: {
    colors() {
      return this.df.colors;
    },
    selectedColorLabel() {
      let color = this.colors.find(c => this.value === c.value);
      return color ? color.label : this.value;
    }
  }
};
</script>
