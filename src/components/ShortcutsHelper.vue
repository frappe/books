<template>
  <div>
    <FormHeader :form-title="t`Shortcuts`" />
    <hr />
    <div class="h-96 overflow-y-auto text-gray-900">
      <template v-for="g in groups" :key="g.label">
        <div class="p-4 w-full">
          <!-- Shortcut Group Header -->
          <div @click="g.collapsed = !g.collapsed" class="cursor-pointer mb-4">
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
              style="grid-template-columns: 6rem auto"
            >
              <!-- <div class="w-2 text-base">{{ i + 1 }}.</div> -->
              <div
                class="
                  text-base
                  font-medium
                  flex-shrink-0 flex
                  items-center
                  gap-1
                  bg-gray-200
                  text-gray-700
                  px-1.5
                  py-0.5
                  rounded
                "
                style="width: fit-content"
              >
                <span
                  v-for="k in s.shortcut"
                  :key="k"
                  class="tracking-tighter"
                  >{{ k }}</span
                >
              </div>
              <div class="whitespace-normal text-base">{{ s.description }}</div>
            </div>
          </div>
          <!-- Shortcut count if collapsed -->
          <div v-else class="text-base text-gray-600">
            {{ t`${g.shortcuts.length} shortcuts` }}
          </div>
        </div>
        <hr />
      </template>
      <div class="p-4 text-base text-gray-600">
        {{ t`More shortcuts will be added soon.` }}
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { t } from 'fyo';
import { defineComponent } from 'vue';
import FormHeader from './FormHeader.vue';

type Group = {
  label: string;
  description: string;
  collapsed: boolean;
  shortcuts: { shortcut: string[]; description: string }[];
};

export default defineComponent({
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
            shortcut: [this.pmod, 'K'],
            description: t`Open Quick Search`,
          },
          {
            shortcut: [this.del],
            description: t`Go back to the previous page`,
          },
          {
            shortcut: [this.shift, 'H'],
            description: t`Toggle sidebar`,
          },
          {
            shortcut: ['F1'],
            description: t`Open Documentation`,
          },
        ],
      },
      {
        label: t`Doc`,
        description: t`Applicable when a Doc is open in the Form view or Quick Edit view`,
        collapsed: false,
        shortcuts: [
          {
            shortcut: [this.pmod, 'S'],
            description: [
              t`Save or Submit a doc.`,
              t`A doc is submitted only if it is submittable and is in the saved state.`,
            ].join(' '),
          },
          {
            shortcut: [this.pmod, this.del],
            description: [
              t`Cancel or Delete a doc.`,
              t`A doc is cancelled only if it is in the submitted state.`,
              t`A submittable doc is deleted only if it is in the cancelled state.`,
            ].join(' '),
          },
        ],
      },
      {
        label: t`Quick Search`,
        description: t`Applicable when Quick Search is open`,
        collapsed: false,
        shortcuts: [
          { shortcut: [this.esc], description: t`Close Quick Search` },
          {
            shortcut: [this.pmod, '1'],
            description: t`Toggle the Docs filter`,
          },
          {
            shortcut: [this.pmod, '2'],
            description: t`Toggle the List filter`,
          },
          {
            shortcut: [this.pmod, '3'],
            description: t`Toggle the Create filter`,
          },
          {
            shortcut: [this.pmod, '4'],
            description: t`Toggle the Report filter`,
          },
          {
            shortcut: [this.pmod, '5'],
            description: t`Toggle the Page filter`,
          },
        ],
      },
    ];
  },
  computed: {
    pmod() {
      if (this.isMac) {
        return '⌘';
      }

      return 'Ctrl';
    },
    shift() {
      if (this.isMac) {
        return 'shift';
      }

      return '⇧';
    },
    alt() {
      if (this.isMac) {
        return '⌥';
      }

      return 'Alt';
    },
    del() {
      if (this.isMac) {
        return 'delete';
      }

      return 'Backspace';
    },
    esc() {
      if (this.isMac) {
        return 'esc';
      }

      return 'Esc';
    },
    isMac() {
      return this.platform === 'Mac';
    },
  },
  components: { FormHeader },
});
</script>
