<template>
  <div class="overflow-hidden" :style="outerContainerStyle">
    <div :style="innerContainerStyle">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
/**
 * This Component is required because * CSS transforms (eg
 * scale) don't change the area taken by * an element.
 *
 * So to circumvent this, the outer element needs to have
 * the scaled dimensions without applying a CSS transform.
 */

export default defineComponent({
  props: {
    height: { type: String, default: '29.7cm' },
    width: { type: String, default: '21cm' },
    scale: { type: Number, default: 0.65 },
  },
  computed: {
    innerContainerStyle(): Record<string, string> {
      const style: Record<string, string> = {};
      style['width'] = this.width;
      style['height'] = this.height;
      style['transform'] = `scale(${this.scale})`;
      style['margin-top'] = `calc(-1 * (${this.height} * ${
        1 - this.scale
      }) / 2)`;
      style['margin-left'] = `calc(-1 * (${this.width} * ${
        1 - this.scale
      }) / 2)`;

      return style;
    },
    outerContainerStyle(): Record<string, string> {
      const style: Record<string, string> = {};
      style['height'] = `calc(${this.scale} * ${this.height})`;
      style['width'] = `calc(${this.scale} * ${this.width})`;

      return style;
    },
  },
});
</script>
