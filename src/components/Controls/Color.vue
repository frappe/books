<template>
  <div>
    <div :class="labelClasses" v-if="showLabel">
      {{ df.label }}
    </div>
    <Popover placement="bottom-end">
      <template #target="{ togglePopover }">
        <div
          tabindex="0"
          :class="[inputClasses, containerClasses]"
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
      <template #content>
        <div class="text-sm p-2 text-center">
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
              :placeholder="t`Custom Hex`"
              :class="[inputClasses, containerClasses]"
              :value="value"
              @change="(e) => setColorValue(e.target.value)"
            />
          </div>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script>
import Popover from 'src/components/Popover';
import Row from 'src/components/Row';
import Base from './Base';

export default {
  name: 'Color',
  extends: Base,
  components: {
    Popover,
    Row,
  },
  methods: {
    setColorValue(value) {
      if (!value.startsWith('#')) {
        value = '#' + value;
      }
      if (/^#[0-9A-F]{6}$/i.test(value)) {
        this.triggerChange(value);
      }
    },
  },
  computed: {
    colors() {
      return this.df.options;
    },
    selectedColorLabel() {
      const color = this.colors.find((c) => this.value === c.value);
      return color ? color.label : this.value;
    },
  },
};
</script>
