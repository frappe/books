<template>
  <Dropdown
    v-if="actions && actions.length"
    class="text-xs"
    :items="actions"
    :doc="doc"
    right
  >
    <template v-slot="{ toggleDropdown }">
      <Button
        class="text-gray-900"
        :type="type"
        :icon="true"
        @click="toggleDropdown()"
      >
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
  },
  inject: ['doc'],
  components: {
    Dropdown,
    Button,
  },
};
</script>
