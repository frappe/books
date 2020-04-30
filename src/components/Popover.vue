<template>
  <div ref="reference">
    <div class="h-full">
      <slot name="target" :togglePopover="togglePopover"></slot>
    </div>
    <portal to="popovers">
      <div
        ref="popover"
        :class="popoverClass"
        class="bg-white rounded border shadow-md popover-container relative"
        v-show="isOpen"
      >
        <div v-if="!hideArrow" class="popover-arrow" ref="popover-arrow"></div>
        <slot name="content" :togglePopover="togglePopover"></slot>
      </div>
    </portal>
  </div>
</template>

<script>
import { createPopper } from '@popperjs/core';

export default {
  name: 'Popover',
  props: {
    hideArrow: {
      type: Boolean,
      default: false
    },
    showPopup: {
      default: null
    },
    right: Boolean,
    placement: {
      type: String,
      default: 'bottom-start'
    },
    popoverClass: [String, Object, Array]
  },
  watch: {
    showPopup(value) {
      if (value === true) {
        this.open();
      }
      if (value === false) {
        this.close();
      }
    }
  },
  data() {
    return {
      isOpen: false
    };
  },
  mounted() {
    let listener = e => {
      let $els = [this.$refs.reference, this.$refs.popover];
      let insideClick = $els.some(
        $el => $el && (e.target === $el || $el.contains(e.target))
      );
      if (insideClick) {
        return;
      }
      this.close();
    };
    if (this.show == null) {
      document.addEventListener('click', listener);
      this.$once('hook:beforeDestroy', () => {
        document.removeEventListener('click', listener);
      });
    }
  },
  beforeDestroy() {
    this.popper && this.popper.destroy();
  },
  methods: {
    setupPopper() {
      if (!this.popper) {
        this.popper = createPopper(this.$refs.reference, this.$refs.popover, {
          placement: this.placement,
          modifiers: !this.hideArrow
            ? [
                {
                  name: 'arrow',
                  options: {
                    element: this.$refs['popover-arrow']
                  }
                },
                {
                  name: 'offset',
                  options: {
                    offset: [0, 10]
                  }
                }
              ]
            : []
        });
      } else {
        this.popper.update();
      }
    },
    togglePopover(flag) {
      if (flag == null) {
        flag = !this.isOpen;
      }
      flag = Boolean(flag);
      if (flag) {
        this.open();
      } else {
        this.close();
      }
    },
    open() {
      if (this.isOpen) {
        return;
      }
      this.isOpen = true;
      this.$nextTick(() => {
        this.setupPopper();
      });
      this.$emit('open');
    },
    close() {
      if (!this.isOpen) {
        return;
      }
      this.isOpen = false;
      this.$emit('close');
    }
  }
};
</script>
<style scoped>
.popover-arrow,
.popover-arrow::after {
  position: absolute;
  width: theme('spacing.4');
  height: theme('spacing.4');
  z-index: -1;
}

.popover-arrow::after {
  content: '';
  background: white;
  transform: rotate(45deg);
}

.popover-container[data-popper-placement^='top'] > .popover-arrow {
  bottom: calc(theme('spacing.2') * -1);
}

.popover-container[data-popper-placement^='top'] > .popover-arrow::after {
  border-bottom: 1px solid theme('borderColor.gray.400');
  border-right: 1px solid theme('borderColor.gray.400');
  border-bottom-right-radius: 6px;
}

.popover-container[data-popper-placement^='bottom'] > .popover-arrow {
  top: calc(theme('spacing.2') * -1);
}

.popover-container[data-popper-placement^='bottom'] > .popover-arrow::after {
  border-top: 1px solid theme('borderColor.gray.400');
  border-left: 1px solid theme('borderColor.gray.400');
  border-top-left-radius: 6px;
}

.popover-container[data-popper-placement^='left'] > .popover-arrow {
  right: calc(theme('spacing.2') * -1);
}

.popover-container[data-popper-placement^='right'] > .popover-arrow {
  left: calc(theme('spacing.2') * -1);
}
</style>
