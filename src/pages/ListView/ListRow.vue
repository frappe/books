<template>
  <div class="list-row row no-gutters py-3 pr-3">
    <slot></slot>
  </div>
</template>
<style lang="scss">
@import '../../styles/variables';
.list-row {
  cursor: pointer;
  background-color: var(--white);

  &:hover {
    background-color: var(--white);
  }
}

.list-row:not(:first-child) {
  border-top: none;
}
</style>
