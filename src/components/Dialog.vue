<template>
  <Teleport to="body">
    <Transition>
      <!-- Backdrop -->
      <div class="backdrop z-20 flex justify-center items-center" v-if="open">
        <!-- Dialog -->
        <div
          class="
            bg-white
            border
            rounded-lg
            text-gray-900
            p-4
            shadow-2xl
            w-dialog
            flex flex-col
            gap-4
            inner
          "
        >
          <h1 class="font-semibold">{{ title }}</h1>
          <p v-if="description" class="text-base">{{ description }}</p>
          <div class="flex justify-end gap-2">
            <Button
              v-for="(b, index) of buttons"
              :ref="b.isPrimary ? 'primary' : 'secondary'"
              :key="b.label"
              class="w-20"
              :type="b.isPrimary ? 'primary' : 'secondary'"
              @click="() => handleClick(index)"
            >
              {{ b.label }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script lang="ts">
import { DialogButton } from 'src/utils/types';
import { defineComponent, nextTick, PropType, ref } from 'vue';
import Button from './Button.vue';

export default defineComponent({
  setup() {
    return {
      primary: ref<InstanceType<typeof Button>[] | null>(null),
      secondary: ref<InstanceType<typeof Button>[] | null>(null),
    };
  },
  data() {
    return { open: false };
  },
  props: {
    title: { type: String, required: true },
    description: {
      type: String,
      required: false,
    },
    buttons: {
      type: Array as PropType<DialogButton[]>,
      required: true,
    },
  },
  watch: {
    open(value) {
      if (value) {
        document.addEventListener('keydown', this.handleEscape);
      } else {
        document.removeEventListener('keydown', this.handleEscape);
      }
    },
  },
  async mounted() {
    await nextTick(() => {
      this.open = true;
    });

    this.focusButton();
  },
  methods: {
    focusButton() {
      let button = this.primary?.[0];
      if (!button) {
        button = this.secondary?.[0];
      }

      if (!button) {
        return;
      }

      button.$el.focus();
    },
    handleEscape(event: KeyboardEvent) {
      if (event.code !== 'Escape') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (this.buttons.length === 1) {
        return this.handleClick(0);
      }

      const index = this.buttons.findIndex(
        ({ isPrimary, isEscape }) =>
          isEscape || (this.buttons.length === 2 && !isPrimary)
      );

      if (index === -1) {
        return;
      }

      return this.handleClick(index);
    },
    handleClick(index: number) {
      const button = this.buttons[index];
      button.handler();
      this.open = false;
    },
  },
  components: { Button },
});
</script>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: all 100ms ease-out;
}

.inner {
  transition: all 150ms ease-out;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.v-enter-from .inner,
.v-leave-to .inner {
  transform: translateY(-50px);
}

.v-enter-to .inner,
.v-leave-from .inner {
  transform: translateY(0px);
}
</style>
