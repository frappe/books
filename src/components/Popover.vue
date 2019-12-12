<template>
  <div ref="reference">
    <div class="h-full">
      <slot name="target" :toggleDropdown="toggleDropdown"></slot>
    </div>
    <portal to="popovers">
      <div
        ref="popover"
        :class="popoverClass"
        class="mt-1 bg-white rounded border min-w-40 shadow-md"
        v-show="isOpen"
      >
        <slot name="content" :toggleDropdown="toggleDropdown"></slot>
      </div>
    </portal>
  </div>
</template>

<script>
import Popper from 'popper.js';

export default {
  name: 'Popover',
  props: {
    right: Boolean,
    popoverClass: [String, Object, Array]
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
    document.addEventListener('click', listener);
    this.$once('hook:beforeDestroy', () => {
      document.removeEventListener('click', listener);
    });
  },
  beforeDestroy() {
    this.popper && this.popper.destroy();
  },
  methods: {
    setupPopper() {
      if (!this.popper) {
        this.popper = new Popper(this.$refs.reference, this.$refs.popover, {
          placement: this.right ? 'bottom-end' : 'bottom-start'
        });
      } else {
        this.popper.scheduleUpdate();
      }
    },
    toggleDropdown(flag) {
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
