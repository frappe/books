<template>
  <div
    class="h-full bg-gray-300 transition-opacity hover:opacity-100"
    :class="resizing ? 'opacity-100' : 'opacity-0'"
    style="width: 3px; cursor: col-resize; margin-left: -3px"
    @mousedown="onMouseDown"
    ref="hr"
  >
    <MouseFollower
      :show="resizing"
      placement="left"
      class="
        p-1
        bg-white
        border
        rounded
        shadow
        text-sm text-center text-gray-800
      "
      style="min-width: 2rem"
    >
      {{ value }}
    </MouseFollower>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import MouseFollower from './MouseFollower.vue';

export default defineComponent({
  emits: ['resize'],
  props: { initialX: Number, minX: Number, maxX: Number },
  data() {
    return {
      x: 0,
      delta: 0,
      resizing: false,
      listener: null,
    };
  },
  methods: {
    onMouseDown(e: MouseEvent) {
      e.preventDefault();
      const { clientX } = e;

      this.setX(clientX);
      this.setResizing(true);

      document.addEventListener('mousemove', this.mouseMoveListener);
      document.addEventListener('mouseup', this.mouseUpListener);
    },
    mouseUpListener(e: MouseEvent) {
      e.preventDefault();
      const { clientX } = e;

      this.setX(clientX);
      this.setResizing(false);

      this.emitValue(this.x - clientX);
      this.removeListeners();
    },
    mouseMoveListener(e: MouseEvent) {
      e.preventDefault();
      const { clientX } = e;
      this.delta = this.x - clientX;
    },
    removeListeners() {
      document.removeEventListener('mousemove', this.mouseMoveListener);
      document.removeEventListener('mouseup', this.mouseUpListener);
    },
    setResizing(value: boolean) {
      this.resizing = value;

      if (value) {
        this.delta = 0;
        document.body.style.cursor = 'col-resize';
      } else {
        document.body.style.cursor = '';
      }
    },
    setX(x?: number): void {
      if (typeof x === 'number') {
        this.x = x;
        return;
      }
      const hr = this.$refs.hr;
      if (!(hr instanceof HTMLDivElement)) {
        return;
      }
      this.x = hr.getBoundingClientRect().x;
    },
    emitValue(delta: number) {
      if (typeof this.minDelta === 'number') {
        delta = Math.max(delta, this.minDelta);
      }

      if (typeof this.maxDelta === 'number') {
        delta = Math.min(delta, this.maxDelta);
      }

      this.$emit('resize', delta, this.value);
    },
  },
  computed: {
    value() {
      if (typeof this.initialX !== 'number') {
        return this.delta;
      }

      let value = this.delta + this.initialX;
      if (typeof this.minX === 'number') {
        value = Math.max(this.minX, value);
      }

      if (typeof this.maxX === 'number') {
        value = Math.min(this.maxX, value);
      }

      return value;
    },
    minDelta() {
      if (typeof this.minX !== 'number' || typeof this.initialX !== 'number') {
        return null;
      }

      return this.initialX - this.minX;
    },
    maxDelta() {
      if (typeof this.maxX !== 'number' || typeof this.initialX !== 'number') {
        return null;
      }

      return this.maxX - this.initialX;
    },
  },
  components: { MouseFollower },
});
</script>
