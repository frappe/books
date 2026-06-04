<template>
  <Dropdown
    v-if="actions && actions.length"
    class="text-xs"
    :items="items"
    :doc="doc"
    right
  >
    <template #default="{ toggleDropdown }">
      <!-- CUSTOM: one-click when there's a single action -->
      <Button :type="type" :icon="icon" @click="onClick(toggleDropdown)">
        <slot>
          <feather-icon name="more-horizontal" class="w-4 h-4" />
        </slot>
      </Button>
    </template>
  </Dropdown>
</template>

<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import Button from 'src/components/Button.vue';
import Dropdown from 'src/components/Dropdown.vue';
import { DropdownItem } from 'src/utils/types';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'DropdownWithActions',
  components: {
    Dropdown,
    Button,
  },
  inject: {
    injectedDoc: {
      from: 'doc',
      default: undefined,
    },
  },
  props: {
    actions: { type: Array as PropType<Action[]>, default: () => [] },
    type: { type: String, default: 'secondary' },
    icon: { type: Boolean, default: true },
  },
  computed: {
    doc() {
      // @ts-ignore
      const doc = this.injectedDoc;
      if (doc instanceof Doc) {
        return doc;
      }

      return undefined;
    },
    items(): DropdownItem[] {
      return this.actions.map(({ label, group, component, action }) => ({
        label,
        group,
        action,
        component,
      }));
    },
    // CUSTOM: single bare action → click runs it directly
    singleAction(): Action | null {
      if (this.actions.length === 1 && !this.actions[0].component) {
        return this.actions[0];
      }
      return null;
    },
  },
  methods: {
    // CUSTOM: run single action on click, else open dropdown
    async onClick(toggleDropdown: () => void) {
      const single = this.singleAction;
      if (single && this.doc) {
        await single.action(this.doc, this.$router);
        return;
      }
      toggleDropdown();
    },
  },
});
</script>
