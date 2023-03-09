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
        px-1
        py-0.5
        border
        rounded-md
        shadow
        text-sm text-center
        bg-gray-900
        text-gray-100
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
  props: {
    initialX: { type: Number, required: true },
    minX: Number,
    maxX: Number,
  },
  data() {
    return {
      x: 0,
      delta: 0,
      xOnMouseDown: 0,
      resizing: false,
      listener: null,
    };
  },
  methods: {
    onMouseDown(e: MouseEvent) {
      e.preventDefault();

      this.x = e.clientX;
      this.xOnMouseDown = this.initialX;
      this.setResizing(true);

      document.addEventListener('mousemove', this.mouseMoveListener);
      document.addEventListener('mouseup', this.mouseUpListener);
    },
    mouseUpListener(e: MouseEvent) {
      e.preventDefault();

      this.x = e.clientX;
      this.setResizing(false);

      this.$emit('resize', this.value);
      this.removeListeners();
    },
    mouseMoveListener(e: MouseEvent) {
      e.preventDefault();
      this.delta = this.x - e.clientX;
      this.$emit('resize', this.value);
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
  },
  computed: {
    value() {
      let value = this.delta + this.xOnMouseDown;
      if (typeof this.minX === 'number') {
        value = Math.max(this.minX, value);
      }

      if (typeof this.maxX === 'number') {
        value = Math.min(this.maxX, value);
      }

      return value;
    },
    minDelta() {
      if (typeof this.minX !== 'number') {
        return null;
      }

      return this.initialX - this.minX;
    },
    maxDelta() {
      if (typeof this.maxX !== 'number') {
        return null;
      }

      return this.maxX - this.initialX;
    },
  },
  components: { MouseFollower },
});
</script>
