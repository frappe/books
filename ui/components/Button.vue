<template functional>
  <button type="button"
    :class="['btn btn-sm', 'btn-' + Object.keys(props).find(key => ['primary', 'secondary', 'light', 'dark', 'danger'].includes(key))]"
    v-bind="data.attrs"
    v-on="listeners">
    <slot></slot>
  </button>
</template>
