<template>
  <div class="list-row row no-gutters py-2 px-3">
    <slot></slot>
  </div>
</template>
<style lang="scss">
@import "../../styles/variables";
.list-row {
  cursor: pointer;
  border: 1px solid $border-color;
  background-color: var(--white);

  &:hover {
    background-color: var(--light);
  }
}

.list-row:not(:first-child) {
  border-top: none;
}
</style>
