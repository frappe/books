<template>
  <Dropdown
    v-if="actions && actions.length"
    class="text-xs"
    :items="items"
    :doc="doc"
    right
  >
    <template v-slot="{ toggleDropdown }">
      <Button :type="type" :icon="icon" @click="toggleDropdown()">
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
  props: {
    actions: { type: Array as PropType<Action[]>, default: () => [] },
    type: { type: String, default: 'secondary' },
    icon: { type: Boolean, default: true },
  },
  inject: {
    injectedDoc: {
      from: 'doc',
      default: undefined,
    },
  },
  components: {
    Dropdown,
    Button,
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
  },
});
</script>
