<template>
  <div class="dropdown show">
      <a class="btn btn-sm btn-secondary dropdown-toggle"
        href="#"
        role="button"
        id="dropdownMenuLink"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false">
        {{label}}
      </a>
      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuLink">
        <a class="dropdown-item"
          v-for="option in options"
          :key="option.label"
          @click="option.handler">
          {{option.label}}
        </a>
      </div>
  </div>
</template>
<script>
export default {
  props: ['label', 'options']
}
</script>
<style>

</style>

