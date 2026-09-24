<template>
  <Modal :open-modal="true" @closemodal="$emit('close')">
    <div class="flex flex-col" style="width: 580px; max-height: 88vh">
      <!-- ── Top band (never scrolls) ───────────────────────────────────── -->
      <div class="px-6 pt-6 pb-0 flex flex-col gap-5 shrink-0">
        <!-- ── 1. Header ───────────────────────────────────────────────────── -->
        <div>
          <h2 class="text-base font-semibold dark:text-white">
            {{ t`Customize Dashboard` }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{
              t`Drag widgets to reorder the layout. Drop into Hidden to remove.`
            }}
          </p>
        </div>

        <!-- ── 2. Preset profile cards ────────────────────────────────────── -->
        <div>
          <p
            class="
              text-xs
              font-medium
              text-gray-500
              dark:text-gray-400
              uppercase
              tracking-wider
              mb-2
            "
          >
            {{ t`Presets` }}
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="profile in PRESET_PROFILES"
              :key="profile"
              class="
                rounded-lg
                border
                px-3
                py-2
                text-sm text-left
                transition-colors
              "
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

        <!-- ── 3. Active Widgets label (pinned, not scrolled) ───────────────── -->
        <p
          class="
            text-xs
            font-medium
            text-gray-500
            dark:text-gray-400
            uppercase
            tracking-wider
          "
        >
          {{ t`Active Widgets` }}
        </p>
      </div>
      <!-- end top band -->

      <!-- ── 3. Active Widgets canvas (this section scrolls independently) ── -->
      <div class="overflow-y-auto flex-1 min-h-0 px-6 py-3">
        <!-- Canvas drop target (fallback) -->
        <div
          class="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-1.5"
          @drop.prevent="onCanvasDrop"
          @dragover.prevent
        >
          <!-- Empty: nothing visible, not dragging -->
          <div
            v-if="localVisibleOrder.length === 0 && !isDragging"
            class="h-24 flex items-center justify-center text-sm text-gray-400"
          >
            {{ t`No active widgets` }}
          </div>

          <!-- Empty: nothing visible, dragging — full-area drop zone -->
          <div
            v-else-if="localVisibleOrder.length === 0 && isDragging"
            class="
              h-24
              flex
              items-center
              justify-center
              text-sm
              font-medium
              rounded-lg
              border-2 border-dashed border-blue-400
              bg-blue-50
              dark:bg-blue-950
              text-blue-500
              cursor-copy
            "
            @dragenter.prevent="dropTargetIdx = 0"
            @dragover.prevent
            @drop.prevent.stop="commitDrop(0)"
          >
            {{ t`Drop here to add` }}
          </div>

          <!-- Populated canvas with interleaved drop zones and widget rows -->
          <template v-else>
            <!-- Drop zone BEFORE first row (index 0) -->
            <div
              class="mx-2 my-1 rounded-full overflow-hidden transition-all"
              :class="isDragging ? 'h-8' : 'h-0'"
              @dragenter.prevent="dropTargetIdx = 0"
              @dragover.prevent
              @drop.prevent.stop="commitDrop(0)"
            >
              <div
                class="
                  h-full
                  border-2 border-dashed
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-xs
                  transition-colors
                "
                :class="
                  dropTargetIdx === 0
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-500'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400'
                "
              >
                <span v-if="dropTargetIdx === 0">{{ t`Drop here` }}</span>
              </div>
            </div>

            <template v-for="row in previewRows" :key="row.ids.join('-')">
              <!-- ── FULL row ─────────────────────────────────────────── -->
              <div v-if="row.type === 'full'" class="p-1">
                <div
                  draggable="true"
                  class="
                    flex
                    items-center
                    gap-2
                    border
                    rounded-lg
                    px-3
                    py-2.5
                    select-none
                    transition-all
                    bg-white
                    dark:bg-gray-800
                  "
                  :class="
                    draggingId === row.ids[0]
                      ? 'opacity-40 cursor-grabbing border-blue-300'
                      : 'cursor-grab border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm'
                  "
                  @dragstart="startDrag(row.ids[0], $event)"
                  @dragend="endDrag"
                  @dragover.prevent
                >
                  <FeatherIcon
                    name="menu"
                    class="w-4 h-4 text-gray-300 shrink-0"
                  />
                  <FeatherIcon
                    :name="WIDGET_META[row.ids[0]].icon"
                    class="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium dark:text-white truncate">
                      {{ WIDGET_META[row.ids[0]].label }}
                    </p>
                    <p
                      class="text-xs text-gray-500 dark:text-gray-400 truncate"
                    >
                      {{ WIDGET_META[row.ids[0]].description }}
                    </p>
                  </div>
                  <span
                    class="
                      text-xs
                      px-1.5
                      py-0.5
                      rounded
                      bg-gray-100
                      dark:bg-gray-750
                      text-gray-500
                      dark:text-gray-400
                      shrink-0
                    "
                  >
                    {{
                      WIDGET_META[row.ids[0]].width === 'full'
                        ? t`Full`
                        : t`Half`
                    }}
                  </span>
                  <button
                    class="
                      text-gray-300
                      hover:text-red-400
                      transition-colors
                      shrink-0
                    "
                    @click="hideWidget(row.ids[0])"
                  >
                    <FeatherIcon name="x" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- ── HALF-PAIR row ───────────────────────────────────── -->
              <div
                v-else-if="row.type === 'half-pair'"
                class="flex gap-1.5 p-1"
              >
                <!-- Left card -->
                <div
                  class="flex-1"
                  draggable="true"
                  :class="[
                    'flex items-center gap-2 border rounded-lg px-3 py-2.5 select-none transition-all bg-white dark:bg-gray-800',
                    draggingId === row.ids[0]
                      ? 'opacity-40 cursor-grabbing border-blue-300'
                      : 'cursor-grab border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm',
                  ]"
                  @dragstart="startDrag(row.ids[0], $event)"
                  @dragend="endDrag"
                  @dragover.prevent
                >
                  <FeatherIcon
                    name="menu"
                    class="w-4 h-4 text-gray-300 shrink-0"
                  />
                  <FeatherIcon
                    :name="WIDGET_META[row.ids[0]].icon"
                    class="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium dark:text-white truncate">
                      {{ WIDGET_META[row.ids[0]].label }}
                    </p>
                    <!-- description intentionally omitted in half-pair to save space -->
                  </div>
                  <span
                    class="
                      text-xs
                      px-1.5
                      py-0.5
                      rounded
                      bg-gray-100
                      dark:bg-gray-750
                      text-gray-500
                      dark:text-gray-400
                      shrink-0
                    "
                  >
                    {{
                      WIDGET_META[row.ids[0]].width === 'full'
                        ? t`Full`
                        : t`Half`
                    }}
                  </span>
                  <button
                    class="
                      text-gray-300
                      hover:text-red-400
                      transition-colors
                      shrink-0
                    "
                    @click="hideWidget(row.ids[0])"
                  >
                    <FeatherIcon name="x" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Right card -->
                <div
                  class="flex-1"
                  draggable="true"
                  :class="[
                    'flex items-center gap-2 border rounded-lg px-3 py-2.5 select-none transition-all bg-white dark:bg-gray-800',
                    draggingId === row.ids[1]
                      ? 'opacity-40 cursor-grabbing border-blue-300'
                      : 'cursor-grab border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm',
                  ]"
                  @dragstart="startDrag(row.ids[1], $event)"
                  @dragend="endDrag"
                  @dragover.prevent
                >
                  <FeatherIcon
                    name="menu"
                    class="w-4 h-4 text-gray-300 shrink-0"
                  />
                  <FeatherIcon
                    :name="WIDGET_META[row.ids[1]].icon"
                    class="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium dark:text-white truncate">
                      {{ WIDGET_META[row.ids[1]].label }}
                    </p>
                    <!-- description intentionally omitted in half-pair to save space -->
                  </div>
                  <span
                    class="
                      text-xs
                      px-1.5
                      py-0.5
                      rounded
                      bg-gray-100
                      dark:bg-gray-750
                      text-gray-500
                      dark:text-gray-400
                      shrink-0
                    "
                  >
                    {{
                      WIDGET_META[row.ids[1]].width === 'full'
                        ? t`Full`
                        : t`Half`
                    }}
                  </span>
                  <button
                    class="
                      text-gray-300
                      hover:text-red-400
                      transition-colors
                      shrink-0
                    "
                    @click="hideWidget(row.ids[1])"
                  >
                    <FeatherIcon name="x" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- ── HALF-SOLO row ───────────────────────────────────── -->
              <div v-else class="flex gap-1.5 p-1">
                <!-- Card -->
                <div
                  class="flex-1"
                  draggable="true"
                  :class="[
                    'flex items-center gap-2 border rounded-lg px-3 py-2.5 select-none transition-all bg-white dark:bg-gray-800',
                    draggingId === row.ids[0]
                      ? 'opacity-40 cursor-grabbing border-blue-300'
                      : 'cursor-grab border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm',
                  ]"
                  @dragstart="startDrag(row.ids[0], $event)"
                  @dragend="endDrag"
                  @dragover.prevent
                >
                  <FeatherIcon
                    name="menu"
                    class="w-4 h-4 text-gray-300 shrink-0"
                  />
                  <FeatherIcon
                    :name="WIDGET_META[row.ids[0]].icon"
                    class="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium dark:text-white truncate">
                      {{ WIDGET_META[row.ids[0]].label }}
                    </p>
                    <p
                      class="text-xs text-gray-500 dark:text-gray-400 truncate"
                    >
                      {{ WIDGET_META[row.ids[0]].description }}
                    </p>
                  </div>
                  <span
                    class="
                      text-xs
                      px-1.5
                      py-0.5
                      rounded
                      bg-gray-100
                      dark:bg-gray-750
                      text-gray-500
                      dark:text-gray-400
                      shrink-0
                    "
                  >
                    {{
                      WIDGET_META[row.ids[0]].width === 'full'
                        ? t`Full`
                        : t`Half`
                    }}
                  </span>
                  <button
                    class="
                      text-gray-300
                      hover:text-red-400
                      transition-colors
                      shrink-0
                    "
                    @click="hideWidget(row.ids[0])"
                  >
                    <FeatherIcon name="x" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Pairing placeholder — also a live drop zone at row.endIdx -->
                <div
                  class="
                    flex-1
                    border-2 border-dashed
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    text-xs
                    py-2.5
                    transition-colors
                  "
                  :class="
                    dropTargetIdx === row.endIdx
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-500 cursor-copy'
                      : isDragging
                      ? 'border-blue-300 dark:border-blue-800 text-blue-400 dark:text-blue-600 cursor-copy'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400'
                  "
                  @dragenter.prevent="dropTargetIdx = row.endIdx"
                  @dragover.prevent
                  @drop.prevent.stop="commitDrop(row.endIdx)"
                >
                  {{
                    dropTargetIdx === row.endIdx
                      ? t`Drop to pair`
                      : t`Pair with a half widget`
                  }}
                </div>
              </div>

              <!-- Drop zone AFTER this row -->
              <div
                class="mx-2 my-1 rounded-full overflow-hidden transition-all"
                :class="isDragging ? 'h-8' : 'h-0'"
                @dragenter.prevent="dropTargetIdx = row.endIdx"
                @dragover.prevent
                @drop.prevent.stop="commitDrop(row.endIdx)"
              >
                <div
                  class="
                    h-full
                    border-2 border-dashed
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-xs
                    transition-colors
                  "
                  :class="
                    dropTargetIdx === row.endIdx
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400'
                  "
                >
                  <span v-if="dropTargetIdx === row.endIdx">
                    {{ t`Drop here` }}
                  </span>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
      <!-- end canvas scroll area -->

      <!-- ── Bottom band (never scrolls) ──────────────────────────────────── -->
      <div
        class="
          px-6
          pb-6
          pt-4
          flex flex-col
          gap-5
          shrink-0
          border-t
          dark:border-gray-800
        "
      >
        <!-- ── 4. Hidden Widgets tray ─────────────────────────────────────── -->
        <div>
          <p
            class="
              text-xs
              font-medium
              text-gray-500
              dark:text-gray-400
              uppercase
              tracking-wider
              mb-2
            "
          >
            {{ t`Hidden` }}
          </p>

          <div
            class="
              border-2 border-dashed
              rounded-xl
              p-2
              min-h-14
              flex flex-wrap
              gap-2
              items-center
              transition-colors
            "
            :class="
              isDragging && dragOverHidden
                ? 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950'
                : 'border-gray-200 dark:border-gray-700'
            "
            @dragenter.prevent="dragOverHidden = true"
            @dragover.prevent="dragOverHidden = true"
            @dragleave="dragOverHidden = false"
            @drop.prevent.stop="onHiddenDrop"
          >
            <template v-if="hiddenOrder.length > 0">
              <div
                v-for="id in hiddenOrder"
                :key="id"
                draggable="true"
                class="
                  flex
                  items-center
                  gap-1.5
                  border border-gray-200
                  dark:border-gray-700
                  rounded-lg
                  px-2.5
                  py-1.5
                  cursor-grab
                  select-none
                  bg-white
                  dark:bg-gray-800
                  transition-all
                "
                :class="
                  draggingId === id
                    ? 'opacity-40 cursor-grabbing border-blue-300'
                    : 'hover:border-blue-300 hover:shadow-sm'
                "
                @dragstart="startDrag(id, $event)"
                @dragend="endDrag"
              >
                <FeatherIcon
                  :name="WIDGET_META[id].icon"
                  class="w-3.5 h-3.5 text-gray-400"
                />
                <span class="text-sm font-medium dark:text-white">
                  {{ WIDGET_META[id].label }}
                </span>
                <span
                  class="
                    text-xs
                    px-1.5
                    py-0.5
                    rounded
                    bg-gray-100
                    dark:bg-gray-750
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  {{ WIDGET_META[id].width === 'full' ? t`Full` : t`Half` }}
                </span>
              </div>
            </template>

            <span v-else class="text-sm text-gray-400 px-1">
              {{
                isDragging ? t`Drop here to hide` : t`All widgets are active`
              }}
            </span>
          </div>
        </div>

        <!-- ── 5. Footer ──────────────────────────────────────────────────── -->
        <div class="flex justify-between items-center">
          <button
            class="
              text-sm text-gray-500
              hover:text-gray-700
              dark:text-gray-400 dark:hover:text-gray-200
            "
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
      <!-- end bottom band -->
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
  ALL_WIDGET_KEYS,
  applyWidgetDrop,
  buildPreviewRows,
  DashboardProfile,
  DEFAULT_LAYOUT,
  PreviewRow,
  PRESET_PROFILES,
  PROFILE_LAYOUTS,
  profileToLayout,
  WIDGET_META,
  WidgetConfig,
  WidgetKey,
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
      // Ordered list of visible widget keys — the single source of truth.
      localVisibleOrder: this.layout.filter((c) => c.visible).map((c) => c.id),

      activeProfile: this.currentProfile,

      // Drag state
      draggingId: null as WidgetKey | null,
      isDragging: false,
      dropTargetIdx: null as number | null,
      dragOverHidden: false,

      saving: false,

      // Expose constants to the template
      WIDGET_META,
      PRESET_PROFILES,
      PROFILE_LAYOUTS,
    };
  },

  computed: {
    /** All widget keys that are NOT in localVisibleOrder. */
    hiddenOrder(): WidgetKey[] {
      const visibleSet = new Set(this.localVisibleOrder);
      return ALL_WIDGET_KEYS.filter((id) => !visibleSet.has(id));
    },

    /** Rows for the layout preview, built from the shared pure function. */
    previewRows(): PreviewRow[] {
      return buildPreviewRows(this.localVisibleOrder);
    },

    /** Final layout array that will be persisted on save. */
    computedLayout(): WidgetConfig[] {
      return [
        ...this.localVisibleOrder.map((id) => ({ id, visible: true })),
        ...this.hiddenOrder.map((id) => ({ id, visible: false })),
      ];
    },
  },

  methods: {
    // ── Drag lifecycle ─────────────────────────────────────────────────────

    startDrag(id: WidgetKey, event: DragEvent) {
      this.draggingId = id;
      this.isDragging = true;
      event.dataTransfer?.setData('text/plain', id);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
    },

    endDrag() {
      this.draggingId = null;
      this.isDragging = false;
      this.dropTargetIdx = null;
      this.dragOverHidden = false;
    },

    // ── Drop handlers ──────────────────────────────────────────────────────

    /** Insert draggingId at targetIdx, delegating to the pure helper. */
    commitDrop(targetIdx: number) {
      if (!this.draggingId) return;
      this.localVisibleOrder = applyWidgetDrop(
        this.localVisibleOrder,
        this.draggingId,
        targetIdx
      );
      this.activeProfile = 'Custom';
      this.endDrag();
    },

    /** Drop on the hidden tray — remove from visible order. */
    onHiddenDrop() {
      if (!this.draggingId) return;
      this.hideWidget(this.draggingId);
      this.endDrag();
    },

    /**
     * Fallback canvas drop (fires only when NOT caught by a specific zone,
     * because zones use @drop.stop). Appends hidden widgets to the end.
     */
    onCanvasDrop() {
      if (!this.draggingId) return;
      if (!this.localVisibleOrder.includes(this.draggingId)) {
        this.localVisibleOrder = [...this.localVisibleOrder, this.draggingId];
        this.activeProfile = 'Custom';
      }
      this.endDrag();
    },

    // ── Widget visibility ──────────────────────────────────────────────────

    hideWidget(id: WidgetKey) {
      this.localVisibleOrder = this.localVisibleOrder.filter((k) => k !== id);
      this.activeProfile = 'Custom';
    },

    // ── Profile presets ────────────────────────────────────────────────────

    applyProfile(profile: Exclude<DashboardProfile, 'Custom'>) {
      this.activeProfile = profile;
      const layout = profileToLayout(profile);
      this.localVisibleOrder = layout.filter((c) => c.visible).map((c) => c.id);
    },

    resetToDefault() {
      this.localVisibleOrder = DEFAULT_LAYOUT.filter((c) => c.visible).map(
        (c) => c.id
      );
      this.activeProfile = 'Custom';
    },

    // ── Persistence ────────────────────────────────────────────────────────

    async save() {
      this.saving = true;
      try {
        const finalLayout = this.computedLayout;
        const doc = await fyo.doc.getDoc(ModelNameEnum.DashboardSettings);
        await doc.setMultiple({
          widgetLayout: JSON.stringify(finalLayout),
          activeProfile: this.activeProfile,
        });
        await doc.sync();
        this.$emit('saved', finalLayout, this.activeProfile);
        this.$emit('close');
      } finally {
        this.saving = false;
      }
    },
  },
});
</script>
