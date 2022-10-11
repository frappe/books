<template>
  <div
    id="tooltip"
    ref="tooltip"
    style="transition: opacity 100ms ease-in"
    :style="{ opacity }"
  >
    <slot></slot>
  </div>
</template>

<script>
import flip from '@popperjs/core/lib/modifiers/flip';
import offset from '@popperjs/core/lib/modifiers/offset';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import { createPopper } from '@popperjs/core/lib/popper-lite';

function generateGetBoundingClientRect(x = 0, y = 0) {
  return () => ({
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x,
  });
}

export default {
  props: {
    offset: { type: Number, default: 10 },
    placement: { type: String, default: 'auto' },
  },
  data() {
    return { popper: null, virtualElement: null, opacity: 0 };
  },
  methods: {
    create() {
      if (this.popper) {
        this.opacity = 1;
        return;
      }

      this.$refs.tooltip.setAttribute('data-show', '');
      this.virtualElement = {
        getBoundingClientRect: generateGetBoundingClientRect(-1000,-1000),
      };
      this.popper = createPopper(this.virtualElement, this.$refs.tooltip, {
        placement: this.placement,
        modifiers: [
          flip,
          preventOverflow,
          Object.assign(offset, { options: { offset: [0, this.offset] } }),
        ],
      });
      this.opacity = 1;
    },
    update({ clientX, clientY }) {
      if (!this.popper || !this.virtualElement) {
        return;
      }
      this.virtualElement.getBoundingClientRect = generateGetBoundingClientRect(
        clientX,
        clientY
      );
      this.popper.update();
    },
    destroy() {
      this.opacity = 0;
      this.$refs.tooltip.removeAttribute('data-show');
      this.popper?.destroy();
      this.virtualElement = null;
      this.popper = null;
    },
  },
};
</script>

<style scoped>
#tooltip {
  display: none;
}

#tooltip[data-show] {
  display: block;
}
</style>
