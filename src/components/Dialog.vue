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
          <div class="flex justify-between items-center">
            <h1 class="font-semibold">{{ title }}</h1>
            <FeatherIcon
              :name="config.iconName"
              class="w-6 h-6"
              :class="config.iconColor"
            />
          </div>
          <p v-if="detail" class="text-base">{{ detail }}</p>
          <div class="flex justify-end gap-4 mt-4">
            <Button
              v-for="(b, index) of buttons"
              :ref="b.isPrimary ? 'primary' : 'secondary'"
              :key="b.label"
              style="min-width: 5rem"
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
import { getIconConfig } from 'src/utils/interactive';
import { DialogButton, ToastType } from 'src/utils/types';
import { defineComponent, nextTick, PropType, ref } from 'vue';
import Button from './Button.vue';
import FeatherIcon from './FeatherIcon.vue';

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
    type: { type: String as PropType<ToastType>, default: 'info' },
    title: { type: String, required: true },
    detail: {
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
  computed: {
    config() {
      return getIconConfig(this.type);
    },
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

      const index = this.buttons.findIndex(({ isEscape }) => isEscape);

      if (index === -1) {
        return;
      }

      return this.handleClick(index);
    },
    handleClick(index: number) {
      const button = this.buttons[index];
      button.action();
      this.open = false;
    },
  },
  components: { Button, FeatherIcon },
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
