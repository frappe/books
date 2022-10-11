<template>
  <div ref="reference">
    <div class="h-full">
      <slot
        name="target"
        :togglePopover="togglePopover"
        :handleBlur="handleBlur"
      ></slot>
    </div>
    <div
      ref="popover"
      :class="popoverClass"
      class="bg-white rounded border shadow-lg popover-container relative z-10"
      v-show="isOpen"
    >
      <slot name="content" :togglePopover="togglePopover"></slot>
    </div>
  </div>
</template>

<script>
import { createPopper } from '@popperjs/core';
import { nextTick } from 'vue';

export default {
  name: 'Popover',
  emits: ['open', 'close'],
  props: {
    showPopup: {
      default: null,
    },
    right: Boolean,
    placement: {
      type: String,
      default: 'bottom-start',
    },
    popoverClass: [String, Object, Array],
  },
  watch: {
    showPopup(value) {
      if (value === true) {
        this.open();
      }
      if (value === false) {
        this.close();
      }
    },
  },
  data() {
    return {
      isOpen: false,
    };
  },
  mounted() {
    this.listener = (e) => {
      let $els = [this.$refs.reference, this.$refs.popover];
      let insideClick = $els.some(
        ($el) => $el && (e.target === $el || $el.contains(e.target))
      );
      if (insideClick) {
        return;
      }
      this.close();
    };

    if (this.show == null) {
      document.addEventListener('click', this.listener);
    }
  },
  beforeUnmount() {
    this.popper && this.popper.destroy();
    if (this.listener) {
      document.removeEventListener('click', this.listener);
      delete this.listener;
    }
  },
  methods: {
    setupPopper() {
      if (!this.popper) {
        this.popper = createPopper(this.$refs.reference, this.$refs.popover, {
          placement: this.placement,
          modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
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
      nextTick(() => {
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
    },
    handleBlur({ relatedTarget }) {
      relatedTarget && this.close();
    },
  },
};
</script>
