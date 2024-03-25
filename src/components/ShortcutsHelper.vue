<template>
  <div>
    <FormHeader :form-title="t`Shortcuts`" />
    <hr class="dark:border-gray-800"/>
    <div class="h-96 overflow-y-auto custom-scroll custom-scroll-thumb2 text-gray-900 dark:text-gray-100">
      <template v-for="g in groups" :key="g.label">
        <div class="p-4 w-full">
          <!-- Shortcut Group Header -->
          <div class="cursor-pointer mb-4" @click="g.collapsed = !g.collapsed">
            <div class="font-semibold">
              {{ g.label }}
            </div>
            <div class="text-base">
              {{ g.description }}
            </div>
          </div>
          <!-- Shortcuts -->
          <div v-if="!g.collapsed" class="flex flex-col gap-4">
            <div
              v-for="(s, i) in g.shortcuts"
              :key="g.label + ' ' + i"
              class="grid gap-4 items-start"
              style="grid-template-columns: 8rem auto"
            >
              <ShortcutKeys class="text-base" :keys="s.shortcut" />
              <div class="whitespace-normal text-base">{{ s.description }}</div>
            </div>
          </div>
          <!-- Shortcut count if collapsed -->
          <div v-else class="text-base text-gray-600 dark:text-gray-400">
            {{ t`${g.shortcuts.length} shortcuts` }}
          </div>
        </div>
        <hr class="dark:border-gray-800"/>
      </template>
      <div class="p-4 text-base text-gray-600 dark:text-gray-400">
        {{ t`More shortcuts will be added soon.` }}
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { t } from 'fyo';
import { ShortcutKey } from 'src/utils/ui';
import { defineComponent } from 'vue';
import FormHeader from './FormHeader.vue';
import ShortcutKeys from './ShortcutKeys.vue';

type Group = {
  label: string;
  description: string;
  collapsed: boolean;
  shortcuts: { shortcut: string[]; description: string }[];
};

export default defineComponent({
  components: { FormHeader, ShortcutKeys },
  data() {
    return { groups: [] } as { groups: Group[] };
  },
  mounted() {
    this.groups = [
      {
        label: t`Global`,
        description: t`Applicable anywhere in Frappe Books`,
        collapsed: false,
        shortcuts: [
          {
            shortcut: [ShortcutKey.pmod, 'K'],
            description: t`Open Quick Search`,
          },
          {
            shortcut: [ShortcutKey.shift, ShortcutKey.delete],
            description: t`Go back to the previous page`,
          },
          {
            shortcut: [ShortcutKey.shift, 'H'],
            description: t`Toggle sidebar`,
          },
          {
            shortcut: ['F1'],
            description: t`Open Documentation`,
          },
        ],
      },
      {
        label: t`Entry`,
        description: t`Applicable when a entry is open in the Form view or Quick Edit view`,
        collapsed: false,
        shortcuts: [
          {
            shortcut: [ShortcutKey.pmod, 'S'],
            description: [
              t`Save or Submit an entry.`,
              t`An entry is submitted only if it is submittable and is in the saved state.`,
            ].join(' '),
          },
          {
            shortcut: [ShortcutKey.pmod, ShortcutKey.delete],
            description: [
              t`Cancel or Delete an entry.`,
              t`An entry is cancelled only if it is in the submitted state.`,
              t`A submittable entry is deleted only if it is in the cancelled state.`,
            ].join(' '),
          },
          {
            shortcut: [ShortcutKey.pmod, 'P'],
            description: t`Open Print View if Print is available.`,
          },
          {
            shortcut: [ShortcutKey.pmod, 'L'],
            description: t`Toggle Linked Entries widget, not available in Quick Edit view.`,
          },
        ],
      },
      {
        label: t`List View`,
        description: t`Applicable when the List View of an entry type is open`,
        collapsed: false,
        shortcuts: [
          {
            shortcut: [ShortcutKey.pmod, 'N'],
            description: t`Create a new entry of the same type as the List View`,
          },
          {
            shortcut: [ShortcutKey.pmod, 'E'],
            description: t`Open the Export Wizard modal`,
          },
        ],
      },
      {
        label: t`Quick Search`,
        description: t`Applicable when Quick Search is open`,
        collapsed: false,
        shortcuts: [
          { shortcut: [ShortcutKey.esc], description: t`Close Quick Search` },
          {
            shortcut: [ShortcutKey.pmod, '1'],
            description: t`Toggle the Docs filter`,
          },
          {
            shortcut: [ShortcutKey.pmod, '2'],
            description: t`Toggle the List filter`,
          },
          {
            shortcut: [ShortcutKey.pmod, '3'],
            description: t`Toggle the Create filter`,
          },
          {
            shortcut: [ShortcutKey.pmod, '4'],
            description: t`Toggle the Report filter`,
          },
          {
            shortcut: [ShortcutKey.pmod, '5'],
            description: t`Toggle the Page filter`,
          },
        ],
      },
      {
        label: t`Template Builder`,
        description: t`Applicable when Template Builder is open`,
        collapsed: false,
        shortcuts: [
          {
            shortcut: [ShortcutKey.ctrl, ShortcutKey.enter],
            description: t`Apply and view changes made to the print template`,
          },
          {
            shortcut: [ShortcutKey.ctrl, 'E'],
            description: t`Toggle Edit Mode`,
          },
          {
            shortcut: [ShortcutKey.ctrl, 'H'],
            description: t`Toggle Key Hints`,
          },
          {
            shortcut: [ShortcutKey.ctrl, '+'],
            description: t`Increase print template display scale`,
          },
          {
            shortcut: [ShortcutKey.ctrl, '-'],
            description: t`Decrease print template display scale`,
          },
        ],
      },
    ];
  },
});
</script>
