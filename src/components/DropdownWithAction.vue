<template>
  <Dropdown v-bind="$attrs">
    <template v-slot="{ toggleDropdown }">
      <div @click="toggleDropdown()">
        <slot></slot>
      </div>
    </template>
  </Dropdown>
</template>

<script>
import Dropdown from './Dropdown';

export default {
  name: 'DropdownWithAction',
  components: {
    Dropdown
  }
};
</script>

<style></style>
