<template>
  <Dropdown
    v-if="actions && actions.length"
    class="text-xs"
    :items="actions"
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

<script>
import Button from 'src/components/Button';
import Dropdown from 'src/components/Dropdown';

export default {
  name: 'DropdownWithActions',
  props: {
    actions: { default: [] },
    type: { type: String, default: 'secondary' },
    icon: { type: Boolean, default: true },
  },
  inject: {
    doc: { default: null },
  },
  components: {
    Dropdown,
    Button,
  },
};
</script>
