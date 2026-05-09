<template>
  <Modal :open-modal="true" @closemodal="$emit('close')">
    <div class="p-6 w-96 flex flex-col gap-5">
      <!-- Header -->
      <div>
        <h2 class="text-base font-semibold dark:text-white">
          {{ t`Customize Dashboard` }}
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ t`Choose a preset or toggle widgets individually.` }}
        </p>
      </div>

      <!-- Preset profile cards -->
      <div>
        <p
          class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
        >
          {{ t`Presets` }}
        </p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="profile in PRESET_PROFILES"
            :key="profile"
            class="rounded-lg border px-3 py-2 text-sm text-left transition-colors"
            :class="
              activeProfile === profile
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:border-gray-500'
            "
            @click="applyProfile(profile)"
          >
            <div class="font-medium leading-snug">{{ profile }}</div>
            <div class="text-xs text-gray-400 mt-0.5">
              {{ PROFILE_LAYOUTS[profile].length }}&nbsp;{{ t`widgets` }}
            </div>
          </button>
        </div>
      </div>

      <!-- Widget list -->
      <div>
        <p
          class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
        >
          {{ t`Widgets` }}
        </p>
        <div class="flex flex-col gap-1.5">
          <div
            v-for="(cfg, idx) in localLayout"
            :key="cfg.id"
            class="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
            :class="
              cfg.visible
                ? 'border-gray-200 dark:border-gray-700'
                : 'border-dashed border-gray-200 dark:border-gray-750 opacity-50'
            "
          >
            <!-- Visibility checkbox -->
            <input
              type="checkbox"
              class="w-4 h-4 cursor-pointer accent-blue-500 shrink-0"
              :checked="cfg.visible"
              @change="toggleWidget(idx)"
            />

            <!-- Labels -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium dark:text-white truncate">
                {{ WIDGET_META[cfg.id].label }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ WIDGET_META[cfg.id].description }}
              </p>
            </div>

            <!-- Width badge -->
            <span
              class="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0"
            >
              {{
                WIDGET_META[cfg.id].width === 'full' ? t`Full` : t`Half`
              }}
            </span>

            <!-- Reorder buttons -->
            <div class="flex flex-col gap-0.5 shrink-0">
              <button
                :disabled="idx === 0"
                class="disabled:opacity-20 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                @click="moveUp(idx)"
              >
                <FeatherIcon name="chevron-up" class="w-3.5 h-3.5" />
              </button>
              <button
                :disabled="idx === localLayout.length - 1"
                class="disabled:opacity-20 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                @click="moveDown(idx)"
              >
                <FeatherIcon name="chevron-down" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex justify-between items-center pt-2 border-t dark:border-gray-700"
      >
        <button
          class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="resetToDefault"
        >
          {{ t`Reset to default` }}
        </button>
        <div class="flex gap-2">
          <Button @click="$emit('close')">{{ t`Cancel` }}</Button>
          <Button type="primary" :disabled="saving" @click="save">
            {{ t`Save` }}
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import Modal from 'src/components/Modal.vue';
import { fyo } from 'src/initFyo';
import { defineComponent, PropType } from 'vue';
import {
  DashboardProfile,
  DEFAULT_LAYOUT,
  PRESET_PROFILES,
  PROFILE_LAYOUTS,
  profileToLayout,
  WIDGET_META,
  WidgetConfig,
} from './types';

export default defineComponent({
  name: 'DashboardCustomizePanel',
  components: { Modal, Button, FeatherIcon },

  props: {
    layout: {
      type: Array as PropType<WidgetConfig[]>,
      required: true,
    },
    currentProfile: {
      type: String as PropType<DashboardProfile>,
      default: 'Custom',
    },
  },

  emits: ['close', 'saved'],

  data() {
    return {
      localLayout: this.layout.map((c) => ({ ...c })) as WidgetConfig[],
      activeProfile: this.currentProfile as DashboardProfile,
      saving: false,
      WIDGET_META,
      PRESET_PROFILES,
      PROFILE_LAYOUTS,
    };
  },

  methods: {
    toggleWidget(idx: number) {
      const cfg = this.localLayout[idx];
      this.localLayout[idx] = { ...cfg, visible: !cfg.visible };
      this.activeProfile = 'Custom';
    },

    moveUp(idx: number) {
      if (idx === 0) return;
      const copy = [...this.localLayout];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      this.localLayout = copy;
      this.activeProfile = 'Custom';
    },

    moveDown(idx: number) {
      if (idx === this.localLayout.length - 1) return;
      const copy = [...this.localLayout];
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      this.localLayout = copy;
      this.activeProfile = 'Custom';
    },

    applyProfile(profile: Exclude<DashboardProfile, 'Custom'>) {
      this.activeProfile = profile;
      this.localLayout = profileToLayout(profile);
    },

    resetToDefault() {
      this.activeProfile = 'Custom';
      this.localLayout = DEFAULT_LAYOUT.map((c) => ({ ...c }));
    },

    async save() {
      this.saving = true;
      try {
        const doc = await fyo.doc.getDoc(ModelNameEnum.DashboardSettings);
        await doc.setMultiple({
          widgetLayout: JSON.stringify(this.localLayout),
          activeProfile: this.activeProfile,
        });
        await doc.sync();
        this.$emit('saved', [...this.localLayout], this.activeProfile);
        this.$emit('close');
      } finally {
        this.saving = false;
      }
    },
  },
});
</script>
