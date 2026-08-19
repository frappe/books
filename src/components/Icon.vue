<template>
  <component
    v-bind="$attrs"
    :is="iconComponent"
    :class="iconClasses"
    :active="active"
    :darkMode="darkMode"
  />
</template>

<script lang="ts">
import icons12 from './Icons/12';
import icons18 from './Icons/18';
import icons24 from './Icons/24';
import icons8 from './Icons/8';

const components = {
  8: icons8,
  12: icons12,
  18: icons18,
  24: icons24,
} as const;

type IconSize = '8' | '12' | '18' | '24';
export default {
  name: 'Icon',
  props: {
    name: { type: String, required: true },
    active: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
    size: {
      type: String,
      required: true,
    },
    height: Number,
  },
  computed: {
    iconComponent() {
      const map = components[this.size as IconSize];
      return map[this.name as keyof typeof map] ?? null;
    },
    iconClasses() {
      let sizeClass = {
        8: 'w-2 h-2',
        12: 'w-3 h-3',
        16: 'w-4 h-4',
        18: 'w-5 h-5',
        24: 'w-6 h-6',
      }[this.size];

      if (this.height) {
        sizeClass = `w-${this.height} h-${this.height}`;
      }

      return [sizeClass, 'fill-current'];
    },
  },
};
</script>
