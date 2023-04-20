<template>
  <div ref="reference">
    <div class="h-full">
      <slot name="target" :togglePopover="togglePopover"></slot>
    </div>
    <Transition>
      <div
        ref="popover"
        :class="popoverClass"
        class="
          bg-white
          rounded-md
          border
          shadow-lg
          popover-container
          relative
          z-10
        "
        :style="{ 'transition-delay': `${isOpen ? entryDelay : exitDelay}ms` }"
        v-show="isOpen"
      >
        <slot name="content" :togglePopover="togglePopover"></slot>
      </div>
    </Transition>
  </div>
</template>
<script lang="ts">
import {
  Placement as PopperPlacement,
  Instance as PopperInstance,
  createPopper,
} from '@popperjs/core';
import { ref } from 'vue';
import { PropType } from 'vue';
import { defineComponent } from 'vue';
import { nextTick } from 'vue';

export default defineComponent({
  setup() {
    return {
      reference: ref<HTMLDivElement | null>(null),
      popover: ref<HTMLDivElement | null>(null),
    };
  },
  name: 'Popover',
  emits: ['open', 'close'],
  props: {
    showPopup: Boolean as PropType<boolean | null>,
    entryDelay: { type: Number, default: 0 },
    exitDelay: { type: Number, default: 0 },
    placement: {
      type: String as PropType<PopperPlacement>,
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
      listener: null,
      popper: null,
    } as {
      isOpen: boolean;
      listener: EventListener | null;
      popper: PopperInstance | null;
    };
  },
  mounted() {
    this.listener = (e) => {
      const refs = [this.reference, this.popover];
      const insideClick = refs.some((ref) => {
        if (!ref || !(e.target instanceof Node)) {
          return false;
        }

        return e.target === ref || ref.contains(e.target);
      });

      if (insideClick) {
        return;
      }
      this.close();
    };

    if (this.showPopup == null) {
      document.addEventListener('click', this.listener);
    }
  },
  beforeUnmount() {
    if (this.popper) {
      this.popper.destroy();
    }

    if (this.listener) {
      document.removeEventListener('click', this.listener);
      this.listener = null;
    }
  },
  methods: {
    setupPopper() {
      if (this.popper) {
        this.popper.update();
        return;
      }

      if (!this.reference || !this.popover) {
        return;
      }

      this.popper = createPopper(this.reference, this.popover, {
        placement: this.placement,
        modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
      });
    },
    togglePopover(flag?: unknown) {
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
  },
});
</script>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 150ms ease-out;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
